from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.config import settings
from app.database import get_db
from app.models import User


# HTTP Bearer authentication scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:

    # Get JWT token from Authorization header
    token = credentials.credentials

    try:
        # Decode and verify the JWT token
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"]
        )

        # Get user ID from JWT
        user_id = payload.get("id")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    # IMPORTANT:
    # User.id in models.py is String(36), so keep user_id as a string.
    user_id = str(user_id)

    # Search database using STRING ID
    result = await db.execute(
        select(User).where(
            User.id == user_id
        )
    )

    user = result.scalars().first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user
