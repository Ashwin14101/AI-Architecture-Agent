# agents/src/review/review_agent.py

import json
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext, ReviewReport

class ReviewAgent(BaseAgent):
    def __init__(self):
        super().__init__("Architecture Review Agent")

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Executing final architectural quality review...")

        # Gather validations, costs, and security logs for the review prompt
        reqs_str = "\n".join([f"- [{r.id}]: {r.text}" for r in context.requirements])
        sec_str = "\n".join([f"- [{f.severity.upper()}]: {f.title}" for f in context.security_findings])
        cost_str = "\n".join([f"- {o.service_name}: Suggests saving of ${o.current_cost - o.optimized_cost}/month" for o in context.cost_optimizations])
        
        # Pull validation errors from the system logs
        val_logs = [log.message for log in context.agent_logs if log.agent_name == "Validation Agent" and log.status == "failed"]
        val_str = "\n".join([f"- {msg}" for msg in val_logs]) if val_logs else "No compilation errors found."

        system_prompt = (
            "You are a member of the Enterprise Architecture Review Board.\n"
            "Your task is to review the complete system design and output a scorecard grading the design "
            "across 5 pillars on a scale of 0 to 100, along with list of final review findings.\n\n"
            "Format the output as a JSON object matching this schema:\n"
            "{\n"
            "  'overall_score': overall average score (float),\n"
            "  'completeness': score (0-100) on whether all requirements are satisfied (float),\n"
            "  'consistency': score (0-100) on whether APIs, DBs, and TF configs match (float),\n"
            "  'security': score (0-100) based on severity of security findings (float),\n"
            "  'scalability': score (0-100) based on design architecture limits (float),\n"
            "  'cost_efficiency': score (0-100) based on budget alignment and cost suggestions (float),\n"
            "  'findings': ['Summary finding 1', 'Summary finding 2'] (list of strings)\n"
            "}\n\n"
            "Guidelines:\n"
            "1. Be objective. Deduct points if security issues (like hardcoded passwords) are present, "
            "if validation compile errors are detected, or if budget headroom is low.\n"
            "2. Output ONLY a valid JSON object. Do not include conversational text or Markdown formatting blocks."
        )

        user_prompt = (
            f"Functional Requirements:\n{reqs_str}\n\n"
            f"Security Risks Found:\n{sec_str}\n\n"
            f"Cost Analysis Logs:\n{cost_str}\n\n"
            f"Syntax Validation Errors:\n{val_str}\n"
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

            # Populate context review report
            context.review_report = ReviewReport(
                overall_score=float(data["overall_score"]),
                completeness=float(data["completeness"]),
                consistency=float(data["consistency"]),
                security=float(data["security"]),
                scalability=float(data["scalability"]),
                cost_efficiency=float(data["cost_efficiency"]),
                findings=data.get("findings", [])
            )

            self.log_success(
                context, 
                f"Review complete. Overall Quality Score: {context.review_report.overall_score:.1f}/100."
            )
            return context

        except Exception as e:
            self.log_failure(context, str(e))
            raise e
