"""Add category column to audit_logs.

Revision ID: 002_add_category
Revises: 001_initial_schema
Create Date: 2026-03-16
"""

from alembic import op
import sqlalchemy as sa

revision = "002_add_category"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "audit_logs",
        sa.Column("category", sa.String(50), nullable=True),
    )
    op.create_index("ix_audit_logs_category", "audit_logs", ["category"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_category", table_name="audit_logs")
    op.drop_column("audit_logs", "category")
