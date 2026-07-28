import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, project, analysis, cloud, chat, observability
from app.database import engine, Base

app = FastAPI(title="AI Architecture Agent API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(project.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(cloud.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(observability.router, prefix="/api")

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
