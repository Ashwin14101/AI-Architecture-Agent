# agents/src/versioning/versioning_agent.py

import sqlite3
import json
import os
from datetime import datetime
from src.common.base_agent import BaseAgent
from src.common.context import AgentContext

class VersioningAgent(BaseAgent):
    def __init__(self):
        super().__init__("Versioning Agent")
        # Define path for SQLite version database
        self.db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../versions.db"))

    def run(self, context: AgentContext) -> AgentContext:
        self.log_start(context, "Saving current system design state to SQLite version history...")

        try:
            # 1. Connect to SQLite database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # 2. Create the versions schema table if it does not exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS design_versions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    architecture_json TEXT NOT NULL,
                    db_schema_json TEXT NOT NULL,
                    api_spec_json TEXT NOT NULL,
                    terraform_json TEXT NOT NULL,
                    overall_score REAL
                )
            """)
            conn.commit()

            # 3. Serialize our active context features into JSON format
            arch_data = {
                "components": [c.model_dump() for c in context.architecture.components],
                "connections": [c.model_dump(by_alias=True) for c in context.architecture.connections],
                "patterns": context.architecture.patterns,
                "rationale": context.architecture.rationale
            }

            db_schema_data = {
                "technology": context.database_schema.technology_selection,
                "tables": [t.model_dump() for t in context.database_schema.tables]
            }

            api_spec_data = {
                "endpoints": [ep.model_dump() for ep in context.api_specification.endpoints]
            }

            terraform_data = context.terraform_code

            score = context.review_report.overall_score if context.review_report else None
            timestamp = datetime.utcnow().isoformat()

            # 4. Insert design snapshot record
            cursor.execute("""
                INSERT INTO design_versions (
                    project_id, timestamp, architecture_json, db_schema_json, api_spec_json, terraform_json, overall_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                context.project_id,
                timestamp,
                json.dumps(arch_data),
                json.dumps(db_schema_data),
                json.dumps(api_spec_data),
                json.dumps(terraform_data),
                score
            ))

            conn.commit()
            
            # Fetch the generated Version ID
            version_id = cursor.lastrowid
            conn.close()

            self.log_success(
                context, 
                f"Design version successfully persisted to SQLite database. Assigned Version ID: #{version_id}."
            )
            return context

        except Exception as e:
            self.log_failure(context, str(e))
            raise e
