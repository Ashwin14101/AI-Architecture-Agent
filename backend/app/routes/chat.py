from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import StreamingResponse
from sqlalchemy import select
import asyncio, os, json
from openai import AsyncOpenAI

from app.database import get_db
from app.models import User, Project, ArchitectureVersion, Document
from app.schemas import ChatMessageCreate
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])

# ── LLM Client (Groq first, Gemini fallback) ──────────────────────────────
def _make_client(provider: str):
    if provider == "groq":
        return AsyncOpenAI(
            api_key=os.getenv("GROQ_API_KEYS", "").split(",")[0].strip(),
            base_url=os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
        ), os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    else:
        return AsyncOpenAI(
            api_key=os.getenv("GEMINI_API_KEYS", "").split(",")[0].strip(),
            base_url=os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai"),
        ), os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Load .env from agents directory
_env_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "agents", ".env")
if os.path.exists(_env_path):
    from dotenv import load_dotenv
    load_dotenv(_env_path, override=True)

SYSTEM_PROMPT = """You are a helpful, conversational AI assistant (like ChatGPT) with access to the user's software architecture design project context when needed.

Follow these strict rules:
1. ACT LIKE A GENERAL CHATGPT: You can answer any general question, write general code, explain concepts, or chat casually. You do not have to talk about architecture if the user's question is general (e.g. if they say "what is hello" or "write a python script to merge two lists").
2. CONTEXT-AWARE: If the user asks about their active project, system components, database tables, APIs, cloud services, or documentation, use the provided Project Context to answer their questions accurately and helper them design/improve it.
3. NO CANTED LIST DUMPS: Do not print or list the entire system components, APIs, or database tables unless the user explicitly asks for them.
4. TONE & EMOTIONS: Absolutely ignore any user anger, frustration, swearing, or hostile tone. Never try to manage their emotions, never say "It seems like you might be experiencing some frustration", "Let's take a step back", "I'm sorry you feel that way", or any other robotic or patronizing statements. Just answer their question directly, neutrally, and helpfully.
"""

async def stream_ai_response(user_message: str, context: str = ""):
    """Stream a real AI response using Groq or Gemini."""
    provider = os.getenv("LLM_PROVIDER", "groq")
    client, model = _make_client(provider)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if context:
        messages.append({"role": "system", "content": f"Project context:\n{context}"})
    messages.append({"role": "user", "content": user_message})

    try:
        stream = await client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            max_tokens=1024,
            temperature=0.7,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                # Encode newlines so SSE line-splitting doesn't break them
                safe = delta.replace('\n', '\\n')
                yield f"data: {safe}\n\n"
    except Exception as e:
        # Fallback to Gemini if Groq fails
        if provider == "groq":
            try:
                client2, model2 = _make_client("gemini")
                stream2 = await client2.chat.completions.create(
                    model=model2,
                    messages=messages,
                    stream=True,
                    max_tokens=1024,
                    temperature=0.7,
                )
                async for chunk in stream2:
                    delta = chunk.choices[0].delta.content if chunk.choices else None
                    if delta:
                        safe = delta.replace('\n', '\\n')
                        yield f"data: {safe}\n\n"
            except Exception as e2:
                yield f"data: ⚠️ AI unavailable: {str(e2)}\n\n"
        else:
            yield f"data: ⚠️ AI unavailable: {str(e)}\n\n"


@router.post("/{projectId}/messages")
async def send_message(
    projectId: str,
    message: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Build context from the project's latest architecture version
    context_parts = []
    try:
        ver_result = await db.execute(
            select(ArchitectureVersion)
            .where(ArchitectureVersion.projectId == projectId)
            .order_by(ArchitectureVersion.versionNumber.desc())
        )
        ver = ver_result.scalars().first()
        if ver and ver.architectureData:
            data = ver.architectureData if isinstance(ver.architectureData, dict) else json.loads(ver.architectureData)
            comps = data.get("components", [])
            if comps:
                comp_names = ", ".join(c.get("name", "") for c in comps[:8])
                context_parts.append(f"System components: {comp_names}")
            apis = data.get("apis", [])
            if apis:
                api_list = ", ".join((a.get("method", "") + " " + a.get("path", "")) for a in apis[:6])
                context_parts.append(f"APIs: {api_list}")
            schema = data.get("database_schema", [])
            if schema:
                table_names = ", ".join(t.get("name", "") for t in schema[:6])
                context_parts.append(f"DB tables: {table_names}")
            doc = data.get("documentation", "")
            if doc:
                context_parts.append(f"Documentation: {str(doc)[:400]}")
        
        # Query latest uploaded document text for this project
        doc_result = await db.execute(
            select(Document)
            .where(Document.projectId == projectId)
            .order_by(Document.createdAt.desc())
        )
        latest_doc = doc_result.scalars().first()
        if latest_doc and latest_doc.extractedText:
            context_parts.append(f"Uploaded Document ({latest_doc.name}) Content:\n{latest_doc.extractedText[:2500]}")
    except Exception:
        pass  # Context is optional


    context = "\n".join(context_parts)

    return StreamingResponse(
        stream_ai_response(message.content, context),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
