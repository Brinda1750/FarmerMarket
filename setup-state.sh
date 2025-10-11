#!/bin/bash

# Setup script for Terraform state buckets

# Set credentials
# Expect AWS credentials to be provided via the environment or your AWS profile
: "${AWS_ACCESS_KEY_ID:?Set AWS_ACCESS_KEY_ID before running this script}" >/dev/null
: "${AWS_SECRET_ACCESS_KEY:?Set AWS_SECRET_ACCESS_KEY before running this script}" >/dev/null
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

# Function to create state bucket and DynamoDB table
create_state_resources() {
    local env=$1

    echo "Creating state resources for $env environment..."

    # Create S3 bucket for state
    aws s3api create-bucket \
        --bucket "tfstate-farmer-market-$env" \
        --region us-east-1 \
        2>/dev/null || echo "Bucket already exists"

    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "tfstate-farmer-market-$env" \
        --versioning-configuration Status=Enabled

    # Enable encryption
    aws s3api put-bucket-encryption \
        --bucket "tfstate-farmer-market-$env" \
        --server-side-encryption-configuration '{
            "Rules": [
                {
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }
            ]
        }'

    # Block public access
    aws s3api put-public-access-block \
        --bucket "tfstate-farmer-market-$env" \
        --public-access-block-configuration '{
            "BlockPublicAcls": true,
            "BlockPublicPolicy": true,
            "IgnorePublicAcls": true,
            "RestrictPublicBuckets": true
        }'

    # Create DynamoDB table for state locking
    aws dynamodb create-table \
        --table-name "tfstate-lock-$env" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region us-east-1 \
        2>/dev/null || echo "Table already exists"

    echo "State resources created for $env"
}

# Create state resources for all environments
create_state_resources "dev"
create_state_resources "staging"
create_state_resources "prod"

echo "State setup complete!"