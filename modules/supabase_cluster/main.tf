# Supabase replacement cluster using ECS Fargate

# ECS Cluster
locals {
  db_username             = "postgres"
  db_connection_base      = "postgres://${local.db_username}:${var.db_password}@${var.db_endpoint}:5432/postgres"
  db_connection_ssl       = "${local.db_connection_base}?sslmode=require"
  authenticator_username  = "authenticator"
  authenticator_password  = var.authenticator_password_secret_id != null ? one(data.aws_secretsmanager_secret_version.authenticator_password[*].secret_string) : var.db_password
  db_connection_authenticator_ssl = "postgres://${local.authenticator_username}:${local.authenticator_password}@${var.db_endpoint}:5432/postgres?sslmode=require"
  supabase_site_url       = "https://${var.domain_name}"
  supabase_api_url        = "https://api.${var.domain_name}"
  supabase_uri_allow_list = join(",", [
    "https://${var.domain_name}",
    "https://www.${var.domain_name}",
    "https://api.${var.domain_name}"
  ])
  postgrest_internal_url  = "http://postgrest.${var.project_name}-${var.environment}.local:3000"
}

data "aws_secretsmanager_secret_version" "authenticator_password" {
  count     = var.authenticator_password_secret_id == null ? 0 : 1
  secret_id = var.authenticator_password_secret_id
}

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-cluster-${var.environment}"
  })
}

# Cloud Map service discovery
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "${var.project_name}-${var.environment}.local"
  description = "Service discovery namespace for ${var.project_name} ${var.environment}"
  vpc         = var.vpc_id

  tags = var.tags
}

# Application Load Balancer
resource "aws_lb" "main" {
  name = "${var.project_name}-alb-${var.environment}"
  internal = false
  load_balancer_type = "application"
  security_groups = [aws_security_group.alb.id]
  subnets = var.public_subnets

  enable_deletion_protection = false

  drop_invalid_header_fields = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-alb-${var.environment}"
  })
}

# ALB Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port = "443"
  protocol = "HTTPS"
  ssl_policy = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn = var.certificate_arn

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/html"
      message_body = "<h1>404 - Not Found</h1>"
      status_code = "404"
    }
  }
}

# HTTP to HTTPS redirect
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port = "80"
  protocol = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Security group for ALB
resource "aws_security_group" "alb" {
  name = "${var.project_name}-alb-sg-${var.environment}"
  description = "Security group for ALB"
  vpc_id = var.vpc_id

  ingress {
    description = "HTTP"
    from_port = 80
    to_port = 80
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port = 443
    to_port = 443
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-alb-sg-${var.environment}"
  })
}

# Security group rules for ECS tasks (add rules to the shared security group)
resource "aws_security_group_rule" "ecs_tasks_http" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = var.security_group_id
}

resource "aws_security_group_rule" "ecs_tasks_https" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = var.security_group_id
}

resource "aws_security_group_rule" "ecs_tasks_postgrest" {
  type                     = "ingress"
  from_port                = 3000
  to_port                  = 3000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = var.security_group_id
}

resource "aws_security_group_rule" "ecs_tasks_realtime" {
  type                     = "ingress"
  from_port                = 4000
  to_port                  = 4000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = var.security_group_id
}

resource "aws_security_group_rule" "ecs_tasks_gotrue" {
  type                     = "ingress"
  from_port                = 9999
  to_port                  = 9999
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = var.security_group_id
}

resource "aws_security_group_rule" "ecs_tasks_storage" {
  type                     = "ingress"
  from_port                = 5000
  to_port                  = 5000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = var.security_group_id
}

resource "aws_security_group_rule" "ecs_tasks_studio" {
  type                     = "ingress"
  from_port                = 3001
  to_port                  = 3001
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = var.security_group_id
}

# Target groups
resource "aws_lb_target_group" "gotrue" {
  name = "${var.project_name}-gotrue-${var.environment}"
  port = 9999
  protocol = "HTTP"
  vpc_id = var.vpc_id
  target_type = "ip"

  health_check {
    enabled = true
    healthy_threshold = 2
    interval = 30
    matcher = "200"
    path = "/health"
    port = "traffic-port"
    protocol = "HTTP"
    timeout = 5
    unhealthy_threshold = 2
  }

  tags = var.tags
}

resource "aws_lb_target_group" "postgrest" {
  name = "${var.project_name}-postgrest-${var.environment}"
  port = 3000
  protocol = "HTTP"
  vpc_id = var.vpc_id
  target_type = "ip"

  health_check {
    enabled = true
    healthy_threshold = 2
    interval = 30
    matcher = "200"
    path = "/health"
    port = "traffic-port"
    protocol = "HTTP"
    timeout = 5
    unhealthy_threshold = 2
  }

  tags = var.tags
}

resource "aws_lb_target_group" "realtime" {
  name = "${var.project_name}-realtime-${var.environment}"
  port = 4000
  protocol = "HTTP"
  vpc_id = var.vpc_id
  target_type = "ip"

  health_check {
    enabled = true
    healthy_threshold = 2
    interval = 30
    matcher = "200"
    path = "/health"
    port = "traffic-port"
    protocol = "HTTP"
    timeout = 5
    unhealthy_threshold = 2
  }

  tags = var.tags
}

resource "aws_lb_target_group" "storage" {
  name = "${var.project_name}-storage-${var.environment}"
  port = 5000
  protocol = "HTTP"
  vpc_id = var.vpc_id
  target_type = "ip"

  health_check {
    enabled = true
    healthy_threshold = 2
    interval = 30
    matcher = "200"
    path = "/health"
    port = "traffic-port"
    protocol = "HTTP"
    timeout = 5
    unhealthy_threshold = 2
  }

  tags = var.tags
}

resource "aws_lb_target_group" "studio" {
  name = "${var.project_name}-studio-${var.environment}"
  port = 3001
  protocol = "HTTP"
  vpc_id = var.vpc_id
  target_type = "ip"

  health_check {
    enabled = true
    healthy_threshold = 2
    interval = 30
    matcher = "200"
    path = "/health"
    port = "traffic-port"
    protocol = "HTTP"
    timeout = 5
    unhealthy_threshold = 2
  }

  tags = var.tags
}

# ALB Listener rules
resource "aws_lb_listener_rule" "gotrue" {
  listener_arn = aws_lb_listener.main.arn
  priority = 100

  condition {
    path_pattern {
      values = ["/auth/*"]
    }
  }

  action {
    type = "forward"
    target_group_arn = aws_lb_target_group.gotrue.arn
  }
}

resource "aws_lb_listener_rule" "postgrest" {
  listener_arn = aws_lb_listener.main.arn
  priority = 110

  condition {
    path_pattern {
      values = ["/rest/*", "/rpc/*"]
    }
  }

  action {
    type = "forward"
    target_group_arn = aws_lb_target_group.postgrest.arn
  }
}

resource "aws_lb_listener_rule" "realtime" {
  listener_arn = aws_lb_listener.main.arn
  priority = 120

  condition {
    path_pattern {
      values = ["/realtime/*"]
    }
  }

  action {
    type = "forward"
    target_group_arn = aws_lb_target_group.realtime.arn
  }
}

resource "aws_lb_listener_rule" "storage" {
  listener_arn = aws_lb_listener.main.arn
  priority = 130

  condition {
    path_pattern {
      values = ["/storage/v1/*"]
    }
  }

  action {
    type = "forward"
    target_group_arn = aws_lb_target_group.storage.arn
  }
}

resource "aws_lb_listener_rule" "studio" {
  listener_arn = aws_lb_listener.main.arn
  priority = 140

  condition {
    path_pattern {
      values = ["/studio/*"]
    }
  }

  action {
    type = "forward"
    target_group_arn = aws_lb_target_group.studio.arn
  }
}

# ECS Task Role
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "ecs_task_secrets" {
  name = "${var.project_name}-ecs-task-secrets-${var.environment}"
  role = aws_iam_role.ecs_task_role.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:*:*:secret:${var.project_name}/${var.environment}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          var.kms_key_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      }
    ]
  })
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-ecs-execution-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role" {
  role = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "gotrue" {
  name = "/ecs/${var.project_name}-gotrue-${var.environment}"
  retention_in_days = 14

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "postgrest" {
  name = "/ecs/${var.project_name}-postgrest-${var.environment}"
  retention_in_days = 14

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "realtime" {
  name = "/ecs/${var.project_name}-realtime-${var.environment}"
  retention_in_days = 14

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "storage" {
  name = "/ecs/${var.project_name}-storage-${var.environment}"
  retention_in_days = 14

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "studio" {
  name = "/ecs/${var.project_name}-studio-${var.environment}"
  retention_in_days = 14

  tags = var.tags
}

# GoTrue Service
resource "aws_ecs_task_definition" "gotrue" {
  family = "${var.project_name}-gotrue-${var.environment}"
  network_mode = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu = "256"
  memory = "512"
  execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name = "gotrue"
      image = var.gotrue_image_url
      portMappings = [
        {
          containerPort = 9999
          protocol = "tcp"
        }
      ]
      environment = concat([
        {
          name  = "GOTRUE_DB_DRIVER"
          value = "postgres"
        },
        {
          name  = "GOTRUE_DB_DATABASE_URL"
          value = local.db_connection_ssl
        },
        {
          name  = "GOTRUE_DB_AUTO_MIGRATE"
          value = "true"
        },
        {
          name  = "GOTRUE_DB_NAMESPACE"
          value = "auth"
        },
        {
          name  = "GOTRUE_SITE_URL"
          value = local.supabase_site_url
        },
        {
          name  = "GOTRUE_URI_ALLOW_LIST"
          value = local.supabase_uri_allow_list
        },
        {
          name  = "GOTRUE_API_HOST"
          value = "0.0.0.0"
        },
        {
          name  = "GOTRUE_API_PORT"
          value = "9999"
        },
        {
          name  = "GOTRUE_API_EXTERNAL_URL"
          value = local.supabase_api_url
        },
        {
          name  = "API_EXTERNAL_URL"
          value = local.supabase_api_url
        },
        {
          name  = "GOTRUE_JWT_ADMIN_ROLES"
          value = "service_role"
        },
        {
          name  = "GOTRUE_JWT_AUD"
          value = "authenticated"
        },
        {
          name  = "GOTRUE_JWT_DEFAULT_GROUP_NAME"
          value = "authenticated"
        },
        {
          name  = "GOTRUE_JWT_EXP"
          value = "3600"
        },
        {
          name  = "GOTRUE_DISABLE_SIGNUP"
          value = "false"
        },
        {
          name  = "GOTRUE_MAILER_AUTOCONFIRM"
          value = "true"
        },
        {
          name  = "GOTRUE_EXTERNAL_EMAIL_ENABLED"
          value = "false"
        },
        {
          name  = "GOTRUE_OPERATOR_TOKEN"
          value = var.service_key
        },
        {
          name  = "GOTRUE_LOG_LEVEL"
          value = "debug"
        },
        {
          name  = "DATABASE_URL"
          value = local.db_connection_ssl
        },
        {
          name  = "SITE_URL"
          value = local.supabase_site_url
        },
        {
          name  = "SUPABASE_ANON_KEY"
          value = var.anon_key
        },
        {
          name  = "SUPABASE_SERVICE_KEY"
          value = var.service_key
        }
      ], var.jwt_secret_arn == null ? [
        {
          name  = "GOTRUE_JWT_SECRET"
          value = var.jwt_secret
        },
        {
          name  = "JWT_SECRET"
          value = var.jwt_secret
        }
      ] : [])
      secrets = var.jwt_secret_arn == null ? [] : [
        {
          name      = "GOTRUE_JWT_SECRET"
          valueFrom = var.jwt_secret_arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = var.jwt_secret_arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group" = aws_cloudwatch_log_group.gotrue.name
          "awslogs-region" = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = var.tags
}

resource "aws_ecs_service" "gotrue" {
  name = "${var.project_name}-gotrue-${var.environment}"
  cluster = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.gotrue.arn
  desired_count = 1
  launch_type = "FARGATE"
  enable_execute_command = true

  network_configuration {
    subnets = var.private_subnets
    security_groups = [var.security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.gotrue.arn
    container_name = "gotrue"
    container_port = 9999
  }

  service_registries {
    registry_arn = aws_service_discovery_service.gotrue.arn
  }

  tags = var.tags
}

# PostgREST Service
resource "aws_ecs_task_definition" "postgrest" {
  family = "${var.project_name}-postgrest-${var.environment}"
  network_mode = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu = "256"
  memory = "512"
  execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name = "postgrest"
      image = var.postgrest_image_url
      portMappings = [
        {
          containerPort = 3000
          protocol = "tcp"
        }
      ]
      environment = concat([
        {
          name  = "PGRST_DB_URI"
          value = local.db_connection_authenticator_ssl
        },
        {
          name  = "PGRST_DB_SCHEMA"
          value = "public,storage,graphql_public"
        },
        {
          name  = "PGRST_DB_ANON_ROLE"
          value = "anon"
        },
        {
          name  = "PGRST_DB_USE_LEGACY_GUCS"
          value = "false"
        },
        {
          name  = "PGRST_SERVER_HOST"
          value = "0.0.0.0"
        },
        {
          name  = "PGRST_SERVER_PORT"
          value = "3000"
        },
        {
          name  = "PGRST_LOG_LEVEL"
          value = "info"
        },
        {
          name  = "PGRST_OPENAPI_SERVER_PROXY_URI"
          value = local.supabase_api_url
        }
      ], var.jwt_secret_arn == null ? [
        {
          name  = "PGRST_JWT_SECRET"
          value = var.jwt_secret
        }
      ] : [])
      secrets = var.jwt_secret_arn == null ? [] : [
        {
          name      = "PGRST_JWT_SECRET"
          valueFrom = var.jwt_secret_arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group" = aws_cloudwatch_log_group.postgrest.name
          "awslogs-region" = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = var.tags
}

resource "aws_ecs_service" "postgrest" {
  name = "${var.project_name}-postgrest-${var.environment}"
  cluster = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.postgrest.arn
  desired_count = 1
  launch_type = "FARGATE"
  enable_execute_command = true

  network_configuration {
    subnets = var.private_subnets
    security_groups = [var.security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.postgrest.arn
    container_name = "postgrest"
    container_port = 3000
  }

  service_registries {
    registry_arn = aws_service_discovery_service.postgrest.arn
  }

  tags = var.tags
}

# Realtime Service
resource "aws_ecs_task_definition" "realtime" {
  family = "${var.project_name}-realtime-${var.environment}"
  network_mode = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu = "256"
  memory = "512"
  execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name = "realtime"
      image = var.realtime_image_url
      portMappings = [
        {
          containerPort = 4000
          protocol = "tcp"
        }
      ]
      environment = concat([
        {
          name = "DB_HOST"
          value = var.db_endpoint
        },
        {
          name = "DB_PORT"
          value = "5432"
        },
        {
          name = "DB_NAME"
          value = "postgres"
        },
        {
          name = "REDIS_HOST"
          value = var.redis_endpoint
        },
        {
          name = "REDIS_PORT"
          value = "6379"
        },
        {
          name = "DB_USER"
          value = local.db_username
        },
        {
          name = "DB_PASSWORD"
          value = var.db_password
        },
        {
          name = "DB_SSL"
          value = "true"
        },
        {
          name = "PORT"
          value = "4000"
        },
        {
          name = "SECURE_CHANNELS"
          value = "true"
        },
        {
          name = "REPLICATION_MODE"
          value = "RLS"
        },
        {
          name = "SLOT_NAME"
          value = "supabase_realtime_rls"
        },
        {
          name = "TEMPORARY_SLOT"
          value = "true"
        },
        {
          name = "ANON_KEY"
          value = var.anon_key
        },
        {
          name = "SERVICE_KEY"
          value = var.service_key
        }
      ], var.jwt_secret_arn == null ? [
        {
          name = "JWT_SECRET"
          value = var.jwt_secret
        }
      ] : [])
      secrets = var.jwt_secret_arn == null ? [] : [
        {
          name      = "JWT_SECRET"
          valueFrom = var.jwt_secret_arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group" = aws_cloudwatch_log_group.realtime.name
          "awslogs-region" = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = var.tags
}

resource "aws_ecs_service" "realtime" {
  name = "${var.project_name}-realtime-${var.environment}"
  cluster = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.realtime.arn
  desired_count = 1
  launch_type = "FARGATE"
  enable_execute_command = true

  network_configuration {
    subnets = var.private_subnets
    security_groups = [var.security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.realtime.arn
    container_name = "realtime"
    container_port = 4000
  }

  service_registries {
    registry_arn = aws_service_discovery_service.realtime.arn
  }

  tags = var.tags
}

# Storage Service
resource "aws_ecs_task_definition" "storage" {
  family = "${var.project_name}-storage-${var.environment}"
  network_mode = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu = "256"
  memory = "512"
  execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name = "storage"
      image = var.storage_image_url
      portMappings = [
        {
          containerPort = 5000
          protocol = "tcp"
        }
      ]
      environment = [
        {
          name = "DATABASE_URL"
          value = local.db_connection_base
        },
        {
          name = "GLOBAL_S3_BUCKET"
          value = var.storage_bucket_name
        },
        {
          name = "REGION"
          value = var.aws_region
        },
        {
          name = "STORAGE_BACKEND"
          value = "s3"
        },
        {
          name = "FILE_SIZE_LIMIT"
          value = "52428800"
        },
        {
          name = "PGRST_URL"
          value = local.postgrest_internal_url
        },
        {
          name = "SUPABASE_URL"
          value = local.supabase_api_url
        },
        {
          name = "ANON_KEY"
          value = var.anon_key
        },
        {
          name = "SERVICE_KEY"
          value = var.service_key
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group" = aws_cloudwatch_log_group.storage.name
          "awslogs-region" = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = var.tags
}

resource "aws_ecs_service" "storage" {
  name = "${var.project_name}-storage-${var.environment}"
  cluster = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.storage.arn
  desired_count = 1
  launch_type = "FARGATE"
  enable_execute_command = true

  network_configuration {
    subnets = var.private_subnets
    security_groups = [var.security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.storage.arn
    container_name = "storage"
    container_port = 5000
  }

  service_registries {
    registry_arn = aws_service_discovery_service.storage.arn
  }

  tags = var.tags
}

# Studio Service
resource "aws_ecs_task_definition" "studio" {
  family = "${var.project_name}-studio-${var.environment}"
  network_mode = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu = "256"
  memory = "512"
  execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name = "studio"
      image = var.studio_image_url
      portMappings = [
        {
          containerPort = 3001
          protocol = "tcp"
        }
      ]
      environment = [
        {
          name = "STUDIO_DB_URL"
          value = local.db_connection_ssl
        },
        {
          name = "SUPABASE_URL"
          value = local.supabase_api_url
        },
        {
          name = "SUPABASE_ANON_KEY"
          value = var.anon_key
        },
        {
          name = "SUPABASE_SERVICE_KEY"
          value = var.service_key
        },
        {
          name = "SUPABASE_PUBLIC_URL"
          value = local.supabase_api_url
        },
        {
          name = "STUDIO_PG_META_URL"
          value = local.postgrest_internal_url
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group" = aws_cloudwatch_log_group.studio.name
          "awslogs-region" = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = var.tags
}

resource "aws_ecs_service" "studio" {
  name = "${var.project_name}-studio-${var.environment}"
  cluster = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.studio.arn
  desired_count = 1
  launch_type = "FARGATE"
  enable_execute_command = true

  network_configuration {
    subnets = var.private_subnets
    security_groups = [var.security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.studio.arn
    container_name = "studio"
    container_port = 3001
  }

  service_registries {
    registry_arn = aws_service_discovery_service.studio.arn
  }

  tags = var.tags
}

# Service Discovery services
resource "aws_service_discovery_service" "gotrue" {
  name = "gotrue"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    dns_records {
      ttl = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "postgrest" {
  name = "postgrest"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    dns_records {
      ttl = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "realtime" {
  name = "realtime"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    dns_records {
      ttl = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "storage" {
  name = "storage"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    dns_records {
      ttl = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "studio" {
  name = "studio"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    dns_records {
      ttl = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

# Auto Scaling Targets
resource "aws_appautoscaling_target" "gotrue" {
  max_capacity = 10
  min_capacity = 1
  resource_id = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.gotrue.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace = "ecs"
}

resource "aws_appautoscaling_target" "postgrest" {
  max_capacity = 10
  min_capacity = 1
  resource_id = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.postgrest.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace = "ecs"
}

resource "aws_appautoscaling_target" "realtime" {
  max_capacity = 10
  min_capacity = 1
  resource_id = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.realtime.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace = "ecs"
}

resource "aws_appautoscaling_target" "storage" {
  max_capacity = 10
  min_capacity = 1
  resource_id = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.storage.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace = "ecs"
}

resource "aws_appautoscaling_target" "studio" {
  max_capacity = 5
  min_capacity = 1
  resource_id = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.studio.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace = "ecs"
}

# Auto Scaling Policies - GoTrue
resource "aws_appautoscaling_policy" "gotrue_cpu" {
  name = "${var.project_name}-gotrue-cpu-${var.environment}"
  policy_type = "TargetTrackingScaling"
  resource_id = aws_appautoscaling_target.gotrue.resource_id
  scalable_dimension = aws_appautoscaling_target.gotrue.scalable_dimension
  service_namespace = aws_appautoscaling_target.gotrue.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
    scale_in_cooldown = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "gotrue_memory" {
  name = "${var.project_name}-gotrue-memory-${var.environment}"
  policy_type = "TargetTrackingScaling"
  resource_id = aws_appautoscaling_target.gotrue.resource_id
  scalable_dimension = aws_appautoscaling_target.gotrue.scalable_dimension
  service_namespace = aws_appautoscaling_target.gotrue.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = 80.0
    scale_in_cooldown = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Policies - PostgREST
resource "aws_appautoscaling_policy" "postgrest_cpu" {
  name = "${var.project_name}-postgrest-cpu-${var.environment}"
  policy_type = "TargetTrackingScaling"
  resource_id = aws_appautoscaling_target.postgrest.resource_id
  scalable_dimension = aws_appautoscaling_target.postgrest.scalable_dimension
  service_namespace = aws_appautoscaling_target.postgrest.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
    scale_in_cooldown = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "postgrest_memory" {
  name = "${var.project_name}-postgrest-memory-${var.environment}"
  policy_type = "TargetTrackingScaling"
  resource_id = aws_appautoscaling_target.postgrest.resource_id
  scalable_dimension = aws_appautoscaling_target.postgrest.scalable_dimension
  service_namespace = aws_appautoscaling_target.postgrest.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = 80.0
    scale_in_cooldown = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Policies - Realtime
resource "aws_appautoscaling_policy" "realtime_cpu" {
  name = "${var.project_name}-realtime-cpu-${var.environment}"
  policy_type = "TargetTrackingScaling"
  resource_id = aws_appautoscaling_target.realtime.resource_id
  scalable_dimension = aws_appautoscaling_target.realtime.scalable_dimension
  service_namespace = aws_appautoscaling_target.realtime.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
    scale_in_cooldown = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "realtime_memory" {
  name = "${var.project_name}-realtime-memory-${var.environment}"
  policy_type = "TargetTrackingScaling"
  resource_id = aws_appautoscaling_target.realtime.resource_id
  scalable_dimension = aws_appautoscaling_target.realtime.scalable_dimension
  service_namespace = aws_appautoscaling_target.realtime.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = 80.0
    scale_in_cooldown = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Policies - Storage
resource "aws_appautoscaling_policy" "storage_cpu" {
  name = "${var.project_name}-storage-cpu-${var.environment}"
  policy_type = "TargetTrackingScaling"
  resource_id = aws_appautoscaling_target.storage.resource_id
  scalable_dimension = aws_appautoscaling_target.storage.scalable_dimension
  service_namespace = aws_appautoscaling_target.storage.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
    scale_in_cooldown = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "storage_memory" {
  name = "${var.project_name}-storage-memory-${var.environment}"
  policy_type = "TargetTrackingScaling"
  resource_id = aws_appautoscaling_target.storage.resource_id
  scalable_dimension = aws_appautoscaling_target.storage.scalable_dimension
  service_namespace = aws_appautoscaling_target.storage.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = 80.0
    scale_in_cooldown = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Policies - Studio
resource "aws_appautoscaling_policy" "studio_cpu" {
  name = "${var.project_name}-studio-cpu-${var.environment}"
  policy_type = "TargetTrackingScaling"
  resource_id = aws_appautoscaling_target.studio.resource_id
  scalable_dimension = aws_appautoscaling_target.studio.scalable_dimension
  service_namespace = aws_appautoscaling_target.studio.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
    scale_in_cooldown = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "studio_memory" {
  name = "${var.project_name}-studio-memory-${var.environment}"
  policy_type = "TargetTrackingScaling"
  resource_id = aws_appautoscaling_target.studio.resource_id
  scalable_dimension = aws_appautoscaling_target.studio.scalable_dimension
  service_namespace = aws_appautoscaling_target.studio.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = 80.0
    scale_in_cooldown = 300
    scale_out_cooldown = 60
  }
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

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnets" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "private_subnets" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "db_endpoint" {
  description = "Database endpoint"
  type        = string
}

variable "redis_endpoint" {
  description = "Redis endpoint"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN"
  type        = string
}

variable "jwt_secret" {
  description = "JWT secret"
  type        = string
  sensitive   = true
}

variable "jwt_secret_arn" {
  description = "Secrets Manager ARN for the JWT secret"
  type        = string
  sensitive   = true
  default     = null
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "authenticator_password_secret_id" {
  description = "Secrets Manager identifier (name or ARN) for the authenticator database password"
  type        = string
  sensitive   = true
  default     = null
}

variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "enable_spot" {
  description = "Enable Fargate Spot"
  type        = bool
  default     = false
}

variable "gotrue_image_url" {
  description = "ECR image URL for GoTrue"
  type        = string
}

variable "postgrest_image_url" {
  description = "ECR image URL for PostgREST"
  type        = string
}

variable "realtime_image_url" {
  description = "ECR image URL for Realtime"
  type        = string
}

variable "storage_image_url" {
  description = "ECR image URL for Storage"
  type        = string
}

variable "studio_image_url" {
  description = "ECR image URL for Studio"
  type        = string
}

variable "anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
}

variable "service_key" {
  description = "Supabase service key"
  type        = string
  sensitive   = true
}

variable "storage_bucket_name" {
  description = "S3 bucket name for storage"
  type        = string
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default = {}
}

# Outputs
output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "alb_arn" {
  value = aws_lb.main.arn
}

output "gotrue_service_name" {
  value = aws_ecs_service.gotrue.name
}

output "postgrest_service_name" {
  value = aws_ecs_service.postgrest.name
}

output "realtime_service_name" {
  value = aws_ecs_service.realtime.name
}

output "storage_service_name" {
  value = aws_ecs_service.storage.name
}

output "studio_service_name" {
  value = aws_ecs_service.studio.name
}

output "ecs_tasks_security_group_id" {
  value = var.security_group_id
}
