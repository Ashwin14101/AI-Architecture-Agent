# agents/src/cost_optimization/cost_agent.py

import json
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext, CostOptimization

class CostAgent(BaseAgent):
    def __init__(self):
        super().__init__("Cost Optimization Agent")

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Analyzing cloud configurations for cost optimization opportunities...")

        if not context.cloud_mappings:
            self.log_failure(context, "No cloud mappings found in workspace context to optimize.")
            raise ValueError("cloud_mappings list is empty.")

        # Serialize cloud mappings for the LLM review
        mappings_str = "\n".join([
            f"- Component [{m.component_id}]: {m.service_name} (Tier: {m.tier}, Cost: ${m.estimated_monthly_cost}/month)"
            for m in context.cloud_mappings
        ])

        system_prompt = (
            "You are an expert Cloud Financial Engineer (FinOps).\n"
            "Your task is to analyze the active cloud mappings and cost estimates, and suggest "
            "concrete optimizations to lower the total monthly bill.\n\n"
            "Format the output as a JSON object matching this schema:\n"
            "{\n"
            "  'optimizations': [\n"
            "    {\n"
            "      'service_name': 'AWS service name e.g. AWS RDS PostgreSQL, AWS ECS Fargate' (string),\n"
            "      'current_cost': current monthly cost as float (e.g. 15.00),\n"
            "      'optimized_cost': optimized monthly cost as float (e.g. 8.00),\n"
            "      'recommendation': 'Explain how to achieve this saving e.g. downsize instance tier, use Graviton t4g.micro' (string)\n"
            "    }\n"
            "  ]\n"
            "}\n\n"
            "Guidelines:\n"
            "1. Be practical. Check for over-provisioning (e.g. suggests small instances like t3.micro or serverless where appropriate).\n"
            "2. Keep the overall system highly operational while recommending cheaper equivalent options.\n"
            "3. Output ONLY a valid JSON object. Do not include conversational text or Markdown formatting blocks."
        )

        user_prompt = (
            f"Active Cloud Mappings & Costs:\n{mappings_str}\n"
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
            opt_data = data.get("optimizations", [])
            optimizations = []

            for o in opt_data:
                optimizations.append(
                    CostOptimization(
                        service_name=o["service_name"],
                        current_cost=float(o["current_cost"]),
                        optimized_cost=float(o["optimized_cost"]),
                        recommendation=o["recommendation"]
                    )
                )

            # Populate context cost optimizations
            context.cost_optimizations = optimizations

            total_savings = sum(o.current_cost - o.optimized_cost for o in optimizations)
            self.log_success(
                context, 
                f"Cost analysis complete. Found {len(optimizations)} optimization opportunities. "
                f"Total potential savings: ${total_savings:.2f}/month."
            )
            return context

        except Exception as e:
            self.log_failure(context, str(e))
            raise e
