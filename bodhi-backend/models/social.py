"""
models/social.py
SQLAlchemy models for the Social Hub feature.

Tables:
  investment_groups   — A named micro-investment club
  investment_members  — Many-to-many: user ↔ group with share & votes
  trip_wallets        — A shared trip fund
  trip_expenses       — An expense paid by one member, split across others
  trip_splits         — Per-member split record for an expense
"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean,
    DateTime, ForeignKey, Enum as SAEnum, Text, Index,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from database import Base


# ── Enums ──────────────────────────────────────────────────────────────────────

class SplitType(str, enum.Enum):
    EQUAL       = "equal"        # Divide equally among all members
    PERCENTAGE  = "percentage"   # Each member owes a set percentage
    EXACT       = "exact"        # Fixed amounts per member


class TripStatus(str, enum.Enum):
    ACTIVE      = "active"
    SETTLED     = "settled"
    ARCHIVED    = "archived"


class InvestmentStatus(str, enum.Enum):
    ACTIVE      = "active"
    CLOSED      = "closed"


# ── Investment Group ───────────────────────────────────────────────────────────

class InvestmentGroup(Base):
    """
    A pooled micro-investment club where members collectively invest.
    Tracks total portfolio value, cumulative returns, and current status.
    """
    __tablename__ = "investment_groups"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(120), nullable=False)
    description     = Column(String(500), default="")
    emoji           = Column(String(8),   default="📈")
    total_value     = Column(Float, default=0.0, nullable=False)
    # total_returns = current total_value - sum of all member contributions
    total_returns   = Column(Float, default=0.0, nullable=False)
    status          = Column(SAEnum(InvestmentStatus), default=InvestmentStatus.ACTIVE, nullable=False)
    invite_code     = Column(String(12), unique=True, index=True, nullable=False)
    created_by      = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    members         = relationship(
        "InvestmentMember",
        back_populates="group",
        cascade="all, delete-orphan",
    )

    # ── Computed helpers (use in service layer for async safety) ──────────────

    @property
    def member_count(self) -> int:
        return len(self.members)

    @property
    def returns_pct(self) -> float:
        """Return percentage gain/loss across the whole fund."""
        invested = self.total_value - self.total_returns
        if invested <= 0:
            return 0.0
        return round((self.total_returns / invested) * 100, 2)

    def member_share(self, user_id: str) -> float:
        """Rupee value of a specific member's share."""
        membership = next((m for m in self.members if m.user_id == user_id), None)
        if not membership or self.member_count == 0:
            return 0.0
        return round(self.total_value * (membership.share_percentage / 100.0), 2)


class InvestmentMember(Base):
    """
    Membership record linking a user to an InvestmentGroup.
    Stores the member's ownership percentage and counts of pending votes.
    """
    __tablename__ = "investment_members"

    id              = Column(Integer, primary_key=True)
    group_id        = Column(
        Integer,
        ForeignKey("investment_groups.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id         = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Ownership slice expressed as a percentage (0.0 – 100.0).
    # The sum of all members' share_percentage in a group should equal 100.
    share_percentage = Column(Float, default=0.0, nullable=False)
    # Count of open investment proposals this member hasn't voted on yet.
    pending_votes   = Column(Integer, default=0, nullable=False)
    is_admin        = Column(Boolean, default=False, nullable=False)
    joined_at       = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    group           = relationship("InvestmentGroup", back_populates="members")

    __table_args__ = (
        UniqueConstraint("group_id", "user_id", name="uq_investment_member"),
        Index("ix_investment_member_user", "user_id"),
    )


# ── Trip Wallet ────────────────────────────────────────────────────────────────

class TripWallet(Base):
    """
    A shared wallet for a group trip. Members add money and log expenses;
    the app calculates who owes whom at settlement.
    """
    __tablename__ = "trip_wallets"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(120), nullable=False)       # e.g. "Thailand Trip"
    description     = Column(String(500), default="")
    emoji           = Column(String(8),   default="✈️")
    # Running total of all confirmed contributions pooled into the wallet.
    total_balance   = Column(Float, default=0.0, nullable=False)
    status          = Column(SAEnum(TripStatus), default=TripStatus.ACTIVE, nullable=False)
    invite_code     = Column(String(12), unique=True, index=True, nullable=False)
    destination     = Column(String(200), default="")           # Optional destination label
    start_date      = Column(DateTime, nullable=True)
    end_date        = Column(DateTime, nullable=True)
    created_by      = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    members         = relationship(
        "TripMember",
        back_populates="trip",
        cascade="all, delete-orphan",
    )
    expenses        = relationship(
        "TripExpense",
        back_populates="trip",
        cascade="all, delete-orphan",
        order_by="TripExpense.created_at.desc()",
    )

    @property
    def member_count(self) -> int:
        return len(self.members)


class TripMember(Base):
    """
    Membership record for a TripWallet.  Tracks total amount contributed and
    the current net balance (positive = others owe this user; negative = this
    user owes the group).
    """
    __tablename__ = "trip_members"

    id              = Column(Integer, primary_key=True)
    trip_id         = Column(
        Integer,
        ForeignKey("trip_wallets.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id         = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_admin        = Column(Boolean, default=False, nullable=False)
    joined_at       = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    trip            = relationship("TripWallet", back_populates="members")

    __table_args__ = (
        UniqueConstraint("trip_id", "user_id", name="uq_trip_member"),
        Index("ix_trip_member_user", "user_id"),
    )


class TripExpense(Base):
    """
    A single expense recorded against a TripWallet.
    The member who paid is `paid_by_user_id`; the splits table records how
    the cost is distributed among participants.

    split_type determines how TripSplit.amount is interpreted:
      - EQUAL      → amount on each split record = total / n  (pre-calculated)
      - PERCENTAGE → amount on each split record = fraction of total (0–1)
      - EXACT      → amount on each split record = exact rupee amount
    """
    __tablename__ = "trip_expenses"

    id              = Column(Integer, primary_key=True, index=True)
    trip_id         = Column(
        Integer,
        ForeignKey("trip_wallets.id", ondelete="CASCADE"),
        nullable=False,
    )
    paid_by_user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title           = Column(String(200), nullable=False)       # e.g. "Dinner at Patong"
    amount          = Column(Float, nullable=False)             # Total expense in INR
    split_type      = Column(SAEnum(SplitType), default=SplitType.EQUAL, nullable=False)
    category        = Column(String(60), default="general")    # food / transport / hotel…
    note            = Column(Text, default="")
    created_at      = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    trip            = relationship("TripWallet", back_populates="expenses")
    splits          = relationship(
        "TripSplit",
        back_populates="expense",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_expense_trip_date", "trip_id", "created_at"),
    )


class TripSplit(Base):
    """
    Per-member split record for a single TripExpense.
    Interpretation of `amount` depends on the parent expense's split_type.
    `is_settled` is flipped to True when the member settles their share.
    """
    __tablename__ = "trip_splits"

    id              = Column(Integer, primary_key=True)
    expense_id      = Column(
        String(36),
        ForeignKey("trip_expenses.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id         = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    # For EQUAL/EXACT → rupee amount owed; for PERCENTAGE → fraction (0.0–1.0)
    amount          = Column(Float, nullable=False)
    is_settled      = Column(Boolean, default=False, nullable=False)
    settled_at      = Column(DateTime, nullable=True)

    # Relationships
    expense         = relationship("TripExpense", back_populates="splits")

    __table_args__ = (
        UniqueConstraint("expense_id", "user_id", name="uq_trip_split"),
        Index("ix_trip_split_user", "user_id"),
    )