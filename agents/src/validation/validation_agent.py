# agents/src/validation/validation_agent.py

import json
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext

class ValidationAgent(BaseAgent):
    def __init__(self):
        super().__init__("Validation Agent")

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Running static code validation on Terraform files...")

        if not context.terraform_code:
            self.log_failure(context, "No Terraform files found to validate.")
            raise ValueError("terraform_code is empty.")

        # Serialize terraform files for syntax check
        tf_files_str = "\n\n".join([f"=== File: {fname} ===\n{code}" for fname, code in context.terraform_code.items()])

        system_prompt = (
            "You are a Senior Terraform Code QA Auditor.\n"
            "Your task is to run a static syntax audit on the generated Terraform code blocks.\n"
            "Identify if there are any variables referenced in main.tf that are not declared in variables.tf, "
            "any resources referenced in outputs.tf that do not exist, or any syntax/structural formatting errors.\n\n"
            "Format the output as a JSON object matching this schema:\n"
            "{\n"
            "  'valid': true | false (boolean),\n"
            "  'errors': ['Description of error 1', 'Description of error 2'] (list of strings)\n"
            "}\n\n"
            "Guidelines:\n"
            "1. Output ONLY a valid JSON object. Do not include conversational text or Markdown formatting blocks."
        )

        user_prompt = (
            f"Generated Terraform Code to Validate:\n{tf_files_str}"
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
            is_valid = data.get("valid", True)
            errors = data.get("errors", [])

            if is_valid:
                self.log_success(context, "Static syntax validation passed! No compile errors found.")
            else:
                error_summary = "; ".join(errors)
                self.log_failure(context, f"Validation failed with errors: {error_summary}")

            return context

        except Exception as e:
            self.log_failure(context, str(e))
            raise e
