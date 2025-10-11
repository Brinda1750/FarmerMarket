# Secrets configuration module

# Create secrets from input values (avoiding for_each with sensitive values)
resource "aws_secretsmanager_secret" "jwt_secret" {
  count = contains(keys(var.secrets), "jwt_secret") ? 1 : 0

  name = "${var.project_name}/${var.environment}/jwt_secret"
  description = "${var.project_name} ${var.environment} JWT secret"

  kms_key_id = var.kms_key_arn

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-jwt_secret"
    SecretType = "jwt_secret"
  })
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  count = contains(keys(var.secrets), "jwt_secret") ? 1 : 0

  secret_id = aws_secretsmanager_secret.jwt_secret[0].id
  secret_string = var.secrets["jwt_secret"]
}

resource "aws_secretsmanager_secret" "db_password" {
  count = contains(keys(var.secrets), "db_password") ? 1 : 0

  name = "${var.project_name}/${var.environment}/db_password"
  description = "${var.project_name} ${var.environment} database password"

  kms_key_id = var.kms_key_arn

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-db_password"
    SecretType = "db_password"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  count = contains(keys(var.secrets), "db_password") ? 1 : 0

  secret_id = aws_secretsmanager_secret.db_password[0].id
  secret_string = var.secrets["db_password"]
}

resource "aws_secretsmanager_secret" "github_token" {
  count = contains(keys(var.secrets), "github_token") && length(trimspace(lookup(var.secrets, "github_token", ""))) > 0 ? 1 : 0

  name = "${var.project_name}/${var.environment}/github_token"
  description = "${var.project_name} ${var.environment} GitHub token"

  kms_key_id = var.kms_key_arn

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-github_token"
    SecretType = "github_token"
  })
}

resource "aws_secretsmanager_secret_version" "github_token" {
  count = contains(keys(var.secrets), "github_token") && length(trimspace(lookup(var.secrets, "github_token", ""))) > 0 ? 1 : 0

  secret_id = aws_secretsmanager_secret.github_token[0].id
  secret_string = var.secrets["github_token"]
}

resource "aws_secretsmanager_secret" "stripe_secret_key" {
  count = contains(keys(var.secrets), "stripe_secret_key") && length(trimspace(lookup(var.secrets, "stripe_secret_key", ""))) > 0 ? 1 : 0

  name = "${var.project_name}/${var.environment}/stripe_secret_key"
  description = "${var.project_name} ${var.environment} Stripe secret key"

  kms_key_id = var.kms_key_arn

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-stripe_secret_key"
    SecretType = "stripe_secret_key"
  })
}

resource "aws_secretsmanager_secret_version" "stripe_secret_key" {
  count = contains(keys(var.secrets), "stripe_secret_key") && length(trimspace(lookup(var.secrets, "stripe_secret_key", ""))) > 0 ? 1 : 0

  secret_id = aws_secretsmanager_secret.stripe_secret_key[0].id
  secret_string = var.secrets["stripe_secret_key"]
}

resource "aws_secretsmanager_secret" "supabase_anon_key" {
  count = contains(keys(var.secrets), "supabase_anon_key") && length(trimspace(lookup(var.secrets, "supabase_anon_key", ""))) > 0 ? 1 : 0

  name = "${var.project_name}/${var.environment}/supabase_anon_key"
  description = "${var.project_name} ${var.environment} Supabase anonymous key"

  kms_key_id = var.kms_key_arn

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-supabase_anon_key"
    SecretType = "supabase_anon_key"
  })
}

resource "aws_secretsmanager_secret_version" "supabase_anon_key" {
  count = contains(keys(var.secrets), "supabase_anon_key") && length(trimspace(lookup(var.secrets, "supabase_anon_key", ""))) > 0 ? 1 : 0

  secret_id = aws_secretsmanager_secret.supabase_anon_key[0].id
  secret_string = var.secrets["supabase_anon_key"]
}

resource "aws_secretsmanager_secret" "supabase_service_key" {
  count = contains(keys(var.secrets), "supabase_service_key") && length(trimspace(lookup(var.secrets, "supabase_service_key", ""))) > 0 ? 1 : 0

  name = "${var.project_name}/${var.environment}/supabase_service_key"
  description = "${var.project_name} ${var.environment} Supabase service key"

  kms_key_id = var.kms_key_arn

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-supabase_service_key"
    SecretType = "supabase_service_key"
  })
}

resource "aws_secretsmanager_secret_version" "supabase_service_key" {
  count = contains(keys(var.secrets), "supabase_service_key") && length(trimspace(lookup(var.secrets, "supabase_service_key", ""))) > 0 ? 1 : 0

  secret_id = aws_secretsmanager_secret.supabase_service_key[0].id
  secret_string = var.secrets["supabase_service_key"]
}

resource "aws_secretsmanager_secret" "authenticator_password" {
  count = contains(keys(var.secrets), "authenticator_password") && length(trimspace(lookup(var.secrets, "authenticator_password", ""))) > 0 ? 1 : 0

  name = "${var.project_name}/${var.environment}/authenticator_password"
  description = "${var.project_name} ${var.environment} Supabase authenticator password"

  kms_key_id = var.kms_key_arn

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-authenticator_password"
    SecretType = "authenticator_password"
  })
}

resource "aws_secretsmanager_secret_version" "authenticator_password" {
  count = contains(keys(var.secrets), "authenticator_password") && length(trimspace(lookup(var.secrets, "authenticator_password", ""))) > 0 ? 1 : 0

  secret_id = aws_secretsmanager_secret.authenticator_password[0].id
  secret_string = var.secrets["authenticator_password"]
}

# Parameter Store entries for non-sensitive configuration
resource "aws_ssm_parameter" "main" {
  for_each = var.parameters

  name = "/${var.project_name}/${var.environment}/${each.key}"
  type = each.value.type
  value = each.value.value

  description = "${var.project_name} ${var.environment} ${each.key} parameter"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-${each.key}"
    ParameterType = each.key
  })
}

# Lambda function for secret rotation (for database passwords)
resource "aws_lambda_function" "secret_rotation" {
  count = var.enable_secret_rotation ? 1 : 0

  function_name = "${var.project_name}-secret-rotation-${var.environment}"
  handler = "index.handler"
  runtime = "python3.11"
  role = aws_iam_role.secret_rotation[0].arn
  timeout = 300

  filename = data.archive_file.secret_rotation[0].output_path
  source_code_hash = data.archive_file.secret_rotation[0].output_base64sha256

  environment {
    variables = {
      SECRET_PREFIX = "/${var.project_name}/${var.environment}"
    }
  }

  tags = var.tags
}

data "archive_file" "secret_rotation" {
  count = var.enable_secret_rotation ? 1 : 0
  type = "zip"
  source_file = "${path.module}/secret_rotation.py"
  output_path = "${path.module}/secret_rotation.zip"
}

# IAM role for secret rotation
resource "aws_iam_role" "secret_rotation" {
  count = var.enable_secret_rotation ? 1 : 0

  name = "${var.project_name}-secret-rotation-${var.environment}"

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

resource "aws_iam_policy" "secret_rotation" {
  count = var.enable_secret_rotation ? 1 : 0

  name = "${var.project_name}-secret-rotation-${var.environment}"

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
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = "arn:aws:secretsmanager:*:*:secret:${var.project_name}/${var.environment}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:ModifyDBInstance",
          "rds:DescribeDBInstances"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "secret_rotation" {
  count = var.enable_secret_rotation ? 1 : 0
  role = aws_iam_role.secret_rotation[0].name
  policy_arn = aws_iam_policy.secret_rotation[0].arn
}

# Enable rotation for database password
resource "aws_secretsmanager_secret_rotation" "db_password" {
  count = var.enable_secret_rotation && contains(keys(var.secrets), "db_password") ? 1 : 0

  secret_id = aws_secretsmanager_secret.db_password[0].id
  rotation_lambda_arn = aws_lambda_function.secret_rotation[0].arn

  rotation_rules {
    automatically_after_days = var.rotation_days
  }
}

# CloudWatch Events for scheduled rotation
resource "aws_cloudwatch_event_rule" "secret_rotation" {
  count = var.enable_secret_rotation ? 1 : 0

  name = "${var.project_name}-secret-rotation-${var.environment}"
  description = "Trigger secret rotation every ${var.rotation_days} days"
  schedule_expression = "rate(${var.rotation_days} days)"
}

resource "aws_cloudwatch_event_target" "secret_rotation" {
  count = var.enable_secret_rotation ? 1 : 0

  rule = aws_cloudwatch_event_rule.secret_rotation[0].name
  arn = aws_lambda_function.secret_rotation[0].arn
}

resource "aws_lambda_permission" "allow_events" {
  count = var.enable_secret_rotation ? 1 : 0

  statement_id = "AllowExecutionFromCloudWatch"
  action = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secret_rotation[0].function_name
  principal = "events.amazonaws.com"
  source_arn = aws_cloudwatch_event_rule.secret_rotation[0].arn
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
}

variable "secrets" {
  description = "Map of secrets to create"
  type        = map(string)
  sensitive   = true
  default = {}
}

variable "parameters" {
  description = "Map of parameters to create in Parameter Store"
  type = map(object({
    type  = string
    value = string
  }))
  default = {}
}

variable "enable_secret_rotation" {
  description = "Enable automatic secret rotation"
  type        = bool
  default     = false
}

variable "rotation_days" {
  description = "Number of days between secret rotations"
  type        = number
  default     = 60
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default = {}
}

# Outputs
output "secret_arns" {
  value = {
    for key in keys(var.secrets) : key => (
      key == "jwt_secret" ? try(aws_secretsmanager_secret.jwt_secret[0].arn, null) :
      key == "db_password" ? try(aws_secretsmanager_secret.db_password[0].arn, null) :
      key == "github_token" ? try(aws_secretsmanager_secret.github_token[0].arn, null) :
      key == "stripe_secret_key" ? try(aws_secretsmanager_secret.stripe_secret_key[0].arn, null) :
      key == "supabase_anon_key" ? try(aws_secretsmanager_secret.supabase_anon_key[0].arn, null) :
      key == "supabase_service_key" ? try(aws_secretsmanager_secret.supabase_service_key[0].arn, null) :
      key == "authenticator_password" ? try(aws_secretsmanager_secret.authenticator_password[0].arn, null) :
      null
    )
  }
  sensitive = true
}

output "parameter_names" {
  value = {
    for key, param in aws_ssm_parameter.main : key => param.name
  }
}

output "secret_names" {
  value = {
    for key in keys(var.secrets) : key => (
      key == "jwt_secret" ? try(aws_secretsmanager_secret.jwt_secret[0].name, null) :
      key == "db_password" ? try(aws_secretsmanager_secret.db_password[0].name, null) :
      key == "github_token" ? try(aws_secretsmanager_secret.github_token[0].name, null) :
      key == "stripe_secret_key" ? try(aws_secretsmanager_secret.stripe_secret_key[0].name, null) :
      key == "supabase_anon_key" ? try(aws_secretsmanager_secret.supabase_anon_key[0].name, null) :
      key == "supabase_service_key" ? try(aws_secretsmanager_secret.supabase_service_key[0].name, null) :
      key == "authenticator_password" ? try(aws_secretsmanager_secret.authenticator_password[0].name, null) :
      null
    )
  }
}
