from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
import asyncio
from app.models import User
from app.middleware.auth_middleware import get_current_user
from app.websocket import manager

router = APIRouter(prefix="/analysis", tags=["analysis"])

async def mock_analysis_task(project_id: str):
    await asyncio.sleep(1)
    await manager.broadcast(project_id, {
        "type": "analysis_update",
        "data": {"status": "in_progress", "progress": 50, "message": "Analyzing architecture..."}
    })
    await asyncio.sleep(2)
    await manager.broadcast(project_id, {
        "type": "analysis_update",
        "data": {"status": "completed", "progress": 100, "message": "Analysis complete."}
    })

@router.post("/{projectId}/start")
async def start_analysis(projectId: str, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    background_tasks.add_task(mock_analysis_task, projectId)
    return {"status": "success", "message": "Analysis started"}
