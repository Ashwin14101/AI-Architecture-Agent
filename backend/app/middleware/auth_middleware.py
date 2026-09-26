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

    print("\n========== AUTH DEBUG ==========")
    print("JWT Secret Loaded:", bool(settings.JWT_SECRET))

    try:
        # Decode and verify the JWT token
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"]
        )

        print("Decoded JWT Payload:")
        print(payload)

        # Get user ID from JWT
        user_id = payload.get("id")

        print("User ID from Token:")
        print(user_id)

        if not user_id:
            print("ERROR: No user ID found inside JWT")

            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError as e:
        print("JWT ERROR:")
        print(str(e))
        print("================================\n")

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    # IMPORTANT:
    # User.id in models.py is String(36), so keep user_id as a string.
    user_id = str(user_id)

    print("User ID used for database query:")
    print(user_id)

    # Search database using STRING ID
    result = await db.execute(
        select(User).where(
            User.id == user_id
        )
    )

    user = result.scalars().first()

    if user is None:
        print("ERROR: User not found in database")
        print("Searched User ID:", user_id)

        # Debug: Show IDs currently stored in users table
        debug_result = await db.execute(
            select(User.id, User.email)
        )

        users = debug_result.all()

        print("Users currently in database:")
        for db_user_id, db_email in users:
            print(
                "ID:",
                db_user_id,
                "| Email:",
                db_email
            )

        print("================================\n")

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    print("Authentication Successful")
    print("Authenticated User ID:", user.id)
    print("Authenticated User Email:", user.email)
    print("================================\n")

    return user