"""update_social_models_columns

Revision ID: 69d84d55279e
Revises: e9b2d3c4f5a6
Create Date: 2026-04-23 16:59:30.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '69d84d55279e'
down_revision: Union[str, Sequence[str], None] = 'e9b2d3c4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # InvestmentGroup
    op.add_column('investment_groups', sa.Column('total_invested', sa.Float(), nullable=False, server_default='0.0'))
    op.add_column('investment_groups', sa.Column('total_balance', sa.Float(), nullable=False, server_default='0.0'))
    
    # InvestmentMember
    op.add_column('investment_members', sa.Column('contributed_amount', sa.Float(), nullable=False, server_default='0.0'))
    
    # TripWallet
    op.add_column('trip_wallets', sa.Column('total_spent', sa.Float(), nullable=False, server_default='0.0'))

def downgrade() -> None:
    op.drop_column('trip_wallets', 'total_spent')
    op.drop_column('investment_members', 'contributed_amount')
    op.drop_column('investment_groups', 'total_balance')
    op.drop_column('investment_groups', 'total_invested')
