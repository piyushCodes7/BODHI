"""added_oauth_columns_to_user

Revision ID: d5432a743a14
Revises: 
Create Date: 2024-04-14 22:47:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd5432a743a14'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Safely create the ENUM type
    auth_provider_enum = postgresql.ENUM('local', 'google', 'apple', name='auth_provider_enum')
    auth_provider_enum.create(op.get_bind(), checkfirst=True)

    # 2. Add ONLY the new OAuth columns
    op.add_column('users', sa.Column('auth_provider', sa.Enum('local', 'google', 'apple', name='auth_provider_enum'), server_default='local', nullable=False))
    op.add_column('users', sa.Column('provider_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), server_default='false', nullable=False))

    # 3. Add Indexes and the Unique Constraint
    op.create_index(op.f('ix_users_auth_provider'), 'users', ['auth_provider'], unique=False)
    op.create_index(op.f('ix_users_provider_id'), 'users', ['provider_id'], unique=False)
    op.create_unique_constraint('uq_users_provider_provider_id', 'users', ['auth_provider', 'provider_id'])


def downgrade() -> None:
    op.drop_constraint('uq_users_provider_provider_id', 'users', type_='unique')
    op.drop_index(op.f('ix_users_provider_id'), table_name='users')
    op.drop_index(op.f('ix_users_auth_provider'), table_name='users')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'provider_id')
    op.drop_column('users', 'auth_provider')
    op.execute("DROP TYPE auth_provider_enum")