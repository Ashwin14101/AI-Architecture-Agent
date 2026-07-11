# agents/src/deployment/deployment_agent.py

import os
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext

class DeploymentAgent(BaseAgent):
    def __init__(self):
        super().__init__("Deployment Agent")

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Preparing local Terraform environment for provisioning...")

        if not context.terraform_code:
            self.log_failure(context, "No Terraform files compiled in workspace to copy.")
            raise ValueError("terraform_code list is empty.")

        try:
            # 1. Define folder path under root project workspace
            deploy_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../deploy"))
            os.makedirs(deploy_dir, exist_ok=True)

            # 2. Write each compiled Terraform configuration code file to disk
            for filename, file_content in context.terraform_code.items():
                file_path = os.path.join(deploy_dir, filename)
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(file_content)

            self.log_success(
                context, 
                f"Infrastructure deployment workspace prepared successfully at: deploy/. "
                f"Provisioning files written: {', '.join(context.terraform_code.keys())}."
            )
            return context

        except Exception as e:
            self.log_failure(context, str(e))
            raise e
