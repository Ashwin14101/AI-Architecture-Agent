import sys
import os
import asyncio
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import tempfile
import subprocess
from app.services.aws_pricing import estimate_architecture_costs

from app.database import get_db
from app.models import (
    User, Project, Document, Requirement, 
    ArchitectureVersion, Review, ReviewFinding, AgentExecution
)
from app.middleware.auth_middleware import get_current_user
from app.middleware.rbac_middleware import require_role
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
from agents.src.security.iac_scanner import IacScanner
from agents.src.cost_optimization.cost_agent import CostAgent
from agents.src.validation.validation_agent import ValidationAgent
from agents.src.validation.programmatic_validator import ProgrammaticValidator
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
                ("Programmatic IaC Scan", IacScanner()),
                ("Cost Optimization", CostAgent()),
                ("Syntax Validation", ValidationAgent()),
                ("Programmatic Syntax Validation", ProgrammaticValidator()),
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
async def start_analysis(projectId: str, background_tasks: BackgroundTasks, current_user: User = Depends(require_role("admin", "architect", "user")), db: AsyncSession = Depends(get_db)):
    # Verify project exists
    result = await db.execute(select(Project).filter(Project.id == projectId, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get the raw session maker from the database binding to pass to the background thread
    from app.database import SessionLocal
    background_tasks.add_task(run_pipeline_task, projectId, SessionLocal)
    
    return {"status": "success", "message": "Analysis started"}

@router.post("/{projectId}/scan")
async def run_security_scan(projectId: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == projectId, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ver_result = await db.execute(
        select(ArchitectureVersion)
        .filter(ArchitectureVersion.projectId == projectId)
        .order_by(ArchitectureVersion.versionNumber.desc())
    )
    latest_version = ver_result.scalars().first()
    if not latest_version or not latest_version.terraformCode:
        return {"error": "No Terraform code generated yet"}

    tf_code = latest_version.terraformCode
    tmpdir = tempfile.mkdtemp()
    tf_path = os.path.join(tmpdir, 'main.tf')
    with open(tf_path, 'w') as f:
        f.write(tf_code)

    try:
        run_result = subprocess.run(['checkov', '-d', tmpdir, '--output', 'json', '--quiet'], capture_output=True, text=True, timeout=60)
        data = json.loads(run_result.stdout)
    except FileNotFoundError:
        return {"error": "Checkov not installed", "install": "pip install checkov"}
    except Exception as e:
        return {"error": str(e)}

    if isinstance(data, list):
        data = data[0] if data else {}

    results = data.get("results", {})
    failed_checks = results.get("failed_checks", [])
    
    findings = []
    for check in failed_checks:
        findings.append({
            "check_id": check.get("check_id"),
            "resource": check.get("resource"),
            "title": check.get("check_name"),
            "severity": check.get("severity") or "MEDIUM",
            "status": "FAILED"
        })
        
        # Save finding to DB
        db_finding = ReviewFinding(
            reviewId=latest_version.id,  # using versionId as reviewId for simplicity if no review exists
            ruleId=check.get("check_id", "UNKNOWN"),
            severity=check.get("severity") or "MEDIUM",
            description=check.get("check_name", "Security finding"),
            recommendation="Review security configuration",
            status="pending"
        )
        db.add(db_finding)
        
    await db.commit()

    response = {
        "project_id": projectId,
        "scan_status": "complete",
        "total_checks": len(failed_checks) + len(results.get("passed_checks", [])),
        "failed": len(failed_checks),
        "findings": findings
    }
    # Cache results so GET /scan-results can retrieve them
    SCAN_RESULTS_CACHE[projectId] = response
    return response

# In-memory cache for scan results (populated by POST /scan)
SCAN_RESULTS_CACHE = {}

@router.get("/{projectId}/scan-results")
async def get_security_scan(projectId: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == projectId, Project.ownerId == current_user.id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    # First try in-memory cache (populated by POST /scan)
    if projectId in SCAN_RESULTS_CACHE:
        return SCAN_RESULTS_CACHE[projectId]

    # Fall back to DB: query ReviewFinding records for this project's latest version
    ver_result = await db.execute(
        select(ArchitectureVersion)
        .filter(ArchitectureVersion.projectId == projectId)
        .order_by(ArchitectureVersion.versionNumber.desc())
    )
    latest_version = ver_result.scalars().first()
    if not latest_version:
        return {"message": "No scan results available. Run POST /scan first."}

    findings_result = await db.execute(
        select(ReviewFinding).filter(ReviewFinding.reviewId == latest_version.id)
    )
    findings = findings_result.scalars().all()
    return {
        "project_id": projectId,
        "scan_status": "complete" if findings else "not_run",
        "failed": len(findings),
        "findings": [
            {
                "check_id": f.ruleId,
                "resource": "",
                "title": f.description,
                "severity": f.severity,
                "status": "FAILED"
            } for f in findings
        ]
    }

@router.get("/{projectId}/cost")
async def get_architecture_cost(projectId: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == projectId, Project.ownerId == current_user.id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    ver_result = await db.execute(
        select(ArchitectureVersion)
        .filter(ArchitectureVersion.projectId == projectId)
        .order_by(ArchitectureVersion.versionNumber.desc())
    )
    latest_version = ver_result.scalars().first()
    if not latest_version or not latest_version.architectureData:
        return {"error": "No architecture generated yet"}

    components = latest_version.architectureData.get("components", [])
    cost_data = estimate_architecture_costs(components)
    
    # Save to architectureData
    arch_data = dict(latest_version.architectureData)
    arch_data["cost_breakdown"] = cost_data
    latest_version.architectureData = arch_data
    await db.commit()

    return cost_data
