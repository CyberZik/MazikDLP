"""
MazikDLP - System Settings & API Key Models
"""

import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel


class SystemSettings(BaseModel):
    __tablename__ = "system_settings"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, unique=True, index=True
    )
    # JSON blob of all settings
    settings: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)


class APIKey(BaseModel):
    __tablename__ = "api_keys"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Hashed key (bcrypt) — never store plaintext
    key_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    # Prefix shown to users: "mk_live_abc123..."
    key_prefix: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
