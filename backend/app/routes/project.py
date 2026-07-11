import asyncio
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import Project, Deployment, User
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectsListResponse, DeploymentCreate, FindingUpdate
from app.middleware.auth_middleware import get_current_user
from app.websocket import manager

router = APIRouter(prefix="/projects", tags=["projects"])

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
async def delete_project(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).filter(Project.id == id, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.delete(project)
    await db.commit()
    return None

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

@router.post("/{id}/deploy")
async def deploy_project(id: str, deployment_data: DeploymentCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
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
    
    asyncio.create_task(mock_deployment_task(id, new_deployment.id))
    
    return {"status": "success", "deploymentId": new_deployment.id}

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
            # For this mock, we don't necessarily need to process inbound ws messages,
            # but we keep the connection open.
    except WebSocketDisconnect:
        manager.disconnect(websocket, id)
