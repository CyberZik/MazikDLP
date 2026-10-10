"""
MazikDLP - AI App Registry Model
"""

import uuid
from sqlalchemy import Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel


class AIApp(BaseModel):
    __tablename__ = "ai_apps"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    vendor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # whitelisted | blocked | restricted
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="whitelisted")

    # low | medium | high | critical
    risk_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    security_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # List of model names supported
    models: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    # Compliance certifications: ["SOC2", "GDPR", "HIPAA"]
    compliance: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    def __repr__(self) -> str:
        return f"<AIApp id={self.id} name={self.name} status={self.status}>"
