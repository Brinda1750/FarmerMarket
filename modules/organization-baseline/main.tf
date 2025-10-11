# Organization baseline module for audit, security, and IAM setup

data "aws_caller_identity" "current" {}

locals {
  deployment_assume_principal = var.deployment_principal_arn != "" ? var.deployment_principal_arn : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"

  readonly_assume_principals = length(var.readonly_principal_arns) > 0 ? var.readonly_principal_arns : ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]

  budget_notification_configs = length(var.budget_notification_emails) > 0 ? [
    {
      threshold = var.budget_warning_threshold
      metric    = "warning"
    },
    {
      threshold = var.budget_critical_threshold
      metric    = "critical"
    }
  ] : []
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "main" {
  name                          = "${var.project_name}-cloudtrail-${var.environment}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::"]
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-cloudtrail"
  })
}

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "${var.project_name}-cloudtrail-logs-${var.environment}-${random_id.bucket_suffix.hex}"
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_logs.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# AWS Config for configuration tracking
resource "aws_config_configuration_recorder" "main" {
  name     = "${var.project_name}-config-recorder-${var.environment}"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "${var.project_name}-config-channel-${var.environment}"
  s3_bucket_name = aws_s3_bucket.config_logs.id
  depends_on = [aws_config_configuration_recorder.main, aws_s3_bucket_policy.config_logs]
}

resource "aws_config_configuration_recorder_status" "main" {
  name = aws_config_configuration_recorder.main.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

# S3 bucket for Config logs
resource "aws_s3_bucket" "config_logs" {
  bucket = "${var.project_name}-config-logs-${var.environment}-${random_id.bucket_suffix.hex}"
}

resource "aws_s3_bucket_versioning" "config_logs" {
  bucket = aws_s3_bucket.config_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_logs" {
  bucket = aws_s3_bucket.config_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "config_logs" {
  bucket = aws_s3_bucket.config_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "config_logs" {
  bucket = aws_s3_bucket.config_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_logs.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_logs.arn
      },
      {
        Sid    = "AWSConfigBucketWrite"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# GuardDuty for threat detection
resource "aws_guardduty_detector" "main" {
  enable = true
}

# Security Hub for security findings aggregation
resource "aws_securityhub_account" "main" {}

# AWS Config IAM role
resource "aws_iam_role" "config_role" {
  name = "${var.project_name}-config-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# Deployment IAM role
resource "aws_iam_role" "deployment_role" {
  count = var.deployment_principal_arn != "" ? 1 : 0

  name = "${var.project_name}-deployment-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = var.deployment_principal_arn
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "deployment_policy" {
  count = var.deployment_principal_arn != "" ? 1 : 0

  name = "${var.project_name}-deployment-policy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:*",
          "ecs:*",
          "rds:*",
          "s3:*",
          "elasticloadbalancing:*",
          "autoscaling:*",
          "cloudwatch:*",
          "logs:*",
          "secretsmanager:*",
          "ssm:*",
          "iam:PassRole"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "deployment_policy" {
  count = var.deployment_principal_arn != "" ? 1 : 0

  role       = aws_iam_role.deployment_role[0].name
  policy_arn = aws_iam_policy.deployment_policy[0].arn
}

# Read-only role
resource "aws_iam_role" "readonly_role" {
  count = length(var.readonly_principal_arns) > 0 ? 1 : 0

  name = "${var.project_name}-readonly-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = var.readonly_principal_arns
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "readonly_policy" {
  count = length(var.readonly_principal_arns) > 0 ? 1 : 0

  role       = aws_iam_role.readonly_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# Budget alarms
resource "aws_budgets_budget" "monthly" {
  name              = "${var.project_name}-budget-${var.environment}"
  budget_type       = "COST"
  limit_amount      = var.budget_limit_amount
  limit_unit        = "USD"
  time_unit         = "MONTHLY"

  dynamic "notification" {
    for_each = local.budget_notification_configs

    content {
      comparison_operator        = "GREATER_THAN"
      notification_type          = "ACTUAL"
      threshold_type             = "PERCENTAGE"
      threshold                   = notification.value.threshold
      subscriber_email_addresses = var.budget_notification_emails
    }
  }

  tags = var.tags
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

variable "deployment_principal_arn" {
  description = "ARN of principal for deployment role"
  type        = string
  default     = ""
}

variable "readonly_principal_arns" {
  description = "List of ARNs for read-only access"
  type        = list(string)
  default     = []
}

variable "budget_limit_amount" {
  description = "Monthly budget limit in USD"
  type        = string
  default     = "500"
}

variable "budget_warning_threshold" {
  description = "Budget warning threshold percentage"
  type        = string
  default     = "80"
}

variable "budget_critical_threshold" {
  description = "Budget critical threshold percentage"
  type        = string
  default     = "100"
}

variable "budget_notification_emails" {
  description = "Email addresses for budget notifications"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default = {}
}

# Outputs
output "cloudtrail_bucket_name" {
  value = aws_s3_bucket.cloudtrail_logs.id
}

output "deployment_role_arn" {
  value = length(aws_iam_role.deployment_role) > 0 ? aws_iam_role.deployment_role[0].arn : null
}

output "readonly_role_arn" {
  value = length(aws_iam_role.readonly_role) > 0 ? aws_iam_role.readonly_role[0].arn : null
}
