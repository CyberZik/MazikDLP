"""
MazikDLP - Audit Log Model
Immutable record of every scan event.
"""

import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class AuditLog(BaseModel):
    """
    Audit log entry — created for every scan, block, mask, or allow event.
    Intentionally not updatable.
    """
    __tablename__ = "audit_logs"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # scan | block | mask | allow | alert
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # AI platform: chatgpt | claude | gemini | grok | perplexity | unknown
    platform: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)

    # AI model used
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # SHA-256 hash of the original prompt (not stored in plaintext)
    prompt_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # List of entity types detected: ["EMAIL_ADDRESS", "IN_PAN"]
    entities_detected: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    # Which policy triggered this action
    policy_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("policies.id", ondelete="SET NULL"),
        nullable=True,
    )
    policy_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Final decision
    decision: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Severity: info | low | medium | high | critical
    severity: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Response time in milliseconds
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Masking session ID (if masked)
    session_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Usage category (classified at scan time)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)

    # Client info
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} action={self.action} platform={self.platform}>"
