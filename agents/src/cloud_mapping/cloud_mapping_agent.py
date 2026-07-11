# agents/src/cloud_mapping/cloud_mapping_agent.py

import json
import os
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext, CloudServiceMapping

class CloudMappingAgent(BaseAgent):
    def __init__(self):
        super().__init__("Cloud Mapping Agent")

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, f"Mapping logical components to {context.cloud_provider.upper()} services...")

        if not context.architecture.components:
            self.log_failure(context, "No architecture layout found in workspace context to map.")
            raise ValueError("architecture components are empty.")

        # Prepare formatting variables
        components_str = "\n".join([
            f"- [{c.id}] {c.name} (Type: {c.type}): {c.description}"
            for c in context.architecture.components
        ])
        
        db_tech = context.database_schema.technology_selection
        standards_str = "\n".join([f"- {s}" for s in context.retrieved_knowledge])
        
        system_prompt = (
            f"You are a Cloud Solution Architect specializing in {context.cloud_provider.upper()}.\n"
            "Your task is to map each logical system component to a physical cloud service, "
            "assign size/pricing tiers, choose a default region (use us-east-1 for AWS), and estimate monthly costs.\n\n"
            "Format the output as a JSON object matching this schema:\n"
            "{\n"
            "  'mappings': [\n"
            "    {\n"
            "      'component_id': 'COMP-001' (string),\n"
            "      'service_name': 'AWS service name e.g. AWS ECS Fargate, AWS RDS PostgreSQL' (string),\n"
            "      'tier': 'Size/Pricing tier e.g. db.t3.micro, t3.medium, Serverless' (string),\n"
            "      'region': 'us-east-1' (string),\n"
            "      'estimated_monthly_cost': monthly cost as float (e.g. 15.00)\n"
            "    }\n"
            "  ]\n"
            "}\n\n"
            "Guidelines:\n"
            "1. Budget Discipline: You must keep the total sum of all estimated_monthly_cost values under the user's budget constraint ($200).\n"
            "2. DB Integration: The Database component MUST be mapped using the chosen technology selection: "
            f"'{db_tech}'. Refrain from choosing expensive database options if small/Serverless ones fit the budget.\n"
            "3. Enforce the retrieved company guidelines:\n{standards_str}\n"
            "4. Output ONLY a valid JSON object. Do not include conversational text or Markdown formatting blocks."
        )

        user_prompt = (
            f"Logical Components to Map:\n{components_str}\n\n"
            f"Chosen Database Technology: {db_tech}\n"
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
            mappings_data = data.get("mappings", [])
            mappings = []

            for m in mappings_data:
                mappings.append(
                    CloudServiceMapping(
                        component_id=m["component_id"],
                        service_name=m["service_name"],
                        tier=m["tier"],
                        region=m["region"],
                        estimated_monthly_cost=float(m["estimated_monthly_cost"])
                    )
                )

            # Populate context cloud mappings
            context.cloud_mappings = mappings

            total_cost = sum(m.estimated_monthly_cost for m in mappings)
            self.log_success(
                context, 
                f"Cloud mapping complete. Mapped {len(mappings)} components. "
                f"Total Estimated Cost: ${total_cost:.2f}/month."
            )
            return context

        except Exception as e:
            self.log_failure(context, str(e))
            raise e
