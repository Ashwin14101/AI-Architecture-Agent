from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import bcrypt
from jose import jwt
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.models import User
from app.schemas import UserCreate, LoginRequest, RegisterResponse, TokenResponse, AuthMeResponse
from app.config import settings
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")

@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter((User.email == user_data.email) | (User.username == user_data.username)))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = hash_password(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        passwordHash=hashed_password
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"user": new_user}

@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == login_data.email))
    user = result.scalars().first()
    if not user or not verify_password(login_data.password, user.passwordHash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"id": user.id, "role": user.role})
    return {"accessToken": access_token}

@router.get("/me", response_model=AuthMeResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return {"user": current_user}
