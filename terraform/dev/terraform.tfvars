project_name = "farmer-market"
domain_name = "farmermarket.online"
route53_zone_id = "Z0634772TSPI4JWCL5KM"  # To be filled after global module is applied
enable_fargate_spot = false
vpc_cidr = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# IAM configuration
deployment_principal_arn = ""
readonly_principal_arns = []
budget_notification_emails = []

# These should be generated or provided securely
db_password = "OxN618gEDROFvH-fh-v09Rt_jnCc05P4"
jwt_secret = "nOVPspXkxB6VDHcfSQlKLsfDSXOT7EGKvtYamsD0_LQ"
redis_auth_token = "1gszpN8UaKWAULRuhJwMq-ehbHhxnYNx"
github_token = ""
stripe_secret_key = ""
supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhbm9uIiwiZXhwIjoyMDc1NDkwNjk1LCJzdWIiOiJhbm9uIiwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MDEzMDY5NX0.c-TEGE8QYU9iNoOyebcuvdn1ZSb8TmWaD8hCQxkypHk"
supabase_service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJzZXJ2aWNlX3JvbGUiLCJleHAiOjIwNzU0OTA2OTUsInN1YiI6InNlcnZpY2Vfcm9sZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MDEzMDY5NX0.7FyoXVzOiPP8HwXQRrAWhY5x_XV3gvBynsUQhItmOXQ"
authenticator_password = "ChangeMeAuthenticator!"

# Alert configuration
alert_emails = ["dev-alerts@farmermarket.online"]
