"""Add tags column to custom_patterns.

Revision ID: 003_add_tags
Revises: 002_add_category
Create Date: 2026-04-05
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "003_add_tags"
down_revision = "002_add_category"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "custom_patterns",
        sa.Column("tags", JSONB, nullable=True, server_default="'[]'::jsonb"),
    )


def downgrade() -> None:
    op.drop_column("custom_patterns", "tags")
