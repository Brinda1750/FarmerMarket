# CI/CD module with CodeCommit, CodeBuild, and CodePipeline

# S3 bucket for build artifacts
resource "aws_s3_bucket" "artifacts" {
  bucket = "${var.project_name}-build-artifacts-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = merge(var.tags, {
    Name = "${var.project_name}-build-artifacts-${var.environment}"
  })
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    id     = "delete_old_artifacts"
    status = "Enabled"

    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

# CodeCommit repository
resource "aws_codecommit_repository" "main" {
  repository_name = "${var.project_name}-${var.environment}"
  description     = "${var.project_name} ${var.environment} repository"

  tags = var.tags
}

# CodeBuild project
resource "aws_codebuild_project" "main" {
  name          = "${var.project_name}-build-${var.environment}"
  description   = "Build project for ${var.project_name} ${var.environment}"
  service_role  = aws_iam_role.codebuild.arn
  build_timeout = "60"
  queued_timeout = "480"

  artifacts {
    type = "S3"
    location = aws_s3_bucket.artifacts.bucket
    packaging = "ZIP"
    name = "${var.project_name}-${var.environment}.zip"
    encryption_disabled = false
  }

  cache {
    type = "S3"
    location = aws_s3_bucket.artifacts.bucket
  }

  environment {
    compute_type = "BUILD_GENERAL1_SMALL"
    image = "aws/codebuild/standard:7.0"
    type = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name = "S3_BUCKET"
      value = var.bucket_name
    }

    environment_variable {
      name = "ENVIRONMENT"
      value = var.environment
    }

    environment_variable {
      name = "PROJECT_NAME"
      value = var.project_name
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name = "/aws/codebuild/${var.project_name}-${var.environment}"
      stream_name = "build-logs"
    }

    s3_logs {
      status = "ENABLED"
      location = "${aws_s3_bucket.artifacts.id}/build-logs"
    }
  }

  source {
    type = "CODECOMMIT"
    location = aws_codecommit_repository.main.clone_url_http
    git_clone_depth = 1

    buildspec = file("${path.module}/buildspec.yml")
  }

  tags = var.tags
}

# CodePipeline
resource "aws_codepipeline" "main" {
  name     = "${var.project_name}-pipeline-${var.environment}"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"

    encryption_key {
      id   = var.kms_key_arn
      type = "KMS"
    }
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeCommit"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        RepositoryName = aws_codecommit_repository.main.repository_name
        BranchName     = "main"
      }
    }
  }

  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]

      configuration = {
        ProjectName = aws_codebuild_project.main.name
      }
    }
  }

  stage {
    name = "Deploy"

    action {
      name            = "Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "S3"
      version         = "1"
      input_artifacts = ["build_output"]

      configuration = {
        BucketName = var.bucket_name
        Extract = "true"
      }
    }
  }

  # Manual approval for production
  dynamic "stage" {
    for_each = var.require_approval ? [1] : []
    content {
      name = "ManualApproval"

      action {
        name     = "Approval"
        category = "Approval"
        owner    = "AWS"
        provider = "Manual"
        version  = "1"

        configuration = {
          CustomData = "Please approve the deployment to ${var.environment}"
        }
      }
    }
  }

  tags = var.tags
}

# Lambda function for CloudFront invalidation
resource "aws_lambda_function" "cloudfront_invalidation" {
  function_name = "${var.project_name}-cf-invalidation-${var.environment}"
  handler       = "index.handler"
  runtime       = "python3.11"
  role          = aws_iam_role.lambda_invalidation.arn

  filename = data.archive_file.lambda_invalidation.output_path
  source_code_hash = data.archive_file.lambda_invalidation.output_base64sha256

  timeout = 300

  environment {
    variables = {
      DISTRIBUTION_ID = var.distribution_id
    }
  }

  tags = var.tags
}

data "archive_file" "lambda_invalidation" {
  type        = "zip"
  source_file = "${path.module}/lambda_invalidation.py"
  output_path = "${path.module}/lambda_invalidation.zip"
}

# CloudWatch Events rule to trigger invalidation after deployment
resource "aws_cloudwatch_event_rule" "codepipeline_complete" {
  name = "${var.project_name}-pipeline-complete-${var.environment}"

  event_pattern = jsonencode({
    source = ["aws.codepipeline"]
    detail-type = ["CodePipeline Pipeline Execution State Change"]
    detail = {
      state = ["SUCCEEDED"]
      pipeline = [aws_codepipeline.main.name]
    }
  })
}

resource "aws_cloudwatch_event_target" "lambda_invalidation" {
  rule = aws_cloudwatch_event_rule.codepipeline_complete.name
  arn = aws_lambda_function.cloudfront_invalidation.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id = "AllowExecutionFromCloudWatch"
  action = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cloudfront_invalidation.function_name
  principal = "events.amazonaws.com"
  source_arn = aws_cloudwatch_event_rule.codepipeline_complete.arn
}

# IAM Role for CodeBuild
resource "aws_iam_role" "codebuild" {
  name = "${var.project_name}-codebuild-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "codebuild" {
  name = "${var.project_name}-codebuild-policy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.artifacts.arn}/*",
          "${aws_s3_bucket.artifacts.arn}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codecommit:GitPull"
        ]
        Resource = aws_codecommit_repository.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.bucket_name}",
          "arn:aws:s3:::${var.bucket_name}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = [
          var.kms_key_arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "codebuild" {
  role       = aws_iam_role.codebuild.name
  policy_arn = aws_iam_policy.codebuild.arn
}

# IAM Role for CodePipeline
resource "aws_iam_role" "codepipeline" {
  name = "${var.project_name}-codepipeline-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "codepipeline" {
  name = "${var.project_name}-codepipeline-policy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.artifacts.arn}/*",
          "${aws_s3_bucket.artifacts.arn}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codecommit:GetBranch",
          "codecommit:GetCommit",
          "codecommit:GetRepository",
          "codecommit:GitPull"
        ]
        Resource = aws_codecommit_repository.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = aws_codebuild_project.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = [
          var.kms_key_arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "codepipeline" {
  role       = aws_iam_role.codepipeline.name
  policy_arn = aws_iam_policy.codepipeline.arn
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_invalidation" {
  name = "${var.project_name}-lambda-invalidation-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "lambda_invalidation" {
  name = "${var.project_name}-lambda-invalidation-policy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_invalidation" {
  role       = aws_iam_role.lambda_invalidation.name
  policy_arn = aws_iam_policy.lambda_invalidation.arn
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

variable "bucket_name" {
  description = "S3 bucket name for deployment"
  type        = string
}

variable "distribution_id" {
  description = "CloudFront distribution ID for invalidation"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "require_approval" {
  description = "Require manual approval for deployment"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default = {}
}

# Outputs
output "codecommit_repository_id" {
  value = aws_codecommit_repository.main.repository_id
}

output "codebuild_project_name" {
  value = aws_codebuild_project.main.name
}

output "codepipeline_name" {
  value = aws_codepipeline.main.name
}

output "artifacts_bucket_name" {
  value = aws_s3_bucket.artifacts.id
}