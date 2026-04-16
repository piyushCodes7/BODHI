"""add paper_balance

Revision ID: 2a6b9259aa67
Revises: 61f680e761ab
Create Date: 2026-04-16 23:14:35.263905

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a6b9259aa67'
down_revision: Union[str, Sequence[str], None] = '61f680e761ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Only add the new column, do NOT drop anything else!
    op.add_column('users', sa.Column('paper_balance', sa.Float(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Only remove the column if we rollback
    op.drop_column('users', 'paper_balance')