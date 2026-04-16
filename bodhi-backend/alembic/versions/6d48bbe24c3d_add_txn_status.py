"""add txn status

Revision ID: 6d48bbe24c3d
Revises: 2a6b9259aa67
Create Date: 2026-04-16 23:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6d48bbe24c3d'
down_revision: Union[str, Sequence[str], None] = '2a6b9259aa67'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 🔥 ONLY add the new status column. Do NOT drop any tables!
    op.add_column('transactions', sa.Column('status', sa.String(), server_default='EXECUTED', nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Only remove the column if we rollback
    op.drop_column('transactions', 'status')