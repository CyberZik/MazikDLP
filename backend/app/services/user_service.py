"""
MazikDLP - User Service
CRUD operations for user management within an organization.
"""

import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole, UserStatus
from app.utils.exceptions import ConflictError, NotFoundError
from app.utils.security import hash_password


async def create_user(
    db: AsyncSession,
    org_id: uuid.UUID,
    email: str,
    name: str,
    password: str,
    role: UserRole = UserRole.EMPLOYEE,
    department: Optional[str] = None,
    team: Optional[str] = None,
) -> User:
    """Create a new user inside an existing organization."""
    existing = await db.scalar(select(User).where(User.email == email))
    if existing:
        raise ConflictError(f"Email '{email}' is already registered")

    user = User(
        org_id=org_id,
        email=email,
        name=name,
        password_hash=hash_password(password),
        role=role.value,
        department=department,
        team=team,
        status=UserStatus.ACTIVE.value,
    )
    db.add(user)
    await db.flush()
    return user


async def list_users(
    db: AsyncSession,
    org_id: uuid.UUID,
    page: int = 1,
    per_page: int = 20,
    status: Optional[str] = None,
    role: Optional[str] = None,
    search: Optional[str] = None,
) -> tuple[list[User], int]:
    """Return paginated list of users for an organization."""
    query = select(User).where(User.org_id == org_id)

    if status:
        query = query.where(User.status == status)
    if role:
        query = query.where(User.role == role)
    if search:
        query = query.where(
            User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )

    # Total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Paginated results
    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    users = list(result.scalars().all())

    return users, total


async def get_user(db: AsyncSession, user_id: uuid.UUID, org_id: uuid.UUID) -> User:
    """Get a user by ID, scoped to an org."""
    user = await db.scalar(
        select(User).where(User.id == user_id, User.org_id == org_id)
    )
    if not user:
        raise NotFoundError(resource="User", resource_id=str(user_id))
    return user


async def update_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    org_id: uuid.UUID,
    name: Optional[str] = None,
    department: Optional[str] = None,
    team: Optional[str] = None,
    status: Optional[str] = None,
) -> User:
    user = await get_user(db, user_id, org_id)
    if name is not None:
        user.name = name
    if department is not None:
        user.department = department
    if team is not None:
        user.team = team
    if status is not None:
        user.status = status
    return user


async def delete_user(db: AsyncSession, user_id: uuid.UUID, org_id: uuid.UUID) -> None:
    user = await get_user(db, user_id, org_id)
    await db.delete(user)


async def change_user_role(
    db: AsyncSession,
    user_id: uuid.UUID,
    org_id: uuid.UUID,
    new_role: UserRole,
) -> User:
    user = await get_user(db, user_id, org_id)
    user.role = new_role.value
    return user
