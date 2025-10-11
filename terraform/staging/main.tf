# Staging environment configuration

locals {
  environment = "staging"
}

# Call modules
module "organization_baseline" {
  source = "../../modules/organization-baseline"

  project_name = var.project_name
  environment  = local.environment
  tags         = var.tags
}

module "networking" {
  source = "../../modules/networking"

  project_name = var.project_name
  environment  = local.environment
  vpc_cidr     = var.vpc_cidr
  azs          = var.availability_zones
  tags         = var.tags

  depends_on = [module.organization_baseline]
}

module "security" {
  source = "../../modules/security"

  project_name = var.project_name
  environment  = local.environment
  tags         = var.tags
}

module "dns_edge" {
  source = "../../modules/dns_edge"

  project_name = var.project_name
  environment  = local.environment
  domain_name  = var.domain_name
  zone_id      = data.terraform_remote_state.global.outputs.route53_zone_id
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
  enable_spot         = false
  tags                = var.tags

  depends_on = [module.networking, module.security, module.data_platform, module.dns_edge]
}

module "frontend" {
  source = "../../modules/frontend"

  project_name      = var.project_name
  environment       = local.environment
  domain_name       = var.domain_name
  zone_id           = data.terraform_remote_state.global.outputs.route53_zone_id
  certificate_arn   = module.dns_edge.cloudfront_certificate_arn
  api_origin_id     = module.supabase_cluster.alb_arn
  waf_web_acl_arn   = module.security.waf_web_acl_arn
  tags              = var.tags

  depends_on = [module.dns_edge, module.security]
}

module "cicd" {
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

  enable_secret_rotation = true
  rotation_days = 60

  depends_on = [module.security]
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
  sns_topic_arn      = module.secrets_config.secret_arns["db_password"] # Using a secret ARN as placeholder
  alert_emails       = var.alert_emails
  domain_name        = var.domain_name
  tags               = var.tags

  depends_on = [module.networking, module.supabase_cluster, module.data_platform, module.frontend, module.secrets_config]
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
  default     = "10.1.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
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

# Outputs
output "vpc_id" {
  value = module.networking.vpc_id
}

output "frontend_url" {
  value = "https://staging.${var.domain_name}"
}

output "api_url" {
  value = "https://api-staging.${var.domain_name}"
}

output "db_endpoint" {
  value = module.data_platform.db_endpoint
}
