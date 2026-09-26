# agents/src/document_processing/document_agent.py

from src.common.base_agent import BaseAgent
from src.common.context import AgentContext

class DocumentProcessingAgent(BaseAgent):
    def __init__(self):
        super().__init__("Document Processing Agent")

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Structuring raw document text...")

        if not context.raw_document_text.strip():
            self.log_failure(context, "No raw document text found in workspace context.")
            raise ValueError("raw_document_text is empty.")

        # System prompt instructing the model to clean and structure the document
        system_prompt = (
            "You are an expert Document Processing Agent.\n"
            "Your task is to take raw, unstructured, or parsed text from a requirement document "
            "and organize it into structured, clean Markdown.\n"
            "Guidelines:\n"
            "1. Remove any formatting anomalies, line break issues, duplicate page headers/footers.\n"
            "2. Retain ALL original information, details, numbers, and technical requirements.\n"
            "3. Organize the text logically using clear markdown headings (#, ##), bullet points, and tables if present.\n"
            "4. Output ONLY the clean structured Markdown. Do not include conversational introduction or commentary."
        )

        user_prompt = f"Here is the raw document content:\n\n{context.raw_document_text}"

        try:
            structured_markdown = self.llm.call(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                json_mode=False,
                temperature=0.1
            )

            # Update the context with the cleaned, structured text
            context.raw_document_text = structured_markdown.strip()
            
            self.log_success(context, "Document structured successfully.")
            return context

        except Exception as e:
            self.log_failure(context, str(e))
            raise e
