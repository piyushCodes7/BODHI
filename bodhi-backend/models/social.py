"""
models/social.py
All database models for the Social Clubs feature.

Tables:
  clubs          — A named group (trip fund, venture club, etc.)
  club_members   — Many-to-many: user ↔ club with role
  contributions  — A user's contribution to a club fund
  invitations    — Invite link / pending invite
  club_comments  — Chat/comment feed on a club
  venture_bets   — Investment opportunities inside a Venture Club
  bet_positions  — A member's position in a venture bet
"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean,
    DateTime, ForeignKey, Enum as SAEnum, Text, Index,
)
from sqlalchemy.orm import relationship
from database import Base


# ── Enums ─────────────────────────────────────────────────────

class ClubType(str, enum.Enum):
    TRIP       = "trip"        # Goa fund, vacation pool, etc.
    VENTURE    = "venture"     # Startup bets, investment pool
    SAVINGS    = "savings"     # General group savings goal
    CHALLENGE  = "challenge"   # 30-day saving challenge, etc.


class MemberRole(str, enum.Enum):
    ADMIN   = "admin"    # Club creator — can edit, delete, invite
    MEMBER  = "member"   # Regular contributor


class InviteStatus(str, enum.Enum):
    PENDING  = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED  = "expired"


class BetStatus(str, enum.Enum):
    OPEN    = "open"      # Accepting positions
    CLOSED  = "closed"    # No new positions
    SETTLED = "settled"   # Outcome known, P&L distributed


# ── Models ────────────────────────────────────────────────────

class Club(Base):
    __tablename__ = "clubs"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(120), nullable=False)
    description     = Column(String(500), default="")
    emoji           = Column(String(8),  default="🏦")
    club_type       = Column(SAEnum(ClubType), nullable=False, default=ClubType.SAVINGS)
    goal_amount     = Column(Float,  default=0.0)    # Target ₹ to reach
    currency        = Column(String(4), default="INR")
    is_public       = Column(Boolean, default=False)  # True = discoverable
    invite_code     = Column(String(12), unique=True, index=True, nullable=False)
    deadline        = Column(DateTime, nullable=True)  # Optional goal deadline
    created_by      = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    members         = relationship("ClubMember",     back_populates="club", cascade="all, delete-orphan")
    contributions   = relationship("Contribution",   back_populates="club", cascade="all, delete-orphan")
    invitations     = relationship("Invitation",     back_populates="club", cascade="all, delete-orphan")
    comments        = relationship("ClubComment",    back_populates="club", cascade="all, delete-orphan", order_by="ClubComment.created_at.desc()")
    venture_bets    = relationship("VentureBet",     back_populates="club", cascade="all, delete-orphan")

    @property
    def total_pooled(self) -> float:
        return sum(c.amount for c in self.contributions if c.status == "confirmed")

    @property
    def member_count(self) -> int:
        return len(self.members)

    @property
    def progress_pct(self) -> float:
        if not self.goal_amount:
            return 0.0
        return min(100.0, round((self.total_pooled / self.goal_amount) * 100, 1))


class ClubMember(Base):
    __tablename__ = "club_members"

    id         = Column(Integer, primary_key=True)
    club_id    = Column(Integer, ForeignKey("clubs.id",  ondelete="CASCADE"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id",  ondelete="CASCADE"), nullable=False)
    role       = Column(SAEnum(MemberRole), default=MemberRole.MEMBER)
    joined_at  = Column(DateTime, default=datetime.utcnow)

    club       = relationship("Club",     back_populates="members")
    # user    = relationship("User", back_populates="club_memberships")

    __table_args__ = (
        Index("ix_club_member_unique", "club_id", "user_id", unique=True),
    )


class Contribution(Base):
    __tablename__ = "contributions"

    id          = Column(Integer, primary_key=True)
    club_id     = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount      = Column(Float,  nullable=False)
    note        = Column(String(300), default="")
    status      = Column(String(20),  default="confirmed")  # confirmed | pending | refunded
    created_at  = Column(DateTime, default=datetime.utcnow)

    club        = relationship("Club", back_populates="contributions")


class Invitation(Base):
    __tablename__ = "invitations"

    id              = Column(Integer, primary_key=True)
    club_id         = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    invited_by      = Column(Integer, ForeignKey("users.id"), nullable=False)
    invitee_email   = Column(String(200), nullable=True)   # null = open link
    invitee_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status          = Column(SAEnum(InviteStatus), default=InviteStatus.PENDING)
    token           = Column(String(64), unique=True, index=True, nullable=False)
    expires_at      = Column(DateTime, nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)
    responded_at    = Column(DateTime, nullable=True)

    club            = relationship("Club", back_populates="invitations")


class ClubComment(Base):
    __tablename__ = "club_comments"

    id          = Column(Integer, primary_key=True)
    club_id     = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    body        = Column(Text, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

    club        = relationship("Club", back_populates="comments")

    __table_args__ = (
        Index("ix_comments_club_time", "club_id", "created_at"),
    )


class VentureBet(Base):
    __tablename__ = "venture_bets"

    id              = Column(Integer, primary_key=True)
    club_id         = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    title           = Column(String(200), nullable=False)
    description     = Column(Text, default="")
    target_amount   = Column(Float, default=0.0)
    deadline        = Column(DateTime, nullable=True)
    status          = Column(SAEnum(BetStatus), default=BetStatus.OPEN)
    outcome_note    = Column(String(500), default="")  # filled on settlement
    created_by      = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)

    club            = relationship("Club", back_populates="venture_bets")
    positions       = relationship("BetPosition", back_populates="bet", cascade="all, delete-orphan")

    @property
    def total_committed(self) -> float:
        return sum(p.amount for p in self.positions)


class BetPosition(Base):
    __tablename__ = "bet_positions"

    id          = Column(Integer, primary_key=True)
    bet_id      = Column(Integer, ForeignKey("venture_bets.id", ondelete="CASCADE"), nullable=False)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount      = Column(Float, nullable=False)
    note        = Column(String(300), default="")
    created_at  = Column(DateTime, default=datetime.utcnow)

    bet         = relationship("VentureBet", back_populates="positions")
