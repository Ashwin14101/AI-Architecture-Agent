from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    role: str
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    accessToken: str

class AuthMeResponse(BaseModel):
    user: UserResponse

class RegisterResponse(BaseModel):
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: str
    ownerId: str
    createdAt: datetime
    class Config:
        from_attributes = True

class ProjectsListResponse(BaseModel):
    count: int
    projects: List[ProjectResponse]

class DeploymentCreate(BaseModel):
    environment: str

class ChatMessageCreate(BaseModel):
    content: str

class FindingUpdate(BaseModel):
    status: str
