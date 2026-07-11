from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.models import User
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/cloud", tags=["cloud"])

@router.get("/catalog")
async def get_catalog(provider: str = "aws", category: str = "database", current_user: User = Depends(get_current_user)):
    services = [
        {"id": f"{provider}-{category}-1", "name": f"{provider.upper()} Managed {category.capitalize()}"},
        {"id": f"{provider}-{category}-2", "name": f"{provider.upper()} Serverless {category.capitalize()}"}
    ]
    return {"services": services}
