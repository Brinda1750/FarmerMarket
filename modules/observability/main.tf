# Observability module with CloudWatch dashboards and alarms

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "ecs" {
  name = "/aws/ecs/${var.cluster_name}"
  retention_in_days = 30

  tags = var.tags
}

# Enable X-Ray for ECS
resource "aws_xray_sampling_rule" "main" {
  rule_name      = "${var.project_name}-xray-${var.environment}"
  priority       = 100
  fixed_rate     = 0.1  # 10% sampling
  reservoir_size = 100
  service_name   = "*"
  service_type   = "*"
  host           = "*"
  http_method    = "*"
  url_path       = "*"
  version        = 1
  resource_arn   = "*"
}

# CloudWatch Query Definitions for Log Insights
resource "aws_cloudwatch_query_definition" "ecs_errors" {
  name = "${var.project_name}-ecs-errors-${var.environment}"

  log_group_names = [
    aws_cloudwatch_log_group.ecs.name
  ]

  query_string = <<-EOT
    fields @timestamp, @message
    | filter @message like /ERROR/ or @message like /Exception/
    | stats count() as errorCount by bin(5m)
    | sort errorCount desc
    | limit 100
  EOT
}

resource "aws_cloudwatch_query_definition" "api_latency" {
  name = "${var.project_name}-api-latency-${var.environment}"

  log_group_names = [
    aws_cloudwatch_log_group.ecs.name
  ]

  query_string = <<-EOT
    fields @timestamp, @message
    | parse @message "duration=*" as duration
    | stats avg(duration) as avgLatency, p95(duration) as p95Latency by bin(5m)
    | sort avgLatency desc
    | limit 100
  EOT
}

resource "aws_cloudwatch_query_definition" "db_connections" {
  name = "${var.project_name}-db-connections-${var.environment}"

  log_group_names = [
    aws_cloudwatch_log_group.ecs.name
  ]

  query_string = <<-EOT
    fields @timestamp, @message
    | filter @message like /connection/ or @message like /database/
    | stats count() as connectionEvents by bin(5m)
    | sort connectionEvents desc
    | limit 100
  EOT
}

resource "aws_cloudwatch_query_definition" "supabase_auth" {
  name = "${var.project_name}-supabase-auth-${var.environment}"

  log_group_names = [
    aws_cloudwatch_log_group.ecs.name
  ]

  query_string = <<-EOT
    fields @timestamp, @message
    | filter @message like /auth/ or @message like /gotrue/
    | parse @message "level=* msg=*" as level, msg
    | stats count() as authEvents by level, bin(5m)
    | sort authEvents desc
    | limit 100
  EOT
}

resource "aws_cloudwatch_query_definition" "postgrest_queries" {
  name = "${var.project_name}-postgrest-queries-${var.environment}"

  log_group_names = [
    aws_cloudwatch_log_group.ecs.name
  ]

  query_string = <<-EOT
    fields @timestamp, @message
    | filter @message like /POSTGRESQL/ or @message like /postgrest/
    | parse @message "request_time=*ms" as request_time
    | stats avg(request_time) as avgTime, p95(request_time) as p95Time by bin(5m)
    | sort avgTime desc
    | limit 100
  EOT
}

resource "aws_cloudwatch_log_group" "lambda" {
  name = "/aws/lambda/${var.project_name}-${var.environment}"
  retention_in_days = 30

  tags = var.tags
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn, {"period": 60}],
            [".", "TargetResponseTime", ".", ".", {"stat": "Average", "period": 60}],
            [".", "HTTPCode_Target_2XX_Count", ".", ".", {"stat": "Sum", "period": 60}],
            [".", "HTTPCode_Target_5XX_Count", ".", ".", {"stat": "Sum", "period": 60}]
          ]
          view = "timeSeries"
          stacked = false
          region = var.aws_region
          title = "Application Load Balancer Metrics"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.cluster_name, {"period": 60}],
            [".", "MemoryUtilization", ".", ".", {"stat": "Average", "period": 60}],
            [".", "RunningTaskCount", ".", ".", {"stat": "Average", "period": 60}]
          ]
          view = "timeSeries"
          stacked = false
          region = var.aws_region
          title = "ECS Service Metrics"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.db_identifier, {"period": 60}],
            [".", "DatabaseConnections", ".", ".", {"stat": "Average", "period": 60}],
            [".", "FreeStorageSpace", ".", ".", {"stat": "Average", "period": 60}],
            [".", "ReadLatency", ".", ".", {"stat": "Average", "period": 60}],
            [".", "WriteLatency", ".", ".", {"stat": "Average", "period": 60}]
          ]
          view = "timeSeries"
          stacked = false
          region = var.aws_region
          title = "RDS Aurora Metrics"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/CloudFront", "Requests", "DistributionId", var.distribution_id, {"period": 60}],
            [".", "BytesDownloaded", ".", ".", {"stat": "Sum", "period": 60}],
            [".", "4xxErrorRate", ".", ".", {"stat": "Average", "period": 60}],
            [".", "5xxErrorRate", ".", ".", {"stat": "Average", "period": 60}]
          ]
          view = "timeSeries"
          stacked = false
          region = var.aws_region
          title = "CloudFront Metrics"
          period = 300
        }
      }
    ]
  })
}

# CloudWatch Alarms

# ALB 5XX Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name = "${var.project_name}-alb-5xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods = "2"
  metric_name = "HTTPCode_Target_5XX_Count"
  namespace = "AWS/ApplicationELB"
  period = "300"
  statistic = "Sum"
  threshold = "10"
  alarm_description = "This metric monitors the number of 5XX errors from the ALB"
  treat_missing_data = "notBreaching"
  alarm_actions = [var.sns_topic_arn]

  dimensions = {
    LoadBalancer = var.alb_arn
  }

  tags = var.tags
}

# ALB Latency Alarm
resource "aws_cloudwatch_metric_alarm" "alb_latency" {
  alarm_name = "${var.project_name}-alb-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods = "2"
  metric_name = "TargetResponseTime"
  namespace = "AWS/ApplicationELB"
  period = "300"
  statistic = "Average"
  threshold = "1"
  alarm_description = "This metric monitors ALB response time"
  treat_missing_data = "notBreaching"
  alarm_actions = [var.sns_topic_arn]

  dimensions = {
    LoadBalancer = var.alb_arn
  }

  tags = var.tags
}

# ECS CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name = "${var.project_name}-ecs-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods = "2"
  metric_name = "CPUUtilization"
  namespace = "AWS/ECS"
  period = "300"
  statistic = "Average"
  threshold = "80"
  alarm_description = "This metric monitors ECS CPU utilization"
  treat_missing_data = "notBreaching"
  alarm_actions = [var.sns_topic_arn]

  dimensions = {
    ServiceName = var.cluster_name
  }

  tags = var.tags
}

# RDS CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name = "${var.project_name}-rds-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods = "2"
  metric_name = "CPUUtilization"
  namespace = "AWS/RDS"
  period = "300"
  statistic = "Average"
  threshold = "80"
  alarm_description = "This metric monitors RDS CPU utilization"
  treat_missing_data = "notBreaching"
  alarm_actions = [var.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = var.db_identifier
  }

  tags = var.tags
}

# RDS Free Storage Space Alarm
resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name = "${var.project_name}-rds-storage-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods = "2"
  metric_name = "FreeStorageSpace"
  namespace = "AWS/RDS"
  period = "300"
  statistic = "Average"
  threshold = "2000000000" # 2GB in bytes
  alarm_description = "This metric monitors RDS free storage space"
  treat_missing_data = "notBreaching"
  alarm_actions = [var.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = var.db_identifier
  }

  tags = var.tags
}

# CloudFront 4XX Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "cloudfront_4xx" {
  alarm_name = "${var.project_name}-cloudfront-4xx-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods = "2"
  metric_name = "4xxErrorRate"
  namespace = "AWS/CloudFront"
  period = "300"
  statistic = "Average"
  threshold = "5"
  alarm_description = "This metric monitors CloudFront 4XX error rate"
  treat_missing_data = "notBreaching"
  alarm_actions = [var.sns_topic_arn]

  dimensions = {
    DistributionId = var.distribution_id
  }

  tags = var.tags
}

# Composite Alarm for Critical Issues
resource "aws_cloudwatch_composite_alarm" "critical" {
  alarm_name = "${var.project_name}-critical-${var.environment}"
  alarm_description = "Critical infrastructure alarm for ${var.project_name} ${var.environment}"
  alarm_rule = join(" OR ", [
    format("ALARM(\"%s\")", aws_cloudwatch_metric_alarm.alb_5xx.alarm_name),
    format("ALARM(\"%s\")", aws_cloudwatch_metric_alarm.rds_cpu.alarm_name),
    format("ALARM(\"%s\")", aws_cloudwatch_metric_alarm.rds_storage.alarm_name),
    format("ALARM(\"%s\")", aws_cloudwatch_metric_alarm.cloudfront_4xx.alarm_name)
  ])
  alarm_actions = [var.sns_topic_arn]

  tags = var.tags
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${var.environment}"

  tags = var.tags
}

resource "aws_sns_topic_subscription" "email" {
  count = length(var.alert_emails) > 0 ? length(var.alert_emails) : 0

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_emails[count.index]
}

# Enable AWS Compute Optimizer
resource "aws_computeoptimizer_enrollment_status" "main" {
  status = "Active"
}

# CloudWatch Synthetics Canaries
resource "aws_synthetics_canary" "homepage" {
  name                 = "${var.project_name}-homepage-${var.environment}"
  artifact_s3_location = "s3://${aws_s3_bucket.canary_artifacts.bucket}/artifacts/"
  execution_role_arn   = aws_iam_role.synthetics.arn
  runtime_version      = "syn-nodejs-puppeteer-10.0"
  handler              = "homepage.handler"
  s3_bucket            = aws_s3_bucket.canary_artifacts.id
  s3_key               = aws_s3_object.canary_homepage.key
  s3_version           = aws_s3_object.canary_homepage.version_id
  start_canary         = true
  success_retention_period = 14
  failure_retention_period = 14

  schedule {
    expression = "rate(5 minutes)"
  }

  run_config {
    timeout_in_seconds = 60
  }

  tags = var.tags
}

resource "aws_synthetics_canary" "api_health" {
  name                 = "${var.project_name}-api-health-${var.environment}"
  artifact_s3_location = "s3://${aws_s3_bucket.canary_artifacts.bucket}/artifacts/"
  execution_role_arn   = aws_iam_role.synthetics.arn
  runtime_version      = "syn-nodejs-puppeteer-10.0"
  handler              = "apiHealth.handler"
  s3_bucket            = aws_s3_bucket.canary_artifacts.id
  s3_key               = aws_s3_object.canary_api.key
  s3_version           = aws_s3_object.canary_api.version_id
  start_canary         = true
  success_retention_period = 14
  failure_retention_period = 14

  schedule {
    expression = "rate(5 minutes)"
  }

  run_config {
    timeout_in_seconds = 60
  }

  tags = var.tags
}

# S3 bucket for canary artifacts
resource "aws_s3_bucket" "canary_artifacts" {
  bucket = "${var.project_name}-canary-artifacts-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = merge(var.tags, {
    Name = "${var.project_name}-canary-artifacts-${var.environment}"
  })
}

resource "aws_s3_bucket_versioning" "canary_artifacts" {
  bucket = aws_s3_bucket.canary_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "canary_artifacts" {
  bucket = aws_s3_bucket.canary_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "canary_artifacts" {
  bucket = aws_s3_bucket.canary_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Random suffix for unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_iam_role" "synthetics" {
  name = "${var.project_name}-synthetics-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "synthetics.amazonaws.com",
            "lambda.amazonaws.com"
          ]
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "synthetics" {
  name = "${var.project_name}-synthetics-policy-${var.environment}"

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
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${aws_s3_bucket.canary_artifacts.arn}",
          "${aws_s3_bucket.canary_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "CloudWatchSynthetics"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "synthetics" {
  role       = aws_iam_role.synthetics.name
  policy_arn = aws_iam_policy.synthetics.arn
}

data "archive_file" "canary_homepage" {
  type        = "zip"
  source_file = "${path.module}/canary_homepage.js"
  output_path = "${path.module}/canary_homepage.zip"
}

data "archive_file" "canary_api" {
  type        = "zip"
  source_file = "${path.module}/canary_api.js"
  output_path = "${path.module}/canary_api.zip"
}

resource "aws_s3_object" "canary_homepage" {
  bucket       = aws_s3_bucket.canary_artifacts.id
  key          = "scripts/canary_homepage.zip"
  source       = data.archive_file.canary_homepage.output_path
  content_type = "application/zip"
  source_hash  = data.archive_file.canary_homepage.output_base64sha256
}

resource "aws_s3_object" "canary_api" {
  bucket       = aws_s3_bucket.canary_artifacts.id
  key          = "scripts/canary_api.zip"
  source       = data.archive_file.canary_api.output_path
  content_type = "application/zip"
  source_hash  = data.archive_file.canary_api.output_base64sha256
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

variable "alb_arn" {
  description = "Application Load Balancer ARN"
  type        = string
}

variable "cluster_name" {
  description = "ECS Cluster Name"
  type        = string
}

variable "db_identifier" {
  description = "RDS DB Instance Identifier"
  type        = string
}

variable "distribution_id" {
  description = "CloudFront Distribution ID"
  type        = string
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "sns_topic_arn" {
  description = "SNS Topic ARN for alerts"
  type        = string
  default     = ""
}

variable "alert_emails" {
  description = "List of email addresses for alerts"
  type        = list(string)
  default = []
}

variable "domain_name" {
  description = "Domain name for canary tests"
  type        = string
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default = {}
}

# Outputs
output "dashboard_name" {
  value = aws_cloudwatch_dashboard.main.dashboard_name
}

output "sns_topic_arn" {
  value = aws_sns_topic.alerts.arn
}

output "canary_names" {
  value = [
    aws_synthetics_canary.homepage.id,
    aws_synthetics_canary.api_health.id
  ]
}
