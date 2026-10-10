"""
MazikDLP - Auth Service
Business logic for registration, login, token refresh, and logout.
"""

import uuid
from datetime import datetime, timezone

from jose import JWTError
from jose.exceptions import ExpiredSignatureError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Organization, User, UserRole, UserStatus
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
)
from app.utils.exceptions import AuthenticationError, ConflictError, NotFoundError
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.config import get_settings

settings = get_settings()


def _build_token_response(user: User) -> TokenResponse:
    access = create_access_token(
        user_id=str(user.id),
        org_id=str(user.org_id),
        role=user.role,
    )
    refresh = create_refresh_token(user_id=str(user.id))
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


async def register_user(db: AsyncSession, data: RegisterRequest) -> RegisterResponse:
    """Create a new organization and admin user."""
    # Check email uniqueness
    existing = await db.scalar(select(User).where(User.email == data.email))
    if existing:
        raise ConflictError(f"Email '{data.email}' is already registered")

    # Create org
    org = Organization(
        name=data.org_name,
        domain=data.org_domain,
        admin_email=data.email,
    )
    db.add(org)
    await db.flush()  # get org.id without committing

    # Create admin user
    user = User(
        org_id=org.id,
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name,
        role=UserRole.ADMIN.value,
        status=UserStatus.ACTIVE.value,
    )
    db.add(user)
    await db.flush()

    tokens = _build_token_response(user)

    return RegisterResponse(
        user_id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role,
        org_id=str(org.id),
        org_name=org.name,
        tokens=tokens,
    )


async def login_user(db: AsyncSession, data: LoginRequest) -> TokenResponse:
    """Authenticate user and return JWT tokens."""
    user = await db.scalar(select(User).where(User.email == data.email))
    if not user or not verify_password(data.password, user.password_hash):
        raise AuthenticationError("Invalid email or password")

    if not user.is_active:
        raise AuthenticationError("Account is not active")

    # Update last_active
    user.last_active = datetime.now(timezone.utc)

    return _build_token_response(user)


async def refresh_tokens(db: AsyncSession, data: RefreshRequest) -> TokenResponse:
    """Validate refresh token and issue new token pair."""
    try:
        payload = decode_token(data.refresh_token)
    except JWTError:
        raise AuthenticationError("Invalid or expired refresh token")

    if payload.get("type") != "refresh":
        raise AuthenticationError("Invalid token type")

    user_id = payload.get("sub")
    user = await db.get(User, uuid.UUID(user_id))
    if not user or not user.is_active:
        raise AuthenticationError("User not found or inactive")

    # Check if jti has been revoked
    jti = payload.get("jti")
    revoked = user.revoked_tokens or []
    if jti in revoked:
        raise AuthenticationError("Token has been revoked")

    return _build_token_response(user)


async def logout_user(db: AsyncSession, refresh_token: str) -> None:
    """Blacklist the refresh token's jti."""
    try:
        payload = decode_token(refresh_token)
    except JWTError:
        return  # already expired — treat as logged out

    jti = payload.get("jti")
    user_id = payload.get("sub")
    if not jti or not user_id:
        return

    user = await db.get(User, uuid.UUID(user_id))
    if user:
        revoked = list(user.revoked_tokens or [])
        if jti not in revoked:
            revoked.append(jti)
        # Keep only the most recent 100 entries. Refresh tokens have a fixed
        # TTL so older JTIs are expired and checking them is pointless.
        user.revoked_tokens = revoked[-100:]


async def get_current_user_from_token(token: str, db: AsyncSession) -> User:
    """Decode access token and return the authenticated user."""
    try:
        payload = decode_token(token)
    except ExpiredSignatureError:
        raise AuthenticationError("Access token has expired")
    except JWTError:
        raise AuthenticationError("Invalid access token")

    if payload.get("type") != "access":
        raise AuthenticationError("Invalid token type")

    user_id = payload.get("sub")
    user = await db.get(User, uuid.UUID(user_id))
    if not user or not user.is_active:
        raise AuthenticationError("User not found or inactive")

    return user
