# Global resources like Route 53 hosted zones and Organization settings

data "aws_caller_identity" "current" {}

data "aws_organizations_organization" "current" {
  count = var.enable_organizations ? 1 : 0
}

# Route 53 hosted zone for the domain
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = merge(var.tags, {
    Name = "${var.project_name}-hosted-zone"
  })
}

# Delegation set records (for external DNS)
resource "aws_route53_record" "ns" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "NS"
  ttl     = 172800

  records = aws_route53_zone.main.name_servers
}

# Organization Service Control Policies (if organizations enabled)
resource "aws_organizations_policy" "prevent_audit_deletion" {
  count = var.enable_organizations ? 1 : 0

  name        = "${var.project_name}-prevent-audit-deletion"
  description = "Prevent deletion of audit services"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "PreventAuditDeletion"
        Effect   = "Deny"
        Action   = [
          "cloudtrail:DeleteTrail",
          "config:DeleteConfigurationRecorder",
          "config:DeleteDeliveryChannel",
          "guardduty:DeleteDetector",
          "securityhub:DeleteHub"
        ]
        Resource = "*"
      }
    ]
  })

  depends_on = [data.aws_organizations_organization.current]
}

resource "aws_organizations_policy_attachment" "prevent_audit_deletion" {
  count          = var.enable_organizations ? 1 : 0
  policy_id      = aws_organizations_policy.prevent_audit_deletion[0].id
  target_id      = data.aws_organizations_organization.current[0].roots[0].id
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "domain_name" {
  description = "Root domain name"
  type        = string
}

variable "enable_organizations" {
  description = "Enable AWS Organizations features"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default = {}
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route 53 name servers"
  value       = aws_route53_zone.main.name_servers
}