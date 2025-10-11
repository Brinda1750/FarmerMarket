# GitHub Actions Frontend Deployment

This repository ships with a `Deploy Frontend` workflow that builds the Vite
application and publishes the assets to the existing AWS static hosting
stack.

The workflow lives in `.github/workflows/deploy.yml` and expects three AWS
resources that already exist in the dev environment:

| Resource | Value |
|----------|-------|
| S3 bucket | `farmer-market-static-dev-91a9d6e3` |
| CloudFront distribution ID | `E1KJFCW00E21JV` |
| Region | `us-east-1` |

## One-Time AWS Setup

1. **Create an IAM role for GitHub OIDC**

   - Role name suggestion: `farmer-market-frontend-deployer`.
   - Trusted entity: `Web identity`.
   - Identity provider ARN:
     `arn:aws:iam::894669428024:oidc-provider/token.actions.githubusercontent.com`.
   - Trust policy snippet (limits usage to pushes on the `main` branch of
     `Brinda1750/FarmerMarket`):

     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Principal": {
             "Federated": "arn:aws:iam::894669428024:oidc-provider/token.actions.githubusercontent.com"
           },
           "Action": "sts:AssumeRoleWithWebIdentity",
           "Condition": {
             "StringEquals": {
               "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
               "token.actions.githubusercontent.com:sub": "repo:Brinda1750/FarmerMarket:ref:refs/heads/main"
             }
           }
         }
       ]
     }
     ```

2. **Attach the deployment policy**

   Grant the role the minimal S3 + CloudFront permissions used in the
   workflow:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:ListBucket"
         ],
         "Resource": "arn:aws:s3:::farmer-market-static-dev-91a9d6e3"
       },
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::farmer-market-static-dev-91a9d6e3/*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "cloudfront:CreateInvalidation"
         ],
         "Resource": "arn:aws:cloudfront::894669428024:distribution/E1KJFCW00E21JV"
       }
     ]
   }
   ```

3. **Add the role ARN to the repository**

   - In GitHub, navigate to *Settings → Secrets and variables → Actions*.
   - Create a new secret named `AWS_DEPLOY_ROLE_ARN` containing the role ARN.

## How the Workflow Runs

- Triggered on pushes to `main` and via manual dispatch.
- Installs dependencies with `npm ci` and builds to `dist/`.
- Assumes the IAM role via OIDC, uploads the build output to the S3 bucket,
  and invalidates CloudFront to serve the fresh assets.

If you need to deploy to another environment, duplicate the workflow with
the appropriate bucket/distribution IDs or parametrize the values via
repository/environment variables.
