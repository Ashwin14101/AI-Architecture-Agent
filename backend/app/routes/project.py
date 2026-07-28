import os
import shutil
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, File, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import Project, Deployment, User, Document, ArchitectureVersion, Review, ReviewFinding, Requirement
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectsListResponse, DeploymentCreate, FindingUpdate
from app.middleware.auth_middleware import get_current_user
from app.middleware.rbac_middleware import require_role
from app.websocket import manager
from app.config import settings

router = APIRouter(prefix="/projects", tags=["projects"])


os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

async def extract_text_from_file(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception as e:
        return f"Error reading document text: {str(e)}"


@router.get("", response_model=ProjectsListResponse)
async def get_projects(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.ownerId == current_user.id))
    projects = result.scalars().all()
    count = len(projects)
    return {"count": count, "projects": projects}

@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(project: ProjectCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    new_project = Project(
        name=project.name,
        description=project.description,
        ownerId=current_user.id
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project

@router.get("/{id}", response_model=ProjectResponse)
async def get_project(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == id, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{id}", response_model=ProjectResponse)
async def update_project(id: str, project_update: ProjectUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == id, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project_update.description is not None:
        project.description = project_update.description
    
    await db.commit()
    await db.refresh(project)
    return project

@router.delete("/{id}", status_code=204)
async def delete_project(id: str, current_user: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == id, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.delete(project)
    await db.commit()
    return None

# --- DOCUMENT UPLOAD ---

@router.post("/{id}/documents", status_code=201)
async def upload_document(id: str, file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Verify project ownership
    result = await db.execute(select(Project).filter(Project.id == id, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # Save uploaded file
    file_path = os.path.join(settings.UPLOAD_DIR, f"{id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    # Get file stats
    file_size = os.path.getsize(file_path)
    extracted_text = await extract_text_from_file(file_path)
    # Save to database
    new_doc = Document(
        projectId=id,
        name=file.filename,
        filePath=file_path,
        fileSize=file_size,
        extractedText=extracted_text
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    return {
        "id": new_doc.id,
        "name": new_doc.name,
        "fileSize": new_doc.fileSize,
        "message": "Document uploaded and parsed successfully!"
    }

@router.get("/{id}/documents")
async def get_project_documents(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Verify project ownership
    result = await db.execute(select(Project).filter(Project.id == id, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    docs_result = await db.execute(select(Document).filter(Document.projectId == id).order_by(Document.createdAt.desc()))
    docs = docs_result.scalars().all()
    
    return [{
        "id": d.id,
        "name": d.name,
        "fileSize": d.fileSize,
        "createdAt": d.createdAt
    } for d in docs]



# --- RETRIEVE AGENT OUTPUTS ---
@router.get("/{id}/architecture")
async def get_logical_architecture(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ArchitectureVersion)
        .filter(ArchitectureVersion.projectId == id)
        .order_by(ArchitectureVersion.versionNumber.desc())
    )
    latest_version = result.scalars().first()
    if not latest_version or not latest_version.architectureData:
        raise HTTPException(status_code=404, detail="No architecture design generated yet.")
    
    return latest_version.architectureData.get("components", [])
@router.get("/{id}/architecture/database")
async def get_database_schema(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Pull latest version and extract database schemas
    result = await db.execute(
        select(ArchitectureVersion)
        .filter(ArchitectureVersion.projectId == id)
        .order_by(ArchitectureVersion.versionNumber.desc())
    )
    latest_version = result.scalars().first()
    if not latest_version or not latest_version.architectureData:
        raise HTTPException(status_code=404, detail="No database schema generated yet.")
    
    # Return database tables from generated components structure
    return latest_version.architectureData.get("database_schema", [])
@router.get("/{id}/architecture/apis")
async def get_api_specifications(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ArchitectureVersion)
        .filter(ArchitectureVersion.projectId == id)
        .order_by(ArchitectureVersion.versionNumber.desc())
    )
    latest_version = result.scalars().first()
    if not latest_version or not latest_version.architectureData:
        raise HTTPException(status_code=404, detail="No API specifications generated yet.")
    
    return latest_version.architectureData.get("apis", [])
@router.get("/{id}/cloud-mapping")
async def get_cloud_mappings(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ArchitectureVersion)
        .filter(ArchitectureVersion.projectId == id)
        .order_by(ArchitectureVersion.versionNumber.desc())
    )
    latest_version = result.scalars().first()
    if not latest_version or not latest_version.architectureData:
        raise HTTPException(status_code=404, detail="No cloud service mapping generated yet.")
    
    return {
        "mappings": latest_version.architectureData.get("cloud_mappings", []),
        "costs": latest_version.architectureData.get("costs", {})
    }
@router.get("/{id}/terraform")
async def get_terraform_code(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ArchitectureVersion)
        .filter(ArchitectureVersion.projectId == id)
        .order_by(ArchitectureVersion.versionNumber.desc())
    )
    latest_version = result.scalars().first()
    if not latest_version or not latest_version.terraformCode:
        raise HTTPException(status_code=404, detail="No Terraform code compiled yet.")
    
    return {
        "version": latest_version.versionNumber,
        "terraformCode": latest_version.terraformCode
    }
@router.get("/{id}/reviews")
async def get_reviews_findings(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Fetch latest review scoring
    review_res = await db.execute(
        select(Review)
        .filter(Review.projectId == id)
        .order_by(Review.createdAt.desc())
    )
    latest_review = review_res.scalars().first()
    if not latest_review:
        raise HTTPException(status_code=404, detail="No architecture audit grading performed yet.")
    # Fetch individual findings associated with this review
    findings_res = await db.execute(
        select(ReviewFinding)
        .filter(ReviewFinding.reviewId == latest_review.id)
    )
    findings = findings_res.scalars().all()
    return {
        "score": latest_review.score,
        "status": latest_review.status,
        "findings": findings
    }
@router.get("/{id}/versions")
async def get_all_versions(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ArchitectureVersion)
        .filter(ArchitectureVersion.projectId == id)
        .order_by(ArchitectureVersion.versionNumber.desc())
    )
    versions = result.scalars().all()
    return [{
        "id": v.id,
        "versionNumber": v.versionNumber,
        "createdAt": v.createdAt
    } for v in versions]

@router.get("/{id}/messages")
async def get_project_messages(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models import Message, Conversation
    # Verify project ownership
    result = await db.execute(select(Project).filter(Project.id == id, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Get the primary conversation for the project, or return empty if none
    conv_result = await db.execute(select(Conversation).filter(Conversation.projectId == id).order_by(Conversation.createdAt.asc()))
    conversation = conv_result.scalars().first()
    
    if not conversation:
        return []
        
    # Get messages for the conversation
    msg_result = await db.execute(select(Message).filter(Message.conversationId == conversation.id).order_by(Message.createdAt.asc()))
    messages = msg_result.scalars().all()
    
    return [{
        "sender": m.sender,
        "content": m.content,
        "createdAt": m.createdAt
    } for m in messages]

# --- LIVE SPECIFICATION EDITING & RETRIEVAL ---

class DocumentationUpdate(BaseModel):
    markdown: str

class ArchitectureUpdatePayload(BaseModel):
    architectureData: Dict[str, Any]
    terraformCode: Optional[str] = None

@router.get("/{id}/documentation")
async def get_project_documentation(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == id, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    docs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../docs/architecture_docs.md"))
    if not os.path.exists(docs_path):
        return {"markdown": "# Executive Architecture Specifications\n\nNo documentation compiled yet. Start the pipeline to generate it!"}
    
    try:
        with open(docs_path, "r", encoding="utf-8") as f:
            return {"markdown": f.read()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read documentation: {str(e)}")

@router.post("/{id}/documentation")
async def update_project_documentation(id: str, payload: DocumentationUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == id, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    docs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../docs/architecture_docs.md"))
    os.makedirs(os.path.dirname(docs_path), exist_ok=True)
    
    try:
        with open(docs_path, "w", encoding="utf-8") as f:
            f.write(payload.markdown)
        return {"status": "success", "message": "Documentation saved successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write documentation: {str(e)}")

@router.put("/{id}/architecture")
async def update_project_architecture(id: str, payload: ArchitectureUpdatePayload, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == id, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Fetch latest version
    ver_result = await db.execute(
        select(ArchitectureVersion)
        .filter(ArchitectureVersion.projectId == id)
        .order_by(ArchitectureVersion.versionNumber.desc())
    )
    latest_ver = ver_result.scalars().first()
    if not latest_ver:
        raise HTTPException(status_code=404, detail="No architecture versions found")
    
    latest_ver.architectureData = payload.architectureData
    if payload.terraformCode is not None:
        latest_ver.terraformCode = payload.terraformCode
        
    await db.commit()
    return {"status": "success", "message": "Architecture updated successfully!"}


# --- DEPLOYMENT / WEBSOCKET ---
@router.post("/{id}/deploy")
async def deploy_project(id: str, deployment_data: DeploymentCreate, current_user: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == id, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    new_deployment = Deployment(
        projectId=id,
        environment=deployment_data.environment,
        status="pending"
    )
    db.add(new_deployment)
    await db.commit()
    await db.refresh(new_deployment)
    
    # Broadcast deployment trigger
    asyncio.create_task(mock_deployment_task(id, new_deployment.id))
    
    return {"status": "success", "deploymentId": new_deployment.id}
async def mock_deployment_task(project_id: str, deployment_id: str):
    await asyncio.sleep(1)
    await manager.broadcast(project_id, {
        "type": "deployment_update",
        "data": {"deploymentId": deployment_id, "status": "in_progress", "log": "Provisioning resources..."}
    })
    await asyncio.sleep(2)
    await manager.broadcast(project_id, {
        "type": "deployment_update",
        "data": {"deploymentId": deployment_id, "status": "completed", "log": "Deployment successful."}
    })
@router.put("/{id}/findings/{findingId}")
async def update_finding(id: str, findingId: str, finding_update: FindingUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return {
        "id": findingId,
        "reviewId": "mock_review_id",
        "ruleId": "SEC-001",
        "severity": "high",
        "description": "Mock finding",
        "status": finding_update.status,
        "recommendation": "Mock recommendation",
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
    }
@router.websocket("/{id}/ws")
async def websocket_endpoint(websocket: WebSocket, id: str):
    await manager.connect(websocket, id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, id)

@router.get("/{id}/compare")
async def compare_versions(id: str, v1: int, v2: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == id, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    v1_result = await db.execute(select(ArchitectureVersion).filter(ArchitectureVersion.projectId == id, ArchitectureVersion.versionNumber == v1))
    v1_version = v1_result.scalars().first()
    if not v1_version:
        raise HTTPException(status_code=404, detail=f"Version {v1} not found")
        
    v2_result = await db.execute(select(ArchitectureVersion).filter(ArchitectureVersion.projectId == id, ArchitectureVersion.versionNumber == v2))
    v2_version = v2_result.scalars().first()
    if not v2_version:
        raise HTTPException(status_code=404, detail=f"Version {v2} not found")
        
    v1_data = v1_version.architectureData or {}
    v2_data = v2_version.architectureData or {}
    
    v1_components = v1_data.get("components", [])
    v2_components = v2_data.get("components", [])
    
    v1_comp_ids = {c.get("id") or c.get("name"): c for c in v1_components}
    v2_comp_ids = {c.get("id") or c.get("name"): c for c in v2_components}
    
    added_components = [c for k, c in v2_comp_ids.items() if k not in v1_comp_ids]
    removed_components = [c for k, c in v1_comp_ids.items() if k not in v2_comp_ids]
    
    v1_apis = v1_data.get("apis", [])
    v2_apis = v2_data.get("apis", [])
    
    v1_api_paths = {a.get("path"): a for a in v1_apis}
    v2_api_paths = {a.get("path"): a for a in v2_apis}
    
    added_apis = [a for k, a in v2_api_paths.items() if k not in v1_api_paths]
    removed_apis = [a for k, a in v1_api_paths.items() if k not in v2_api_paths]
    
    v1_tables = v1_data.get("database_schema", [])
    v2_tables = v2_data.get("database_schema", [])
    
    v1_table_names = {t.get("name"): t for t in v1_tables}
    v2_table_names = {t.get("name"): t for t in v2_tables}
    
    added_tables = [t for k, t in v2_table_names.items() if k not in v1_table_names]
    removed_tables = [t for k, t in v1_table_names.items() if k not in v2_table_names]
    
    return {
        "v1": v1,
        "v2": v2,
        "added_components": added_components,
        "removed_components": removed_components,
        "added_apis": added_apis,
        "removed_apis": removed_apis,
        "added_tables": added_tables,
        "removed_tables": removed_tables,
        "summary": f"Added {len(added_components)} components, removed {len(removed_apis)} API, added {len(added_tables)} tables"
    }
