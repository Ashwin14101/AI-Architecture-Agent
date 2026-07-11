# agents/src/documentation/documentation_agent.py

import os
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext

class DocumentationAgent(BaseAgent):
    def __init__(self):
        super().__init__("Documentation Agent")

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Compiling final architectural decision records and runbooks...")

        # Gather design specs
        reqs_str = "\n".join([f"- [{r.id}] ({r.category.upper()}): {r.text}" for r in context.requirements])
        components_str = "\n".join([f"- [{c.id}] {c.name} (Type: {c.type}): {c.description}" for c in context.architecture.components])
        db_tech = context.database_schema.technology_selection
        db_tables = ", ".join([t.name for t in context.database_schema.tables])
        apis_str = ", ".join([f"{ep.method} {ep.path}" for ep in context.api_specification.endpoints])
        
        system_prompt = (
            "You are a Senior Principal Technical Writer.\n"
            "Your task is to compile a professional, thorough, and clean Markdown Architecture Documentation "
            "and Architecture Decision Record (ADR) summarizing the designed system.\n\n"
            "Your output should be a complete, beautifully formatted Markdown file containing sections for:\n"
            "1. Project Executive Summary & Creators.\n"
            "2. Functional & Non-Functional Requirements Checklist.\n"
            "3. Logical Component Architecture & Patterns Applied.\n"
            "4. Database Design (Engine selection, table list, schema relationships).\n"
            "5. REST API Specifications & Routing Map.\n"
            "6. Physical Cloud Topology, Service mappings, and Cost estimates.\n"
            "7. Operations Runbook (how to deploy using the compiled Terraform configs).\n\n"
            "Make the document look premium. Output ONLY the raw Markdown text. Do not include JSON formatting or code fence wrapping."
        )

        user_prompt = (
            f"Project: CloudStore E-commerce Portal\n\n"
            f"Requirements:\n{reqs_str}\n\n"
            f"Logical Components:\n{components_str}\n\n"
            f"Database Engine: {db_tech} (Tables: {db_tables})\n\n"
            f"REST Endpoints: {apis_str}\n\n"
            f"Total Monthly Cost Estimate: ${sum(m.estimated_monthly_cost for m in context.cloud_mappings):.2f}/month\n"
        )

        try:
            markdown_content = self.llm.call(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.3
            )

            # Save under root project workspace docs folder
            output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../docs"))
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, "architecture_docs.md")

            with open(output_path, "w", encoding="utf-8") as f:
                f.write(markdown_content)

            self.log_success(
                context, 
                f"Architecture documentation compiled and written to: docs/architecture_docs.md"
            )
            return context

        except Exception as e:
            self.log_failure(context, str(e))
            raise e
