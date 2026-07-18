import sys
import os
import asyncio
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import (
    User, Project, Document, Requirement, 
    ArchitectureVersion, Review, ReviewFinding, AgentExecution
)
from app.middleware.auth_middleware import get_current_user
from app.websocket import manager

# Add both the project root and the agents directory to sys.path
# This supports imports like 'agents.src' in the backend and 'src.common' inside agent modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../agents")))

from agents.src.common.context import AgentContext
from agents.src.document_processing.document_agent import DocumentProcessingAgent
from agents.src.requirement.requirement_agent import RequirementAgent
from agents.src.rag.rag_agent import RagAgent
from agents.src.architecture.architecture_agent import ArchitectureAgent
from agents.src.database.database_agent import DatabaseAgent
from agents.src.api.api_agent import ApiAgent
from agents.src.cloud_mapping.cloud_mapping_agent import CloudMappingAgent
from agents.src.terraform.terraform_agent import TerraformAgent
from agents.src.security.security_agent import SecurityAgent
from agents.src.cost_optimization.cost_agent import CostAgent
from agents.src.validation.validation_agent import ValidationAgent
from agents.src.review.review_agent import ReviewAgent
from agents.src.documentation.documentation_agent import DocumentationAgent
from agents.src.versioning.versioning_agent import VersioningAgent
from agents.src.deployment.deployment_agent import DeploymentAgent

router = APIRouter(prefix="/analysis", tags=["analysis"])

async def run_pipeline_task(project_id: str, db_session_factory):
    # Retrieve a fresh DB session for the background thread
    async with db_session_factory() as db:
        try:
            # 1. Fetch project & latest document text
            project_result = await db.execute(select(Project).filter(Project.id == project_id))
            project = project_result.scalars().first()
            if not project:
                return

            doc_result = await db.execute(
                select(Document)
                .filter(Document.projectId == project_id)
                .order_by(Document.createdAt.desc())
            )
            document = doc_result.scalars().first()
            raw_text = document.extractedText if document else (project.description or "Standard Web App Architecture")

            # 2. Setup Agent Context
            context = AgentContext(project_id=project_id, cloud_provider="aws")
            context.raw_document_text = raw_text

            # 3. List of agents to run in sequence
            pipeline = [
                ("Document Processing", DocumentProcessingAgent()),
                ("Requirement Extraction", RequirementAgent()),
                ("RAG Querying", RagAgent()),
                ("Architecture Design", ArchitectureAgent()),
                ("Database Modelling", DatabaseAgent()),
                ("API Design", ApiAgent()),
                ("Cloud AWS Mapping", CloudMappingAgent()),
                ("Terraform Code Compiling", TerraformAgent()),
                ("Security Auditing", SecurityAgent()),
                ("Cost Optimization", CostAgent()),
                ("Syntax Validation", ValidationAgent()),
                ("Review Scoring", ReviewAgent()),
                ("Documentation Compilation", DocumentationAgent()),
                ("Versioning", VersioningAgent()),
                ("Local Deployment Prep", DeploymentAgent())
            ]

            total_steps = len(pipeline)
            
            # 4. Run agents sequentially
            for idx, (name, agent) in enumerate(pipeline, 1):
                progress = int((idx / total_steps) * 100)
                await manager.broadcast(project_id, {
                    "type": "analysis_update",
                    "data": {
                        "status": "in_progress",
                        "progress": progress,
                        "message": f"Step {idx}/{total_steps}: Running {name}...",
                        "agent": name
                    }
                })

                # Execute Agent
                context = agent.run(context)

                # Log Agent execution in DB
                exec_log = AgentExecution(
                    projectId=project_id,
                    agentName=name,
                    status="success",
                    logs=f"Completed execution of {name}."
                )
                db.add(exec_log)
                await db.commit()

            # 5. Save generated outputs to DB
            # Get latest version count to increment version number
            version_count_res = await db.execute(
                select(ArchitectureVersion)
                .filter(ArchitectureVersion.projectId == project_id)
            )
            version_num = len(version_count_res.scalars().all()) + 1

            # Convert architecture models to dict/JSON serializable structures
            architecture_data = {
                "components": [c.dict() for c in context.architecture.components] if context.architecture else [],
                "database_schema": [
                    {
                        "name": t.name,
                        "columns": [
                            {
                                "name": f.name,
                                "type": f.type,
                                "constraint": f.constraints
                            } for f in t.fields
                        ]
                    } for t in context.database_schema.tables
                ] if context.database_schema else [],
                "apis": [
                    {
                        "path": ep.path,
                        "method": ep.method,
                        "description": ep.description
                    } for ep in context.api_specification.endpoints
                ] if context.api_specification else [],
                "cloud_mappings": [m.dict() for m in context.cloud_mappings] if context.cloud_mappings else [],
                "costs": {
                    "optimizations": [o.dict() for o in context.cost_optimizations] if context.cost_optimizations else [],
                    "total_estimated_monthly_cost": sum(m.estimated_monthly_cost for m in context.cloud_mappings) if context.cloud_mappings else 0
                }
            }

            # Compile the dictionary of files into a single formatted string for the DB text column
            terraform_text = ""
            if context.terraform_code:
                if isinstance(context.terraform_code, dict):
                    for filename, content in context.terraform_code.items():
                        terraform_text += f"# === {filename} ===\n{content}\n\n"
                else:
                    terraform_text = str(context.terraform_code)

            # Save version snapshot
            new_version = ArchitectureVersion(
                projectId=project_id,
                versionNumber=version_num,
                architectureData=architecture_data,
                terraformCode=terraform_text
            )
            db.add(new_version)
            await db.commit()
            await db.refresh(new_version)

            # Save extracted requirements
            if context.requirements:
                for req in context.requirements:
                    db_req = Requirement(
                        projectId=project_id,
                        documentId=document.id if document else None,
                        title=req.id,
                        description=req.text,
                        category=req.category,
                        priority=req.priority
                    )
                    db.add(db_req)

            # Save overall review scoring
            if context.review_report:
                new_review = Review(
                    projectId=project_id,
                    versionId=new_version.id,
                    status="completed",
                    score=int(context.review_report.overall_score)
                )
                db.add(new_review)
                await db.commit()
                await db.refresh(new_review)

                # Save review findings
                for finding in context.review_report.findings:
                    db_finding = ReviewFinding(
                        reviewId=new_review.id,
                        ruleId="RULE-001",
                        severity="medium",
                        description=finding,
                        recommendation="Review configuration standards.",
                        status="pending"
                    )
                    db.add(db_finding)

            await db.commit()

            # Broadcast final completion
            await manager.broadcast(project_id, {
                "type": "analysis_update",
                "data": {
                    "status": "completed",
                    "progress": 100,
                    "message": "AI Architecture Generation completed successfully!",
                    "score": context.review_report.overall_score if context.review_report else 100
                }
            })

        except Exception as e:
            await db.rollback()
            # Broadcast pipeline failure
            await manager.broadcast(project_id, {
                "type": "analysis_update",
                "data": {
                    "status": "failed",
                    "progress": 100,
                    "message": f"Pipeline failed: {str(e)}"
                }
            })

@router.post("/{projectId}/start")
async def start_analysis(projectId: str, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Verify project exists
    result = await db.execute(select(Project).filter(Project.id == projectId, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get the raw session maker from the database binding to pass to the background thread
    from app.database import SessionLocal
    background_tasks.add_task(run_pipeline_task, projectId, SessionLocal)
    
    return {"status": "success", "message": "Analysis started"}
