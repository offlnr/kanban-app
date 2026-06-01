"""add due_date to tasks

Revision ID: a9f3b2e1d4c5
Revises: 0bb06ef10312
Create Date: 2026-05-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a9f3b2e1d4c5'
down_revision: Union[str, Sequence[str], None] = '0bb06ef10312'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('due_date', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('tasks', 'due_date')
