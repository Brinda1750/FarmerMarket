# Data platform module with Aurora PostgreSQL and ElastiCache Redis

# Aurora PostgreSQL cluster
resource "aws_rds_cluster" "main" {
  engine                = "aurora-postgresql"
  engine_version        = "15.4"
  database_name         = "farmermarket"
  master_username       = "postgres"
  master_password       = var.db_password
  skip_final_snapshot   = true
  storage_encrypted     = true
  storage_type          = "aurora"
  kms_key_id           = var.kms_key_arn
  apply_immediately     = true
  db_subnet_group_name  = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  enable_http_endpoint  = true

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"

  # Performance Insights enabled by default for production
  performance_insights_enabled = !var.enable_serverless
  performance_insights_retention_period = !var.enable_serverless ? 7 : null

  # Backtrack enabled for PostgreSQL
  backtrack_window = !var.enable_serverless ? 72 : null

  # Serverless v2 configuration only for dev/staging
  dynamic "serverlessv2_scaling_configuration" {
    for_each = var.enable_serverless ? [1] : []
    content {
      min_capacity = 1  # Minimum 1 ACU as per plan
      max_capacity = 2
    }
  }

  # Instance configuration for non-serverless (default for prod)
  dynamic "scaling_configuration" {
    for_each = var.enable_serverless ? [] : [1]
    content {
      auto_pause = false
      min_capacity = var.instance_count
      max_capacity = var.instance_count
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-aurora-${var.environment}"
  })
}

# Aurora instances (only if not serverless)
resource "aws_rds_cluster_instance" "main" {
  count = var.enable_serverless ? 1 : var.instance_count

  identifier         = "${var.project_name}-aurora-${var.environment}-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.enable_serverless ? "db.serverless" : var.instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version
  db_subnet_group_name = aws_db_subnet_group.main.name
  publicly_accessible  = false
  performance_insights_enabled = !var.enable_serverless

  tags = merge(var.tags, {
    Name = "${var.project_name}-aurora-${var.environment}-${count.index}"
  })
}

# Read replica (for production)
resource "aws_rds_cluster_instance" "read_replica" {
  count = var.enable_read_replica && !var.enable_serverless ? 1 : 0

  identifier = "${var.project_name}-aurora-${var.environment}-read"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class = var.instance_class
  engine = aws_rds_cluster.main.engine
  engine_version = aws_rds_cluster.main.engine_version
  db_subnet_group_name = aws_db_subnet_group.main.name
  publicly_accessible = false

  tags = merge(var.tags, {
    Name = "${var.project_name}-aurora-${var.environment}-read"
  })
}

# DB subnet group
resource "aws_db_subnet_group" "main" {
  name = "${var.project_name}-db-subnet-group-${var.environment}"
  subnet_ids = var.private_subnets

  tags = merge(var.tags, {
    Name = "${var.project_name}-db-subnet-group-${var.environment}"
  })
}

# Security group for RDS
resource "aws_security_group" "rds" {
  name = "${var.project_name}-rds-sg-${var.environment}"
  description = "Security group for RDS"
  vpc_id = var.vpc_id

  ingress {
    from_port = 5432
    to_port = 5432
    protocol = "tcp"
    security_groups = [var.ecs_security_group_id]
  }

  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-rds-sg-${var.environment}"
  })
}

# ElastiCache Redis subnet group
resource "aws_elasticache_subnet_group" "main" {
  name = "${var.project_name}-redis-subnet-group-${var.environment}"
  subnet_ids = var.private_subnets

  tags = merge(var.tags, {
    Name = "${var.project_name}-redis-subnet-group-${var.environment}"
  })
}

# ElastiCache Redis cluster
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${var.project_name}-redis-${var.environment}"
  description = "Redis cluster for ${var.project_name} ${var.environment}"

  engine = "redis"
  engine_version = "7.0"
  node_type = var.redis_node_type
  port = 6379
  parameter_group_name = "default.redis7"

  num_cache_clusters = var.redis_cluster_size
  automatic_failover_enabled = var.redis_cluster_size > 1

  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token = var.redis_auth_token

  snapshot_retention_limit = 7
  snapshot_window = "05:00-06:00"
  maintenance_window = "sun:06:00-sun:07:00"

  tags = merge(var.tags, {
    Name = "${var.project_name}-redis-${var.environment}"
  })
}

# Security group for Redis
resource "aws_security_group" "redis" {
  name = "${var.project_name}-redis-sg-${var.environment}"
  description = "Security group for Redis"
  vpc_id = var.vpc_id

  ingress {
    from_port = 6379
    to_port = 6379
    protocol = "tcp"
    security_groups = [var.ecs_security_group_id]
  }

  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-redis-sg-${var.environment}"
  })
}

# S3 bucket for Supabase storage
resource "aws_s3_bucket" "supabase_storage" {
  bucket = "${var.project_name}-supabase-storage-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = merge(var.tags, {
    Name = "${var.project_name}-supabase-storage-${var.environment}"
  })
}

resource "aws_s3_bucket_versioning" "supabase_storage" {
  bucket = aws_s3_bucket.supabase_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "supabase_storage" {
  bucket = aws_s3_bucket.supabase_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
      kms_master_key_id = var.kms_key_arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "supabase_storage" {
  bucket = aws_s3_bucket.supabase_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CORS configuration for storage bucket
resource "aws_s3_bucket_cors_configuration" "supabase_storage" {
  bucket = aws_s3_bucket.supabase_storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["https://${var.domain_name}", "https://api.${var.domain_name}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# AWS Backup
resource "aws_backup_vault" "main" {
  name = "${var.project_name}-backup-vault-${var.environment}"

  tags = merge(var.tags, {
    Name = "${var.project_name}-backup-vault-${var.environment}"
  })
}

resource "aws_backup_plan" "main" {
  name = "${var.project_name}-backup-plan-${var.environment}"

  rule {
    rule_name = "daily_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule = "cron(0 3 ? * * *)"

    lifecycle {
      delete_after = 30
    }

    recovery_point_tags = merge(var.tags, {
      Name = "${var.project_name}-backup-${var.environment}"
    })
  }
}

resource "aws_backup_selection" "rds" {
  iam_role_arn = aws_iam_role.backup.arn
  name = "${var.project_name}-rds-backup-${var.environment}"
  plan_id = aws_backup_plan.main.id

  resources = [
    aws_rds_cluster.main.arn
  ]
}

resource "aws_backup_selection" "s3" {
  iam_role_arn = aws_iam_role.backup.arn
  name = "${var.project_name}-s3-backup-${var.environment}"
  plan_id = aws_backup_plan.main.id

  resources = [
    aws_s3_bucket.supabase_storage.arn
  ]
}

# IAM role for AWS Backup
resource "aws_iam_role" "backup" {
  name = "${var.project_name}-backup-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "backup" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
  role       = aws_iam_role.backup.name
}

# Random suffix for unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Variables
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnets" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "ECS security group ID"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name"
  type        = string
  default     = ""
}

variable "enable_serverless" {
  description = "Enable Aurora Serverless v2"
  type        = bool
  default     = true
}

variable "instance_class" {
  description = "RDS instance class (if not serverless)"
  type        = string
  default     = "db.r6g.large"
}

variable "allocated_storage" {
  description = "Allocated storage in GB (if not serverless)"
  type        = number
  default     = 100
}

variable "instance_count" {
  description = "Number of DB instances"
  type        = number
  default     = 2
}

variable "enable_read_replica" {
  description = "Enable read replica"
  type        = bool
  default     = false
}

variable "redis_node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_cluster_size" {
  description = "Redis cluster size"
  type        = number
  default     = 1
}

variable "redis_auth_token" {
  description = "Redis auth token"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default = {}
}

# Outputs
output "db_endpoint" {
  value = aws_rds_cluster.main.endpoint
}

output "db_port" {
  value = aws_rds_cluster.main.port
}

output "db_resource_id" {
  value = aws_rds_cluster.main.cluster_resource_id
}

output "db_identifier" {
  value = aws_rds_cluster.main.cluster_identifier
}

output "db_cluster_arn" {
  value = aws_rds_cluster.main.arn
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "redis_port" {
  value = aws_elasticache_replication_group.main.port
}

output "storage_bucket_name" {
  value = aws_s3_bucket.supabase_storage.id
}

output "storage_bucket_arn" {
  value = aws_s3_bucket.supabase_storage.arn
}
