# Frontend module with S3 bucket and CloudFront distribution

# S3 bucket for static assets
resource "aws_s3_bucket" "static" {
  bucket = "${var.project_name}-static-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = merge(var.tags, {
    Name = "${var.project_name}-static-${var.environment}"
  })
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "static" {
  bucket = aws_s3_bucket.static.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "static" {
  bucket = aws_s3_bucket.static.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "static" {
  bucket = aws_s3_bucket.static.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket lifecycle policy
resource "aws_s3_bucket_lifecycle_configuration" "static" {
  bucket = aws_s3_bucket.static.id

  rule {
    id     = "intelligent_tiering"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }
  }

  rule {
    id     = "delete_old_versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# S3 bucket policy for CloudFront OAC
resource "aws_s3_bucket_policy" "static" {
  bucket = aws_s3_bucket.static.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.static.arn}/*"
      }
    ]
  })
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "static" {
  name                              = "${var.project_name}-oac-${var.environment}"
  description                       = "Origin Access Control for ${var.project_name} ${var.environment}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "main" {
  enabled = true
  is_ipv6_enabled = true
  comment = "${var.project_name} ${var.environment} distribution"
  default_root_object = "index.html"

  # S3 Origin configuration
  origin {
    domain_name              = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.static.id
    origin_access_control_id = aws_cloudfront_origin_access_control.static.id

    s3_origin_config {
      origin_access_identity = ""
    }
  }

  # ALB Origin for API routes
  dynamic "origin" {
    for_each = var.api_origin_id != "" ? [1] : []
    content {
      domain_name = var.alb_domain_name
      origin_id   = var.api_origin_id

      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = aws_s3_bucket.static.id
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Cache behavior for API paths
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = var.api_origin_id
    compress               = true
    viewer_protocol_policy = "https-only"

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Cache behavior for auth paths
  ordered_cache_behavior {
    path_pattern           = "/auth/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = var.api_origin_id
    compress               = true
    viewer_protocol_policy = "https-only"

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Aliases
  aliases = [
    var.domain_name,
    "www.${var.domain_name}"
  ]

  # Custom error responses
  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
    error_caching_min_ttl = 300
  }

  custom_error_response {
    error_code         = 403
    response_code      = 403
    response_page_path = "/403.html"
    error_caching_min_ttl = 300
  }

  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Viewer certificate
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Logging configuration
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  # Price class
  price_class = "PriceClass_All"

  # WAF association
  web_acl_id = var.waf_web_acl_arn

  tags = merge(var.tags, {
    Name = "${var.project_name}-cloudfront-${var.environment}"
  })
}

# S3 bucket for CloudFront logs
resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-cloudfront-logs-${var.environment}-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-cloudfront-logs-${var.environment}"
  })
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  # CloudFront logging requires ACLs to be enabled
  block_public_acls       = false
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "logs" {
  depends_on = [
    aws_s3_bucket_public_access_block.logs,
    aws_s3_bucket_ownership_controls.logs,
  ]

  bucket = aws_s3_bucket.logs.id
  acl    = "private"
}

# Bucket policy to allow CloudFront to write logs
resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/*"
      }
    ]
  })
}

# CloudFront Function for security headers
resource "aws_cloudfront_function" "security_headers" {
  name    = "${var.project_name}-security-headers-${var.environment}"
  runtime = "cloudfront-js-1.0"
  code    = file("${path.module}/security-headers.js")
  publish = true
}

# Route 53 records for CloudFront distribution
resource "aws_route53_record" "www" {
  zone_id = var.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "root" {
  zone_id = var.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# Wildcard record for subdomains (points to CloudFront)
resource "aws_route53_record" "wildcard" {
  zone_id = var.zone_id
  name    = "*.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# Random suffix for unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
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

variable "certificate_arn" {
  description = "ACM certificate ARN for CloudFront"
  type        = string
}

variable "api_origin_id" {
  description = "Origin ID for API endpoints"
  type        = string
  default     = ""
}

variable "alb_domain_name" {
  description = "ALB domain name for API origin"
  type        = string
  default     = ""
}

variable "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default = {}
}

# Outputs
output "bucket_name" {
  value = aws_s3_bucket.static.id
}

output "bucket_arn" {
  value = aws_s3_bucket.static.arn
}

output "bucket_domain_name" {
  value = aws_s3_bucket.static.bucket_domain_name
}

output "distribution_id" {
  value = aws_cloudfront_distribution.main.id
}

output "distribution_arn" {
  value = aws_cloudfront_distribution.main.arn
}

output "domain_name" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "url" {
  value = "https://${var.domain_name}"
}
