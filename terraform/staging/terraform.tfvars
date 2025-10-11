project_name = "farmer-market"
domain_name = "farmermarket.online"
route53_zone_id = ""  # To be filled after global module is applied
vpc_cidr = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# These should be generated or provided securely
db_password = "ChangeMeStaging123!"
jwt_secret = "your-jwt-secret-key-for-staging-32-chars"
github_token = ""
stripe_secret_key = ""
supabase_anon_key = ""
supabase_service_key = ""
authenticator_password = ""

alert_emails = ["alerts@farmermarket.online"]
