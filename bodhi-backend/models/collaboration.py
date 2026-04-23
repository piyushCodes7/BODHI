"""
models/collaboration.py
SQLAlchemy models for scoped collaboration (Chat, Polls, Activity).
Scoped to either a TripWallet or an InvestmentGroup.
"""

import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime,
    ForeignKey, Enum as SAEnum, Text, Index, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from database import Base


def _utcnow():
    return datetime.now(timezone.utc)

def _new_uuid():
    return str(uuid.uuid4())


# ── Enums ──────────────────────────────────────────────────────────────────────

class GroupType(str, enum.Enum):
    trip       = "trip"
    investment = "investment"

class MessageType(str, enum.Enum):
    text   = "text"
    image  = "image"
    poll   = "poll"
    system = "system"

class ActivityType(str, enum.Enum):
    member_joined  = "member_joined"
    member_left    = "member_left"
    poll_created   = "poll_created"
    poll_ended     = "poll_ended"
    message_sent   = "message_sent"
    group_created  = "group_created"
    group_updated  = "group_updated"


# ── Poll ───────────────────────────────────────────────────────────────────────

class GroupPoll(Base):
    __tablename__ = "group_polls"

    id          = Column(String(36), primary_key=True, default=_new_uuid)
    group_id    = Column(Integer, nullable=False) # References either TripWallet.id or InvestmentGroup.id
    group_type  = Column(SAEnum(GroupType), nullable=False)
    created_by  = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question    = Column(String(500), nullable=False)
    is_active   = Column(Boolean, default=True, nullable=False)
    created_at  = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    expires_at  = Column(DateTime(timezone=True), nullable=True)

    options = relationship("PollOption", back_populates="poll", cascade="all, delete-orphan")
    votes   = relationship("GroupPollVote", back_populates="poll", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_group_polls_scope", "group_id", "group_type"),
    )


class PollOption(Base):
    __tablename__ = "poll_options"

    id       = Column(Integer, primary_key=True)
    poll_id  = Column(String(36), ForeignKey("group_polls.id", ondelete="CASCADE"), nullable=False)
    text     = Column(String(200), nullable=False)
    votes    = Column(Integer, default=0, nullable=False)

    poll = relationship("GroupPoll", back_populates="options")


class GroupPollVote(Base):
    __tablename__ = "group_poll_votes"

    id              = Column(Integer, primary_key=True)
    poll_id         = Column(String(36), ForeignKey("group_polls.id", ondelete="CASCADE"), nullable=False)
    user_id         = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    selected_option = Column(Integer, ForeignKey("poll_options.id", ondelete="CASCADE"), nullable=False)
    created_at      = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    poll = relationship("GroupPoll", back_populates="votes")

    __table_args__ = (
        UniqueConstraint("poll_id", "user_id", name="uq_group_poll_vote"),
        Index("ix_group_poll_votes_user", "user_id"),
    )


# ── Chat Message ───────────────────────────────────────────────────────────────

class GroupMessage(Base):
    __tablename__ = "group_messages"

    id           = Column(String(36), primary_key=True, default=_new_uuid)
    group_id     = Column(Integer, nullable=False)
    group_type   = Column(SAEnum(GroupType), nullable=False)
    sender_id    = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message      = Column(Text, nullable=False)
    message_type = Column(SAEnum(MessageType), default=MessageType.text, nullable=False)
    created_at   = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    __table_args__ = (
        Index("ix_group_messages_scope_created", "group_id", "group_type", "created_at"),
    )


# ── Activity Feed ──────────────────────────────────────────────────────────────

class GroupActivity(Base):
    __tablename__ = "group_activities"

    id            = Column(Integer, primary_key=True)
    group_id      = Column(Integer, nullable=False)
    group_type    = Column(SAEnum(GroupType), nullable=False)
    user_id       = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    action_type   = Column(SAEnum(ActivityType), nullable=False)
    meta          = Column(JSON, default={})
    created_at    = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    __table_args__ = (
        Index("ix_group_activities_scope_created", "group_id", "group_type", "created_at"),
    )
