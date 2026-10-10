"""
MazikDLP - FastAPI Dependencies
Reusable dependencies for auth, RBAC, and pagination.
"""

from typing import Annotated

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.services.auth_service import get_current_user_from_token
from app.utils.exceptions import AuthenticationError, AuthorizationError

security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the JWT Bearer token, return the authenticated user."""
    return await get_current_user_from_token(credentials.credentials, db)


def require_roles(*roles: UserRole):
    """
    FastAPI dependency factory for role-based access control.

    Usage:
        @router.get("/admin-only")
        async def admin_route(user = Depends(require_roles(UserRole.ADMIN))):
            ...
    """
    async def _check_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in [r.value for r in roles]:
            raise AuthorizationError(
                f"Required role(s): {[r.value for r in roles]}. "
                f"Your role: {current_user.role}"
            )
        return current_user
    return _check_role
