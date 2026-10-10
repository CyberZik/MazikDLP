"""
MazikDLP - Base SQLAlchemy Model
All ORM models inherit from this base class.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utcnow():
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


class BaseModel(Base):
    """
    Abstract base for all MazikDLP SQLAlchemy models.
    Provides: id (UUID PK), created_at, updated_at.
    """
    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def to_dict(self) -> dict:
        """Convert model to dictionary (excludes SQLAlchemy internals)."""
        return {
            col.name: getattr(self, col.name)
            for col in self.__table__.columns
        }
