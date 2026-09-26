from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import Project, AgentExecution, User
from app.middleware.auth_middleware import get_current_user
import json

router = APIRouter(prefix="/projects", tags=["observability"])

@router.get("/{id}/traces")
async def get_project_traces(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Verify project ownership
    result = await db.execute(select(Project).filter(Project.id == id, Project.ownerId == current_user.id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch agent executions ordered by creation time
    exec_result = await db.execute(
        select(AgentExecution)
        .filter(AgentExecution.projectId == id)
        .order_by(AgentExecution.createdAt.desc())
    )
    executions = exec_result.scalars().all()

    formatted_traces = []
    for ex in executions:
        parsed_logs = ex.logs
        try:
            if ex.logs and (ex.logs.startswith("{") or ex.logs.startswith("[")):
                parsed_logs = json.loads(ex.logs)
        except Exception:
            pass

        formatted_traces.append({
            "id": ex.id,
            "agentName": ex.agentName,
            "status": ex.status,
            "logs": parsed_logs,
            "timestamp": ex.createdAt
        })

    return {
        "projectId": id,
        "totalExecutions": len(formatted_traces),
        "traces": formatted_traces
    }
