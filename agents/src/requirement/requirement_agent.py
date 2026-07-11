# agents/src/requirement/requirement_agent.py

import json
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext, Requirement

class RequirementAgent(BaseAgent):
    def __init__(self):
        super().__init__("Requirement Agent")

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Extracting structured requirements from document...")

        if not context.raw_document_text.strip():
            self.log_failure(context, "No structured raw document text found in workspace context.")
            raise ValueError("raw_document_text is empty.")

        system_prompt = (
            "You are an expert Requirements Engineer.\n"
            "Your task is to analyze the provided project specification and extract a list of individual, "
            "actionable requirements in structured JSON format.\n\n"
            "Format the output as a JSON object containing a 'requirements' list. Each requirement must follow this schema:\n"
            "{\n"
            "  'requirements': [\n"
            "    {\n"
            "      'id': 'REQ-001' (sequential string code),\n"
            "      'text': 'Description of the requirement' (string),\n"
            "      'category': 'functional' | 'non-functional' | 'constraint' | 'business-rule' | 'compliance' | 'integration' (string),\n"
            "      'priority': 'critical' | 'high' | 'medium' | 'low' (string)\n"
            "    }\n"
            "  ]\n"
            "}\n\n"
            "Guidelines:\n"
            "1. Be thorough. Extract all technical capabilities, architectural constraints, security needs, and business rules.\n"
            "2. Do not combine unrelated requirements into a single item. Keep them granular.\n"
            "3. Output ONLY a valid JSON object. Do not include conversational text or Markdown formatting blocks."
        )

        user_prompt = f"Extract requirements from this structured project document:\n\n{context.raw_document_text}"

        try:
            # We call the LLM in JSON mode
            json_response = self.llm.call(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                json_mode=True,
                temperature=0.1
            )

            # Parse the JSON string
            data = json.loads(json_response)
            extracted_reqs = data.get("requirements", [])

            # Convert to Pydantic objects and add to context
            context.requirements = [
                Requirement(
                    id=req["id"],
                    text=req["text"],
                    category=req["category"],
                    priority=req["priority"]
                )
                for req in extracted_reqs
            ]

            self.log_success(context, f"Successfully extracted {len(context.requirements)} requirements.")
            return context

        except Exception as e:
            self.log_failure(context, str(e))
            raise e
