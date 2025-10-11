# Networking module with VPC, subnets, and VPC endpoints

# Locals
locals {
  nat_gateway_count = var.enable_nat_gateway ? (var.single_nat_gateway ? min(1, length(var.azs)) : length(var.azs)) : 0
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-vpc-${var.environment}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-igw-${var.environment}"
  })
}

# Public subnets
resource "aws_subnet" "public" {
  count = length(var.azs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}-${var.environment}"
    Type = "Public"
  })
}

# Private subnets
resource "aws_subnet" "private" {
  count = length(var.azs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.azs))
  availability_zone = var.azs[count.index]

  tags = merge(var.tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}-${var.environment}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = local.nat_gateway_count
  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.project_name}-nat-eip-${count.index + 1}-${var.environment}"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = local.nat_gateway_count

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.project_name}-nat-${count.index + 1}-${var.environment}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-public-rt-${var.environment}"
  })
}

resource "aws_route_table" "private" {
  count = length(var.azs)

  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = local.nat_gateway_count > 0 ? {
      default = var.single_nat_gateway ? aws_nat_gateway.main[0].id : aws_nat_gateway.main[count.index].id
    } : {}

    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = route.value
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-private-rt-${count.index + 1}-${var.environment}"
  })
}

# Route table associations
resource "aws_route_table_association" "public" {
  count = length(var.azs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.azs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Endpoints - Gateway
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"
  route_table_ids = aws_route_table.private[*].id

  tags = merge(var.tags, {
    Name = "${var.project_name}-s3-vpc-endpoint-${var.environment}"
  })
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.dynamodb"
  route_table_ids = aws_route_table.private[*].id

  tags = merge(var.tags, {
    Name = "${var.project_name}-dynamodb-vpc-endpoint-${var.environment}"
  })
}

# VPC Endpoints - Interface
resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id

  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(var.tags, {
    Name = "${var.project_name}-ecr-api-vpc-endpoint-${var.environment}"
  })
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id

  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(var.tags, {
    Name = "${var.project_name}-ecr-dkr-vpc-endpoint-${var.environment}"
  })
}

resource "aws_vpc_endpoint" "ecs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id

  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(var.tags, {
    Name = "${var.project_name}-ecs-vpc-endpoint-${var.environment}"
  })
}

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id

  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(var.tags, {
    Name = "${var.project_name}-secretsmanager-vpc-endpoint-${var.environment}"
  })
}

resource "aws_vpc_endpoint" "sts" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sts"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id

  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(var.tags, {
    Name = "${var.project_name}-sts-vpc-endpoint-${var.environment}"
  })
}

resource "aws_vpc_endpoint" "cloudwatch_logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private[*].id

  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(var.tags, {
    Name = "${var.project_name}-cloudwatch-logs-vpc-endpoint-${var.environment}"
  })
}

# Security group for VPC endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.project_name}-vpc-endpoints-sg-${var.environment}"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-vpc-endpoints-sg-${var.environment}"
  })
}

# Default security group - lockdown
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.main.id

  # Remove all ingress rules
  ingress = []

  # Allow only outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-default-sg-${var.environment}"
  })
}

# ECS security group for application workloads
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-ecs-tasks-sg-${var.environment}"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-ecs-tasks-sg-${var.environment}"
  })
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn         = aws_iam_role.flow_log.arn
  log_destination      = aws_cloudwatch_log_group.flow_log.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-flow-log-${var.environment}"
  })
}

# CloudWatch Log Group for Flow Logs
resource "aws_cloudwatch_log_group" "flow_log" {
  name              = "/aws/vpc/flow-logs/${var.project_name}-${var.environment}"
  retention_in_days = 14

  tags = var.tags
}

# IAM Role for Flow Logs
resource "aws_iam_role" "flow_log" {
  name = "${var.project_name}-flow-log-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "flow_log" {
  role       = aws_iam_role.flow_log.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
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

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "azs" {
  description = "List of availability zones"
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Whether to create NAT gateway(s) for private subnet internet access"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Create a single NAT gateway shared across private subnets to reduce Elastic IP usage"
  type        = bool
  default     = false
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default = {}
}

# Outputs
output "vpc_id" {
  value = aws_vpc.main.id
}

output "vpc_cidr_block" {
  value = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "public_subnet_cidrs" {
  value = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  value = aws_subnet.private[*].cidr_block
}

output "internet_gateway_id" {
  value = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  value = aws_nat_gateway.main[*].id
}

output "vpc_endpoint_s3_id" {
  value = aws_vpc_endpoint.s3.id
}

output "vpc_endpoint_dynamodb_id" {
  value = aws_vpc_endpoint.dynamodb.id
}

output "default_security_group_id" {
  value = aws_default_security_group.default.id
}

output "ecs_security_group_id" {
  value = aws_security_group.ecs_tasks.id
}
