# Development environment configuration

locals {
  environment = "dev"
}

# Call modules
module "organization_baseline" {
  source = "../../modules/organization-baseline"

  project_name = var.project_name
  environment  = local.environment
  deployment_principal_arn = var.deployment_principal_arn
  readonly_principal_arns = var.readonly_principal_arns
  budget_notification_emails = var.budget_notification_emails
  tags         = var.tags
}

module "networking" {
  source = "../../modules/networking"

  project_name = var.project_name
  environment  = local.environment
  vpc_cidr     = var.vpc_cidr
  azs          = var.availability_zones
  enable_nat_gateway = false
  single_nat_gateway = true
  tags         = var.tags

  depends_on = [module.organization_baseline]
}

module "security" {
  source = "../../modules/security"

  project_name = var.project_name
  environment  = local.environment
  tags         = var.tags
}

module "ecr_repos" {
  source = "../../modules/ecr_repos"

  project_name = var.project_name
  environment  = local.environment
  kms_key_arn  = module.security.kms_key_arn
  tags         = var.tags

  depends_on = [module.security]
}

module "dns_edge" {
  source = "../../modules/dns_edge"

  project_name = var.project_name
  environment  = local.environment
  domain_name  = var.domain_name
  zone_id      = var.route53_zone_id
  tags         = var.tags
}

module "data_platform" {
  source = "../../modules/data_platform"

  project_name        = var.project_name
  environment         = local.environment
  vpc_id              = module.networking.vpc_id
  private_subnets     = module.networking.private_subnet_ids
  ecs_security_group_id = module.networking.ecs_security_group_id
  kms_key_arn         = module.security.kms_key_arn
  db_password         = var.db_password
  domain_name         = var.domain_name
  enable_serverless   = true
  redis_cluster_size  = 1
  redis_auth_token    = var.redis_auth_token
  tags                = var.tags

  depends_on = [module.networking, module.security]
}

module "supabase_cluster" {
  source = "../../modules/supabase_cluster"

  project_name        = var.project_name
  environment         = local.environment
  vpc_id              = module.networking.vpc_id
  public_subnets      = module.networking.public_subnet_ids
  private_subnets     = module.networking.private_subnet_ids
  security_group_id   = module.networking.ecs_security_group_id
  db_endpoint         = module.data_platform.db_endpoint
  redis_endpoint      = module.data_platform.redis_endpoint
  kms_key_arn         = module.security.kms_key_arn
  jwt_secret          = var.jwt_secret
  jwt_secret_arn      = module.secrets_config.secret_arns["jwt_secret"]
  db_password         = var.db_password
  authenticator_password_secret_id = module.secrets_config.secret_names["authenticator_password"]
  domain_name         = var.domain_name
  certificate_arn     = module.dns_edge.alb_certificate_arn
  gotrue_image_url    = module.ecr_repos.repository_urls["gotrue"]
  postgrest_image_url = module.ecr_repos.repository_urls["postgrest"]
  realtime_image_url  = module.ecr_repos.repository_urls["realtime"]
  storage_image_url  = module.ecr_repos.repository_urls["storage"]
  studio_image_url   = module.ecr_repos.repository_urls["studio"]
  anon_key           = var.supabase_anon_key
  service_key        = var.supabase_service_key
  storage_bucket_name = module.data_platform.storage_bucket_name
  enable_spot         = var.enable_fargate_spot
  tags                = var.tags

  depends_on = [module.networking, module.security, module.data_platform, module.dns_edge, module.ecr_repos]
}

module "frontend" {
  source = "../../modules/frontend"

  project_name      = var.project_name
  environment       = local.environment
  domain_name       = var.domain_name
  zone_id           = var.route53_zone_id
  certificate_arn   = module.dns_edge.cloudfront_certificate_arn
  api_origin_id     = module.supabase_cluster.alb_arn
  alb_domain_name   = module.supabase_cluster.alb_dns_name
  waf_web_acl_arn   = module.security.waf_web_acl_arn
  tags              = var.tags

  depends_on = [module.dns_edge, module.security, module.supabase_cluster]
}

module "cicd" {
  count = var.enable_cicd ? 1 : 0
  source = "../../modules/cicd"

  project_name      = var.project_name
  environment       = local.environment
  bucket_name       = module.frontend.bucket_name
  distribution_id   = module.frontend.distribution_id
  kms_key_arn       = module.security.kms_key_arn
  require_approval  = false
  tags              = var.tags

  depends_on = [module.frontend, module.security]
}

module "secrets_config" {
  source = "../../modules/secrets_config"

  project_name = var.project_name
  environment  = local.environment
  kms_key_arn  = module.security.kms_key_arn
  tags         = var.tags

  secrets = {
    jwt_secret          = var.jwt_secret
    db_password         = var.db_password
    github_token        = var.github_token
    stripe_secret_key   = var.stripe_secret_key
    supabase_anon_key   = var.supabase_anon_key
    supabase_service_key = var.supabase_service_key
    authenticator_password = var.authenticator_password
  }

  enable_secret_rotation = false  # Disabled for dev
  rotation_days = 60

  depends_on = [module.security]
}

# Create SNS topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${local.environment}"

  tags = var.tags
}

module "observability" {
  source = "../../modules/observability"

  project_name       = var.project_name
  environment        = local.environment
  vpc_id             = module.networking.vpc_id
  alb_arn            = module.supabase_cluster.alb_arn
  cluster_name       = module.supabase_cluster.cluster_name
  db_identifier      = module.data_platform.db_identifier
  distribution_id    = module.frontend.distribution_id
  sns_topic_arn      = aws_sns_topic.alerts.arn
  alert_emails       = var.alert_emails
  domain_name        = var.domain_name
  tags               = var.tags

  depends_on = [module.networking, module.supabase_cluster, module.data_platform, module.frontend, module.secrets_config]
}

# Attach MFA enforcement policy to users
resource "aws_iam_group" "developers" {
  name = "${var.project_name}-developers-${local.environment}"
  path = "/"
}

resource "aws_iam_group_policy_attachment" "mfa_enforcement" {
  group      = aws_iam_group.developers.name
  policy_arn = module.security.mfa_policy_arn
}

# Variables
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "domain_name" {
  description = "Root domain name"
  type        = string
}

variable "route53_zone_id" {
  description = "Route 53 hosted zone ID from global resources"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "enable_fargate_spot" {
  description = "Enable Fargate Spot capacity providers"
  type        = bool
  default     = false
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

variable "budget_notification_emails" {
  description = "Email addresses for budget notifications"
  type        = list(string)
  default     = []
}

variable "db_password" {
  description = "RDS database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}

variable "redis_auth_token" {
  description = "Redis auth token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_token" {
  description = "GitHub token for CI/CD"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "supabase_service_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "authenticator_password" {
  description = "Database password for the authenticator role"
  type        = string
  sensitive   = true
  default     = ""
}

variable "alert_emails" {
  description = "Email addresses for alerts"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default = {}
}

variable "enable_cicd" {
  description = "Enable CI/CD pipeline resources"
  type        = bool
  default     = false
}

# Outputs
output "vpc_id" {
  value = module.networking.vpc_id
}

output "frontend_url" {
  value = module.frontend.url
}

output "api_url" {
  value = "https://api.${var.domain_name}"
}

output "db_endpoint" {
  value = module.data_platform.db_endpoint
  sensitive = true
}

output "ecr_repository_urls" {
  value = module.ecr_repos.repository_urls
}
