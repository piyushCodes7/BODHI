"""add_holdings_and_polls

Revision ID: 22347217ae63
Revises: 69d84d55279e
Create Date: 2026-04-23 17:04:25.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '22347217ae63'
down_revision: Union[str, Sequence[str], None] = '69d84d55279e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # investment_holdings
    op.create_table('investment_holdings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('symbol', sa.String(length=20), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('average_price', sa.Float(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['investment_groups.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_investment_holdings_symbol'), 'investment_holdings', ['symbol'], unique=False)

    # investment_polls
    op.create_table('investment_polls',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.String(length=36), nullable=False),
        sa.Column('type', sa.String(length=10), nullable=False),
        sa.Column('symbol', sa.String(length=20), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('votes_for', sa.Integer(), nullable=False),
        sa.Column('votes_against', sa.Integer(), nullable=False),
        sa.Column('votes_needed', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['group_id'], ['investment_groups.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # poll_votes
    op.create_table('poll_votes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('poll_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('decision', sa.Boolean(), nullable=False),
        sa.Column('voted_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['poll_id'], ['investment_polls.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('poll_id', 'user_id', name='uq_poll_vote')
    )

def downgrade() -> None:
    op.drop_table('poll_votes')
    op.drop_table('investment_polls')
    op.drop_index(op.f('ix_investment_holdings_symbol'), table_name='investment_holdings')
    op.drop_table('investment_holdings')
