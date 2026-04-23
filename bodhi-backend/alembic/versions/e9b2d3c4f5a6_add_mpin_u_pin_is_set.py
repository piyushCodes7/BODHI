"""add_mpin_u_pin_is_set

Revision ID: e9b2d3c4f5a6
Revises: 8630fee17dbd
Create Date: 2026-04-23 16:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e9b2d3c4f5a6'
down_revision: Union[str, Sequence[str], None] = '8630fee17dbd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Only add is_mpin_set as others exist
    op.add_column('users', sa.Column('is_mpin_set', sa.Boolean(), nullable=False, server_default=sa.text('false')))

def downgrade() -> None:
    op.drop_column('users', 'is_mpin_set')
