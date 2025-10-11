# ECR repositories for container images

# ECR Repository for GoTrue
resource "aws_ecr_repository" "gotrue" {
  name = "${var.project_name}/gotrue"

  image_scanning_configuration {
    scan_on_push = true
  }

  image_tag_mutability = "MUTABLE"

  encryption_configuration {
    encryption_type = "KMS"
    kms_key = var.kms_key_arn
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-ecr-gotrue-${var.environment}"
  })
}

# ECR Repository for PostgREST
resource "aws_ecr_repository" "postgrest" {
  name = "${var.project_name}/postgrest"

  image_scanning_configuration {
    scan_on_push = true
  }

  image_tag_mutability = "MUTABLE"

  encryption_configuration {
    encryption_type = "KMS"
    kms_key = var.kms_key_arn
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-ecr-postgrest-${var.environment}"
  })
}

# ECR Repository for Realtime
resource "aws_ecr_repository" "realtime" {
  name = "${var.project_name}/realtime"

  image_scanning_configuration {
    scan_on_push = true
  }

  image_tag_mutability = "MUTABLE"

  encryption_configuration {
    encryption_type = "KMS"
    kms_key = var.kms_key_arn
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-ecr-realtime-${var.environment}"
  })
}

# ECR Repository for Storage
resource "aws_ecr_repository" "storage" {
  name = "${var.project_name}/storage"

  image_scanning_configuration {
    scan_on_push = true
  }

  image_tag_mutability = "MUTABLE"

  encryption_configuration {
    encryption_type = "KMS"
    kms_key = var.kms_key_arn
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-ecr-storage-${var.environment}"
  })
}

# ECR Repository for Studio
resource "aws_ecr_repository" "studio" {
  name = "${var.project_name}/studio"

  image_scanning_configuration {
    scan_on_push = true
  }

  image_tag_mutability = "MUTABLE"

  encryption_configuration {
    encryption_type = "KMS"
    kms_key = var.kms_key_arn
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-ecr-studio-${var.environment}"
  })
}

# ECR Lifecycle Policy for all repositories
resource "aws_ecr_lifecycle_policy" "common" {
  for_each = {
    gotrue = aws_ecr_repository.gotrue.name
    postgrest = aws_ecr_repository.postgrest.name
    realtime = aws_ecr_repository.realtime.name
    storage = aws_ecr_repository.storage.name
    studio = aws_ecr_repository.studio.name
  }

  repository = each.value

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description = "Keep last 30 tagged images"
        selection = {
          tagStatus = "tagged"
          tagPrefixList = ["v"]
          countType = "imageCountMoreThan"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description = "Delete untagged images older than 1 day"
        selection = {
          tagStatus = "untagged"
          countType = "sinceImagePushed"
          countUnit = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Data source for external script to pull latest versions
data "external" "supabase_versions" {
  program = ["python3", "${path.module}/get_versions.py"]
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

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default = {}
}

# Outputs
output "repository_urls" {
  value = {
    gotrue = aws_ecr_repository.gotrue.repository_url
    postgrest = aws_ecr_repository.postgrest.repository_url
    realtime = aws_ecr_repository.realtime.repository_url
    storage = aws_ecr_repository.storage.repository_url
    studio = aws_ecr_repository.studio.repository_url
  }
}

output "repository_arns" {
  value = {
    gotrue = aws_ecr_repository.gotrue.arn
    postgrest = aws_ecr_repository.postgrest.arn
    realtime = aws_ecr_repository.realtime.arn
    storage = aws_ecr_repository.storage.arn
    studio = aws_ecr_repository.studio.arn
  }
}