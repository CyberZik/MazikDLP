"""
MazikDLP - Policy Model
Represents DLP policies that govern what happens when sensitive data is detected.
"""

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Policy(BaseModel):
    """
    DLP policy defining what action to take when specific data types are detected.
    """
    __tablename__ = "policies"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Protection level: low, medium, high, critical
    protection_level: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")

    # Action: allow, alert, soft_block, hard_block, mask
    action: Mapped[str] = mapped_column(String(20), nullable=False, default="mask")

    # Which entity types this policy applies to
    # e.g. ["EMAIL_ADDRESS", "IN_PAN", "CUSTOM_SECRET"]
    data_types: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    # Target user groups (org roles): [] means all users
    user_groups: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    # Target AI platforms: [] means all platforms
    ai_platforms: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    # Target AI models: [] means all models
    ai_models: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    # Priority (lower = higher priority)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=100)

    # Status: active, inactive, draft
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    def __repr__(self) -> str:
        return f"<Policy id={self.id} name={self.name} action={self.action}>"

    @property
    def is_active(self) -> bool:
        return self.status == "active"
