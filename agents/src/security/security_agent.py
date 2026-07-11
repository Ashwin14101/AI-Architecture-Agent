# agents/src/security/security_agent.py

import json
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext, SecurityFinding

class SecurityAgent(BaseAgent):
    def __init__(self):
        super().__init__("Security Agent")

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Running security and compliance audits on architecture...")

        if not context.terraform_code:
            self.log_failure(context, "No compiled Terraform configurations found to run security audits on.")
            raise ValueError("terraform_code is empty.")

        # Serialize terraform files for the LLM audit
        tf_files_str = "\n\n".join([f"=== File: {fname} ===\n{code}" for fname, code in context.terraform_code.items()])

        system_prompt = (
            "You are a Senior Cloud Security Auditor.\n"
            "Your task is to analyze the generated Terraform code and database schemas for security vulnerabilities, "
            "compliance issues (SOC2/GDPR/HIPAA), or architectural weaknesses.\n\n"
            "Format the output as a JSON object matching this schema:\n"
            "{\n"
            "  'findings': [\n"
            "    {\n"
            "      'severity': 'critical' | 'warning' | 'suggestion' (string),\n"
            "      'title': 'Short title of the vulnerability' (string),\n"
            "      'description': 'Explain what the risk is and how it can be exploited' (string),\n"
            "      'recommendation': 'Step-by-step instructions or code snippets showing how to mitigate/fix it' (string)\n"
            "    }\n"
            "  ]\n"
            "}\n\n"
            "Guidelines:\n"
            "1. Focus on real, actionable risks (e.g. check for: unencrypted storage, direct SSH access open, public database subnets, HTTP instead of HTTPS).\n"
            "2. Ensure you check both the database technology settings and the Terraform code resource variables.\n"
            "3. Output ONLY a valid JSON object. Do not include conversational text or Markdown formatting blocks."
        )

        user_prompt = (
            f"Database Technology: {context.database_schema.technology_selection}\n\n"
            f"Generated Terraform Code to Audit:\n{tf_files_str}"
        )

        try:
            # Call the LLM in JSON mode
            json_response = self.llm.call(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                json_mode=True,
                temperature=0.1
            )

            # Parse the JSON string
            data = json.loads(json_response)
            findings_data = data.get("findings", [])
            findings = []

            for f in findings_data:
                findings.append(
                    SecurityFinding(
                        severity=f["severity"],
                        title=f["title"],
                        description=f["description"],
                        recommendation=f["recommendation"]
                    )
                )

            # Populate context security findings
            context.security_findings = findings

            self.log_success(
                context, 
                f"Security audit complete. Found {len(findings)} issues/vulnerabilities."
            )
            return context

        except Exception as e:
            self.log_failure(context, str(e))
            raise e
