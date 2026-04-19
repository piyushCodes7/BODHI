"""wipe_old_trip_tables

Revision ID: 8630fee17dbd
Revises: 4340eccca3ac
Create Date: 2026-04-18 20:50:13.505977

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8630fee17dbd'
down_revision: Union[str, Sequence[str], None] = '4340eccca3ac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Force drop the old string-based tables
    op.execute('DROP TABLE IF EXISTS trip_wallets CASCADE')
    op.execute('DROP TABLE IF EXISTS trip_expenses CASCADE')
    op.execute('DROP TABLE IF EXISTS trip_members CASCADE')


def downgrade() -> None:
    pass
