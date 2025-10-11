graph TD
    subgraph AWS_Account[AWS Account]
        CT[CloudTrail/Config/GuardDuty/Security Hub]
        Budget[AWS Budgets]
        Org[Organization Baseline]
    end

    CT --> R53(Route 53)
    R53 --> CF[CloudFront]
    CF -->|HTTPS| ACMWAF[ACM + AWS WAF]
    CF --> S3Frontend[S3 Static Bucket]

    CF --> CWDash[CloudWatch Dashboard]
    CWDash --> CWAlarms[CloudWatch Alarms] --> SNS[SNS/OpsCenter]

    CF --> CloudCanary[CloudWatch Synthetics]

    subgraph CICD[CI/CD Pipeline]
        GitHub[GitHub Repo (main)] --> GHActions[GitHub Actions<br/>Deploy Frontend]
        GHActions --> OIDCRole[OIDC Deploy Role<br/>(IAM)]
        OIDCRole --> S3Sync[AWS CLI S3 Sync]
        S3Sync --> S3Frontend
        GHActions --> CFInvalidate[CloudFront Invalidation]
        CFInvalidate --> CF
    end

    ACMWAF --> CF

    subgraph VPC[VPC - Multi-AZ]
        subgraph Public[Public Subnets]
            ALB[Application Load Balancer]
            NAT[NAT Gateways x2]
        end

        subgraph Private[Private Subnets x3]
            subgraph ECS_Cluster[ECS Fargate Cluster]
                FargateAuth[ECS Fargate GoTrue]
                FargatePostgREST[ECS Fargate PostgREST]
                FargateRealtime[ECS Fargate Realtime]
                FargateStorage[ECS Fargate Storage]
                FargateStudio[ECS Fargate Studio]
            end

            Redis[ElastiCache Redis Cluster]
            SupaStorage[S3 Bucket Supabase Storage]
            Aurora[Aurora PostgreSQL Cluster]
        end
    end

    ALB --> FargateAuth
    ALB --> FargatePostgREST
    ALB --> FargateRealtime
    ALB --> FargateStorage
    ALB --> FargateStudio

    FargateAuth --> Aurora
    FargatePostgREST --> Aurora
    FargateRealtime --> Aurora
    FargateRealtime --> Redis
    FargateStorage --> SupaStorage

    SecretsMgr --> FargateAuth
    SecretsMgr --> FargatePostgREST
    SecretsMgr --> FargateRealtime
    SecretsMgr --> FargateStorage
    SecretsMgr --> FargateStudio

    Aurora --> CWLogs[CloudWatch Logs]
    ECS_Cluster --> CWLogs

    CF --> ALB
    CF -.-> Shield[Shield Advanced - Prod Only]
