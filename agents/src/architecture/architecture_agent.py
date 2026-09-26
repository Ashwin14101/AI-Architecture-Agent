# agents/src/architecture/architecture_agent.py

import json
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext, HighLevelArchitecture, ArchitectureComponent, ComponentConnection

class ArchitectureAgent(BaseAgent):
    def __init__(self):
        super().__init__("Architecture Agent")

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Designing high-level system architecture layout...")

        if not context.requirements:
            self.log_failure(context, "No requirements found in workspace context to design for.")
            raise ValueError("requirements list is empty.")

        # Format requirements and standards as strings for the prompt
        reqs_str = "\n".join([f"- [{r.id}] ({r.category.upper()}): {r.text}" for r in context.requirements])
        standards_str = "\n".join([f"- {s}" for s in context.retrieved_knowledge])

        system_prompt = (
            "You are a Principal Cloud Solution Architect.\n"
            "Your task is to design a high-level system architecture based on the user's requirements "
            "and the company cloud standards guidelines.\n\n"
            "Format the output as a JSON object matching this schema:\n"
            "{\n"
            "  'components': [\n"
            "    {\n"
            "      'id': 'COMP-001' (sequential string code),\n"
            "      'name': 'Name of Component' (string),\n"
            "      'type': 'web-server' | 'database' | 'queue' | 'cache' | 'load-balancer' (string),\n"
            "      'description': 'Role of this component' (string)\n"
            "    }\n"
            "  ],\n"
            "  'connections': [\n"
            "    {\n"
            "      'from': 'COMP-001' (source component id),\n"
            "      'to': 'COMP-002' (target component id),\n"
            "      'protocol': 'HTTP' | 'gRPC' | 'AMQP' | 'TCP' (string),\n"
            "      'description': 'Reason/method of data connection' (string)\n"
            "    }\n"
            "  ],\n"
            "  'patterns': ['Pattern Name 1', 'Pattern Name 2'] (list of architectural patterns used),\n"
            "  'rationale': 'Text explaining why this design was chosen and how it satisfies constraints' (string)\n"
            "}\n\n"
            "Guidelines:\n"
            "1. Design a clean, decoupled system (e.g. separate web frontend, API backend server, and database server).\n"
            "2. Satisfy all critical requirements, constraints, and standard policies.\n"
            "3. Output ONLY a valid JSON object. Do not include conversational text or Markdown formatting blocks."
        )

        user_prompt = (
            f"Requirements to satisfy:\n{reqs_str}\n\n"
            f"Retrieved Company Cloud Guidelines to enforce:\n{standards_str}"
        )

        try:
            # Call the LLM in JSON mode
            json_response = self.llm.call(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                json_mode=True,
                temperature=0.2
            )

            # Parse the JSON string
            data = json.loads(json_response)

            # Convert to Pydantic objects
            components = [
                ArchitectureComponent(
                    id=c["id"],
                    name=c["name"],
                    type=c["type"],
                    description=c["description"]
                )
                for c in data.get("components", [])
            ]

            connections = [
                ComponentConnection(
                    **{"from": conn["from"], "to": conn["to"], "protocol": conn["protocol"], "description": conn["description"]}
                )
                for conn in data.get("connections", [])
            ]

            # Populate context architecture
            context.architecture = HighLevelArchitecture(
                components=components,
                connections=connections,
                patterns=data.get("patterns", []),
                rationale=data.get("rationale", "")
            )

            self.log_success(
                context, 
                f"Architecture layout designed. Created {len(components)} logical components and {len(connections)} connections."
            )
            return context

        except Exception as e:
            self.log_failure(context, str(e))
            raise e
