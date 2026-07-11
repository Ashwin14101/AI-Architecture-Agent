from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import StreamingResponse
import asyncio

from app.database import get_db
from app.models import User
from app.schemas import ChatMessageCreate
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])

async def mock_stream_response():
    messages = [
        "Thinking about your request...\n\n",
        "I'll need to analyze the architecture.\n\n",
        "Here are my initial findings:\n\n",
        "1. The database layer is well structured.\n\n",
        "2. You might want to add a caching layer.\n\n"
    ]
    for msg in messages:
        await asyncio.sleep(0.2)
        yield f"data: {msg}\n\n"

@router.post("/{projectId}/messages")
async def send_message(projectId: str, message: ChatMessageCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return StreamingResponse(mock_stream_response(), media_type="text/event-stream")
