# agents/src/api/api_agent.py

import json
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext, ApiSpecification, ApiEndpoint

class ApiAgent(BaseAgent):
    def __init__(self):
        super().__init__("API Agent")

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Designing REST API specifications...")

        if not context.requirements:
            self.log_failure(context, "No requirements found in workspace context to design APIs for.")
            raise ValueError("requirements list is empty.")

        # Gather context details for the prompt
        reqs_str = "\n".join([f"- [{r.id}] ({r.category.upper()}): {r.text}" for r in context.requirements])
        components_str = "\n".join([f"- [{c.id}] {c.name} (Type: {c.type})" for c in context.architecture.components])

        system_prompt = (
            "You are an expert API Architect.\n"
            "Your task is to design a set of RESTful API endpoints matching the application requirements "
            "and architecture components.\n\n"
            "Format the output as a JSON object matching this schema:\n"
            "{\n"
            "  'endpoints': [\n"
            "    {\n"
            "      'path': '/api/resource' (string),\n"
            "      'method': 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' (string),\n"
            "      'description': 'What this endpoint does' (string),\n"
            "      'request_body': 'JSON structure string representation' (optional string),\n"
            "      'response_body': 'JSON structure string representation' (optional string),\n"
            "      'auth_required': true | false (boolean)\n"
            "    }\n"
            "  ]\n"
            "}\n\n"
            "Guidelines:\n"
            "1. Design clean endpoints for all core application operations (e.g. auth routes, product list routes).\n"
            "2. Make sure fields in request/response bodies correspond with databases and logical parameters.\n"
            "3. Output ONLY a valid JSON object. Do not include conversational text or Markdown formatting blocks."
        )

        user_prompt = (
            f"Requirements:\n{reqs_str}\n\n"
            f"Logical Components:\n{components_str}"
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
            endpoints_data = data.get("endpoints", [])
            endpoints = []

            for ep in endpoints_data:
                endpoints.append(
                    ApiEndpoint(
                        path=ep["path"],
                        method=ep["method"],
                        description=ep["description"],
                        request_body=ep.get("request_body"),
                        response_body=ep.get("response_body"),
                        auth_required=ep.get("auth_required", True)
                    )
                )

            # Populate api specification
            context.api_specification = ApiSpecification(endpoints=endpoints)

            self.log_success(
                context, 
                f"API design complete. Generated {len(endpoints)} REST API endpoints."
            )
            return context

        except Exception as e:
            self.log_failure(context, str(e))
            raise e
