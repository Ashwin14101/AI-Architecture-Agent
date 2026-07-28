import re
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext

class ProgrammaticValidator(BaseAgent):
    def __init__(self):
        super().__init__("Programmatic Code Validator")

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Running programmatic syntax & balance checks on Terraform code...")

        if not context.terraform_code:
            self.log_failure(context, "No Terraform files found to validate.")
            return context

        errors = []
        main_tf = context.terraform_code.get("main.tf", "")
        var_tf = context.terraform_code.get("variables.tf", "")
        out_tf = context.terraform_code.get("outputs.tf", "")

        # 1. HCL Brace Balance Check
        for fname, code in context.terraform_code.items():
            open_braces = code.count('{')
            close_braces = code.count('}')
            if open_braces != close_braces:
                errors.append(f"Mismatched braces in '{fname}': found {open_braces} '{{' and {close_braces} '}}'.")

        # 2. Variable Declaration Check
        # Find all var.variable_name references in main.tf
        var_refs = set(re.findall(r'var\.([a-zA-Z0-9_]+)', main_tf))
        # Find all variable "variable_name" declarations in variables.tf
        var_defs = set(re.findall(r'variable\s+["\']([a-zA-Z0-9_]+)["\']', var_tf))
        
        missing_vars = var_refs - var_defs
        if missing_vars:
            errors.append(f"Undeclared variables referenced in main.tf but missing in variables.tf: {', '.join(sorted(missing_vars))}")

        # 3. Output Reference Check
        # Find defined resource types & names in main.tf e.g. resource "aws_instance" "web" -> aws_instance.web
        resource_defs = set()
        for match in re.finditer(r'resource\s+["\']([a-zA-Z0-9_]+)["\']\s+["\']([a-zA-Z0-9_]+)["\']', main_tf):
            resource_defs.add(f"{match.group(1)}.{match.group(2)}")

        # Find output references in outputs.tf e.g. aws_instance.web.id
        output_refs = set()
        for match in re.finditer(r'value\s*=\s*([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)', out_tf):
            output_refs.add(match.group(1))

        # 4. Check for empty block declarations
        for fname, code in context.terraform_code.items():
            if re.search(r'resource\s+["\'][^"\']+["\']\s+["\'][^"\']+["\']\s*\{\s*\}', code):
                errors.append(f"Empty resource block detected in '{fname}'.")

        if errors:
            error_str = "; ".join(errors)
            self.log_failure(context, f"Programmatic validation detected syntax errors: {error_str}")
        else:
            self.log_success(context, "Programmatic code validation passed! All braces balanced and variables declared.")

        return context
