variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "farmer-market"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Root domain name for the application"
  type        = string
  default     = "farmermarket.online"
}

variable "enable_fargate_spot" {
  description = "Enable Fargate Spot capacity providers"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default = {}
}
