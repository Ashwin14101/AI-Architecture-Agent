from fastapi import Depends, HTTPException, status
from app.models import User
from app.middleware.auth_middleware import get_current_user

def require_role(*allowed_roles: str):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied. You do not have the required role to access this resource."
            )
        return current_user
    return role_checker
