# agents/src/database/database_agent.py

import json
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext, DatabaseSchema, DatabaseTable, DatabaseTableField, DatabaseRelationship

class DatabaseAgent(BaseAgent):
    def __init__(self):
        super().__init__("Database Agent")

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Designing database schema and technology selection...")

        if not context.architecture.components:
            self.log_failure(context, "No architecture layout found to design database models for.")
            raise ValueError("architecture components are empty.")

        # Gather context details for the prompt
        reqs_str = "\n".join([f"- [{r.id}] ({r.category.upper()}): {r.text}" for r in context.requirements])
        standards_str = "\n".join([f"- {s}" for s in context.retrieved_knowledge])
        components_str = "\n".join([f"- [{c.id}] {c.name} (Type: {c.type})" for c in context.architecture.components])

        system_prompt = (
            "You are a Senior Database Engineer.\n"
            "Your task is to choose the best database technology and design the complete schema structure "
            "based on the application requirements, logical components, and cloud standards guidelines.\n\n"
            "Format the output as a JSON object matching this schema:\n"
            "{\n"
            "  'technology_selection': 'PostgreSQL' | 'MongoDB' | 'DynamoDB' (string),\n"
            "  'tables': [\n"
            "    {\n"
            "      'name': 'table_name' (string),\n"
            "      'fields': [\n"
            "        {\n"
            "          'name': 'field_name' (string),\n"
            "          'type': 'VARCHAR(255)' | 'UUID' | 'INT' | 'TIMESTAMP' etc. (string),\n"
            "          'constraints': 'PRIMARY KEY' | 'UNIQUE NOT NULL' | 'NULL' etc. (optional string)\n"
            "        }\n"
            "      ],\n"
            "      'relationships': [\n"
            "        {\n"
            "          'target_table': 'other_table_name' (string),\n"
            "          'type': 'one-to-many' | 'one-to-one' | 'many-to-many' (string),\n"
            "          'foreign_key': 'field_name_in_this_table' (string)\n"
            "        }\n"
            "      ],\n"
            "      'indexes': ['idx_table_field'] (list of strings)\n"
            "    }\n"
            "  ]\n"
            "}\n\n"
            "Guidelines:\n"
            "1. Choose the DB engine that best matches the constraints (e.g. for low budget, Serverless/SQLite/PostgreSQL; for high-scale document catalog, PostgreSQL/MongoDB).\n"
            "2. Design schemas for all core entities mentioned in requirements (e.g., users, product catalog, sessions).\n"
            "3. Hashing/security considerations: Ensure appropriate fields (like password_hash) are present and properly sized.\n"
            "4. Output ONLY a valid JSON object. Do not include conversational text or Markdown formatting blocks."
        )

        user_prompt = (
            f"Requirements:\n{reqs_str}\n\n"
            f"Logical Components:\n{components_str}\n\n"
            f"Retrieved Company Cloud Guidelines:\n{standards_str}"
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
            
            tables_data = data.get("tables", [])
            tables = []

            for t in tables_data:
                fields = [
                    DatabaseTableField(
                        name=f["name"],
                        type=f["type"],
                        constraints=f.get("constraints")
                    )
                    for f in t.get("fields", [])
                ]

                relationships = [
                    DatabaseRelationship(
                        target_table=r["target_table"],
                        type=r["type"],
                        foreign_key=r["foreign_key"]
                    )
                    for r in t.get("relationships", [])
                ]

                tables.append(
                    DatabaseTable(
                        name=t["name"],
                        fields=fields,
                        relationships=relationships,
                        indexes=t.get("indexes", [])
                    )
                )

            # Populate database schema
            context.database_schema = DatabaseSchema(
                tables=tables,
                technology_selection=data.get("technology_selection", "PostgreSQL")
            )

            self.log_success(
                context, 
                f"Database schema designed using {context.database_schema.technology_selection}. Created {len(tables)} tables."
            )
            return context

        except Exception as e:
            self.log_failure(context, str(e))
            raise e
