"""
MazikDLP - Custom Pattern Model
User-defined regex/keyword patterns for detection.
"""

import uuid
from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel


class CustomPattern(BaseModel):
    __tablename__ = "custom_patterns"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)

    # regex | keyword | keyword_list
    pattern_type: Mapped[str] = mapped_column(String(20), nullable=False, default="regex")
    pattern: Mapped[str] = mapped_column(Text, nullable=False)
    flags: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # low | medium | high | critical
    sensitivity: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")

    # allow | alert | mask | hard_block
    action: Mapped[str] = mapped_column(String(20), nullable=False, default="mask")
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)

    examples_positive: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    examples_negative: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    false_positive_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_detections: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
