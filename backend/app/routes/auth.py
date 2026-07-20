from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.models import User
from app.schemas import (
    UserCreate,
    LoginRequest,
    RegisterResponse,
    TokenResponse,
    AuthMeResponse,
)
from app.config import settings
from app.middleware.auth_middleware import get_current_user


router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# --------------------------------------------------
# CREATE JWT ACCESS TOKEN
# --------------------------------------------------

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_EXPIRY_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm="HS256"
    )

    return encoded_jwt


# --------------------------------------------------
# REGISTER USER
# --------------------------------------------------

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=201
)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    # Check if email or username already exists
    result = await db.execute(
        select(User).filter(
            (User.email == user_data.email)
            | (User.username == user_data.username)
        )
    )

    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    # Hash password before storing it
    hashed_password = pwd_context.hash(
        user_data.password
    )

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        passwordHash=hashed_password
    )

    db.add(new_user)

    await db.commit()
    await db.refresh(new_user)

    return {
        "user": new_user
    }


# --------------------------------------------------
# LOGIN USER
# --------------------------------------------------

@router.post(
    "/login",
    response_model=TokenResponse
)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    # Find user using email
    result = await db.execute(
        select(User).filter(
            User.email == login_data.email
        )
    )

    user = result.scalars().first()

    # Verify email and password
    if not user or not pwd_context.verify(
        login_data.password,
        user.passwordHash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    # Generate JWT token
    access_token = create_access_token(
        data={
            "id": str(user.id),
            "role": user.role
        }
    )
    print("Generated Token:")
    print(access_token)
    return {
        "accessToken": access_token
    }


# --------------------------------------------------
# GET CURRENT LOGGED-IN USER
# --------------------------------------------------

@router.get(
    "/me",
    response_model=AuthMeResponse
)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "user": current_user
    }