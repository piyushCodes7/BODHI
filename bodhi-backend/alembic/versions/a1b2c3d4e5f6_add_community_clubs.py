"""add community clubs module

Revision ID: a1b2c3d4e5f6
Revises: 22347217ae63
Create Date: 2026-04-23
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '22347217ae63'
branch_labels = None
depends_on = None


def upgrade():
    # clubs
    op.create_table(
        'clubs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('description', sa.Text, nullable=True, default=''),
        sa.Column('profile_image', sa.Text, nullable=True),
        sa.Column('visibility', sa.Enum('public', 'private', name='clubvisibility'), nullable=False, server_default='public'),
        sa.Column('invite_code', sa.String(12), nullable=False, unique=True),
        sa.Column('created_by', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_clubs_visibility', 'clubs', ['visibility'])
    op.create_index('ix_clubs_created_at', 'clubs', ['created_at'])

    # club_members
    op.create_table(
        'club_members',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('club_id', sa.String(36), sa.ForeignKey('clubs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.Enum('admin', 'moderator', 'member', name='clubmemberrole'), nullable=False, server_default='member'),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('club_id', 'user_id', name='uq_club_member'),
    )
    op.create_index('ix_club_members_user_id', 'club_members', ['user_id'])
    op.create_index('ix_club_members_club_id', 'club_members', ['club_id'])

    # club_polls
    op.create_table(
        'club_polls',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('club_id', sa.String(36), sa.ForeignKey('clubs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_by', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question', sa.String(500), nullable=False),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_club_polls_club_id', 'club_polls', ['club_id'])

    # poll_options
    op.create_table(
        'poll_options',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('poll_id', sa.String(36), sa.ForeignKey('club_polls.id', ondelete='CASCADE'), nullable=False),
        sa.Column('text', sa.String(200), nullable=False),
        sa.Column('votes', sa.Integer, nullable=False, server_default='0'),
    )

    # club_poll_votes
    op.create_table(
        'club_poll_votes',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('poll_id', sa.String(36), sa.ForeignKey('club_polls.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('selected_option', sa.Integer, sa.ForeignKey('poll_options.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('poll_id', 'user_id', name='uq_club_poll_vote'),
    )
    op.create_index('ix_club_poll_votes_user', 'club_poll_votes', ['user_id'])

    # club_messages
    op.create_table(
        'club_messages',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('club_id', sa.String(36), sa.ForeignKey('clubs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sender_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('message_type', sa.Enum('text', 'image', 'poll', 'system', name='messagetype'), nullable=False, server_default='text'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_club_messages_club_created', 'club_messages', ['club_id', 'created_at'])

    # club_activities
    op.create_table(
        'club_activities',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('club_id', sa.String(36), sa.ForeignKey('clubs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        sa.Column('action_type', sa.Enum(
            'member_joined', 'member_left', 'poll_created', 'poll_ended',
            'message_sent', 'club_created', 'club_updated',
            name='activitytype'
        ), nullable=False),
        sa.Column('meta', sa.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_club_activities_club_created', 'club_activities', ['club_id', 'created_at'])


def downgrade():
    op.drop_table('club_activities')
    op.drop_table('club_messages')
    op.drop_table('club_poll_votes')
    op.drop_table('poll_options')
    op.drop_table('club_polls')
    op.drop_table('club_members')
    op.drop_table('clubs')
    op.execute("DROP TYPE IF EXISTS clubvisibility")
    op.execute("DROP TYPE IF EXISTS clubmemberrole")
    op.execute("DROP TYPE IF EXISTS messagetype")
    op.execute("DROP TYPE IF EXISTS activitytype")
