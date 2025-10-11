# Supabase Database Bootstrap Guide

The Supabase ECS services require the `auth` schema, roles, and extensions to exist
before GoTrue/PostgREST can start successfully. Follow these steps to initialize
Aurora PostgreSQL when standing up a new environment or repairing a failed bootstrap.

## 1. Enable the RDS Data API

Terraform now sets `enable_http_endpoint = true` on the Aurora cluster. Apply the
change (targeting the cluster if desired) so the Data API becomes available:

```bash
cd terraform/dev
terraform apply -target=module.data_platform.aws_rds_cluster.main
```

> The cluster performs a short reboot when toggling the HTTP endpoint.

## 2. Prepare Secrets

1. Generate a strong authenticator password (32+ random characters).
2. Populate `authenticator_password` in the appropriate `terraform.tfvars`, or
   rotate the `farmer-market/<env>/authenticator_password` secret directly in
   Secrets Manager.  
   Terraform now reads this secret to construct the PostgREST connection string.
3. Ensure the JWT secret is present; ECS retrieves it via Secrets Manager.

Re-run `terraform apply` for the target environment. The ECS task definitions now
consume the JWT secret through the `secrets` block and use the authenticator secret
when available.

## 3. Run the Bootstrap SQL (No `pgjwt` Dependency)

Execute the SQL in `bootstrap_supabase.sql` via the RDS Data API. Example:

```bash
export AWS_REGION=us-east-1
CLUSTER_ARN=$(aws rds describe-db-clusters \
  --db-cluster-identifier farmer-market-dev \
  --query 'DBClusters[0].DBClusterArn' \
  --output text)

SECRET_ARN=$(aws secretsmanager describe-secret \
  --secret-id farmer-market/dev/db_password \
  --query 'ARN' \
  --output text)

aws rds-data execute-statement \
  --resource-arn "$CLUSTER_ARN" \
  --secret-arn "$SECRET_ARN" \
  --database postgres \
  --sql "$(cat bootstrap_supabase.sql)"
```

Verify bootstrap success (schemas, roles, and migrations table):

```bash
aws rds-data execute-statement \
  --resource-arn "$CLUSTER_ARN" \
  --secret-arn "$SECRET_ARN" \
  --database postgres \
  --sql "SELECT nspname FROM pg_namespace WHERE nspname = 'auth';"
```

Run the verification queries from the bootstrap guide as needed.

## 4. Apply the Authenticator Password

If you populated/rotated the authenticator secret after running the SQL, update the
database password accordingly:

```bash
AUTH_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id farmer-market/dev/authenticator_password \
  --query 'SecretString' \
  --output text)

aws rds-data execute-statement \
  --resource-arn "$CLUSTER_ARN" \
  --secret-arn "$SECRET_ARN" \
  --database postgres \
  --sql "ALTER ROLE authenticator WITH PASSWORD '${AUTH_PASSWORD}';"
```

## 5. Redeploy Supabase Services

Redeploy GoTrue and PostgREST once the bootstrap completes:

```bash
aws ecs update-service \
  --cluster farmer-market-cluster-dev \
  --service farmer-market-gotrue-dev \
  --force-new-deployment

aws ecs update-service \
  --cluster farmer-market-cluster-dev \
  --service farmer-market-postgrest-dev \
  --force-new-deployment
```

Tail the CloudWatch logs to confirm GoTrue migrations succeed and PostgREST connects
with the authenticator role.
