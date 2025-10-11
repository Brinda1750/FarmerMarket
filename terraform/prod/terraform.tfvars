project_name = "farmer-market"
domain_name = "farmermarket.online"
route53_zone_id = ""  # To be filled after global module is applied
vpc_cidr = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# IAM configuration
deployment_principal_arn = ""
readonly_principal_arns = []
budget_notification_emails = ["finance@farmermarket.online"]

# Production values - these should be securely managed
db_password = "SecureProdPassword123!"
jwt_secret = "production-jwt-secret-key-32-chars-long"
redis_auth_token = "secure-redis-auth-token-456"
github_token = ""
stripe_secret_key = ""
supabase_anon_key = ""
supabase_service_key = ""
authenticator_password = ""

# Alert configuration
alert_emails = ["alerts@farmermarket.online", "devops@farmermarket.online", "oncall@farmermarket.online"]
