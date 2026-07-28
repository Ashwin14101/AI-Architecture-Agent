import re
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext, SecurityFinding

class IacScanner(BaseAgent):
    def __init__(self):
        super().__init__("IaC Security Scanner")

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Running rule-based programmatic security scan on Terraform files...")

        if not context.terraform_code:
            self.log_failure(context, "No Terraform code to scan.")
            return context

        tf_text = "\n".join(context.terraform_code.values())
        findings = []

        # Rule IAC-001: Publicly accessible database
        if re.search(r'publicly_accessible\s*=\s*true', tf_text, re.IGNORECASE):
            findings.append(SecurityFinding(
                severity="critical",
                title="[IAC-001] Publicly Accessible Database",
                description="Terraform configuration contains 'publicly_accessible = true' on a database instance.",
                recommendation="Set 'publicly_accessible = false' and place database in a private subnet."
            ))

        # Rule IAC-002: SSH open to world (port 22 with 0.0.0.0/0)
        if re.search(r'from_port\s*=\s*22[\s\S]*?cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0/0"\s*\]', tf_text, re.IGNORECASE):
            findings.append(SecurityFinding(
                severity="critical",
                title="[IAC-002] Insecure SSH Access",
                description="Security group allows SSH (port 22) ingress directly from the public internet (0.0.0.0/0).",
                recommendation="Restrict SSH access to specific bastion host IPs or internal VPN CIDR ranges."
            ))

        # Rule IAC-003: S3 bucket unencrypted
        if "aws_s3_bucket" in tf_text and "aws_s3_bucket_server_side_encryption_configuration" not in tf_text:
            findings.append(SecurityFinding(
                severity="warning",
                title="[IAC-003] Unencrypted S3 Bucket",
                description="S3 bucket defined without server-side encryption configuration.",
                recommendation="Add 'aws_s3_bucket_server_side_encryption_configuration' using AES256 or KMS."
            ))

        # Rule IAC-004: Missing KMS encryption key
        if "kms" not in tf_text.lower():
            findings.append(SecurityFinding(
                severity="warning",
                title="[IAC-004] Missing Customer Managed KMS Key",
                description="Architecture lacks explicit AWS KMS key definition for encryption at rest.",
                recommendation="Define an 'aws_kms_key' resource for customer-managed encryption."
            ))

        # Rule IAC-005: Hardcoded credentials/secret
        if re.search(r'password\s*=\s*["\'][^"\']{3,}["\']', tf_text, re.IGNORECASE):
            findings.append(SecurityFinding(
                severity="critical",
                title="[IAC-005] Hardcoded Passwords Detected",
                description="Terraform files contain plain-text hardcoded passwords.",
                recommendation="Use Terraform variables or AWS Secrets Manager / Parameter Store to inject secrets."
            ))

        # Append static findings to existing security findings
        context.security_findings.extend(findings)

        self.log_success(
            context,
            f"Programmatic IaC scan complete. Detected {len(findings)} rule-based security issues."
        )
        return context
