# DNS and Edge module for Route 53 and ACM certificates

# Data source to get the hosted zone
data "aws_route53_zone" "main" {
  zone_id = var.zone_id
}

# ACM Certificate for CloudFront (must be in us-east-1)
resource "aws_acm_certificate" "cloudfront" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}",
    "api.${var.domain_name}",
    "admin.${var.domain_name}"
  ]

  tags = merge(var.tags, {
    Name = "${var.project_name}-cert-cloudfront-${var.environment}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ACM Certificate validation for CloudFront
resource "aws_route53_record" "cloudfront_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cloudfront.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "cloudfront" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cloudfront.arn
  validation_record_fqdns = [for record in aws_route53_record.cloudfront_cert_validation : record.fqdn]
}

# ACM Certificate for ALB (regional)
resource "aws_acm_certificate" "alb" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}",
    "api.${var.domain_name}",
    "admin.${var.domain_name}"
  ]

  tags = merge(var.tags, {
    Name = "${var.project_name}-cert-alb-${var.environment}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ACM Certificate validation for ALB
resource "aws_route53_record" "alb_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.alb.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "alb" {
  certificate_arn         = aws_acm_certificate.alb.arn
  validation_record_fqdns = [for record in aws_route53_record.alb_cert_validation : record.fqdn]
}

# Note: Route 53 records for API, Admin, and Wildcard are managed by individual environments
# This module only provides certificates and DNS zone management

# Provider configuration for us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
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

variable "domain_name" {
  description = "Root domain name"
  type        = string
}

variable "zone_id" {
  description = "Route 53 hosted zone ID"
  type        = string
}

variable "alb_dns_name" {
  description = "ALB DNS name for API routes"
  type        = string
  default     = ""
}

variable "cloudfront_domain_name" {
  description = "CloudFront domain name for wildcard route"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default = {}
}

# Outputs
output "cloudfront_certificate_arn" {
  value = aws_acm_certificate.cloudfront.arn
}

output "alb_certificate_arn" {
  value = aws_acm_certificate.alb.arn
}

output "route53_zone_id" {
  value = data.aws_route53_zone.main.zone_id
}

output "domain_name" {
  value = var.domain_name
}