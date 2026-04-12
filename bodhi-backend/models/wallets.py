from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger, Boolean, CheckConstraint, DateTime,
    Enum as SAEnum, ForeignKey, Index, Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

def _new_uuid() -> str:
    return str(uuid.uuid4())

class GroupWalletStatus(str, enum.Enum):
    OPEN = "OPEN"
    DEPLOYING = "DEPLOYING"
    CLOSED = "CLOSED"

class TripWalletStatus(str, enum.Enum):
    COLLECTING = "COLLECTING"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"

class MemberRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"

class ProposalStatus(str, enum.Enum):
    OPEN = "OPEN"
    PASSED = "PASSED"
    REJECTED = "REJECTED"
    EXECUTED = "EXECUTED"

class GroupWallet(Base):
    __tablename__ = "group_wallets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")

    status: Mapped[GroupWalletStatus] = mapped_column(
        SAEnum(GroupWalletStatus, name="group_wallet_status_enum"),
        nullable=False,
        default=GroupWalletStatus.OPEN,
    )

    target_amount: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    total_contributed: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    # UPDATED: String(36) -> Integer
    created_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    members: Mapped[list["GroupMember"]] = relationship("GroupMember", back_populates="group", lazy="noload", cascade="all, delete-orphan")
    proposals: Mapped[list["GroupVoteProposal"]] = relationship("GroupVoteProposal", back_populates="group", lazy="noload", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("target_amount >= 0", name="ck_gw_target_non_negative"),
        CheckConstraint("total_contributed >= 0", name="ck_gw_contributed_non_negative"),
    )

class GroupMember(Base):
    __tablename__ = "group_members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("group_wallets.id", ondelete="CASCADE"), nullable=False)
    
    # UPDATED: String(36) -> Integer
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    
    role: Mapped[MemberRole] = mapped_column(SAEnum(MemberRole, name="member_role_enum"), nullable=False, default=MemberRole.MEMBER)
    contributed_amount: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    ownership_bps: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    group: Mapped["GroupWallet"] = relationship("GroupWallet", back_populates="members")

    __table_args__ = (
        UniqueConstraint("group_id", "user_id", name="uq_group_member"),
        CheckConstraint("contributed_amount >= 0", name="ck_gm_contributed_non_negative"),
        CheckConstraint("ownership_bps >= 0 AND ownership_bps <= 10000", name="ck_gm_ownership_bps_range"),
        Index("ix_group_members_group_user", "group_id", "user_id"),
    )

class GroupVoteProposal(Base):
    __tablename__ = "group_vote_proposals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("group_wallets.id", ondelete="CASCADE"), nullable=False)
    
    # UPDATED: String(36) -> Integer
    proposed_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    destination: Mapped[str | None] = mapped_column(String(512), nullable=True) 

    status: Mapped[ProposalStatus] = mapped_column(SAEnum(ProposalStatus, name="proposal_status_enum"), nullable=False, default=ProposalStatus.OPEN)
    votes_for: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    votes_against: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    voting_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    group: Mapped["GroupWallet"] = relationship("GroupWallet", back_populates="proposals")

    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_gvp_amount_non_negative"),
        CheckConstraint("votes_for >= 0", name="ck_gvp_votes_for_non_negative"),
        CheckConstraint("votes_against >= 0", name="ck_gvp_votes_against_non_negative"),
    )

class TripWallet(Base):
    __tablename__ = "trip_wallets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")

    status: Mapped[TripWalletStatus] = mapped_column(SAEnum(TripWalletStatus, name="trip_wallet_status_enum"), nullable=False, default=TripWalletStatus.COLLECTING)

    total_contributed: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    total_expenses: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    remaining_balance: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    # UPDATED: String(36) -> Integer
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    members: Mapped[list["TripMember"]] = relationship("TripMember", back_populates="trip", lazy="noload", cascade="all, delete-orphan")
    expenses: Mapped[list["TripExpense"]] = relationship("TripExpense", back_populates="trip", lazy="noload", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("total_contributed >= 0", name="ck_tw_contributed_non_negative"),
        CheckConstraint("total_expenses >= 0", name="ck_tw_expenses_non_negative"),
        CheckConstraint("remaining_balance >= 0", name="ck_tw_balance_non_negative"),
        CheckConstraint("total_expenses <= total_contributed", name="ck_tw_expenses_lte_contributed"),
    )

class TripMember(Base):
    __tablename__ = "trip_members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    trip_id: Mapped[str] = mapped_column(String(36), ForeignKey("trip_wallets.id", ondelete="CASCADE"), nullable=False)
    
    # UPDATED: String(36) -> Integer
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    
    role: Mapped[MemberRole] = mapped_column(SAEnum(MemberRole, name="member_role_enum"), nullable=False, default=MemberRole.MEMBER)
    contributed_amount: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    refunded_amount: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    trip: Mapped["TripWallet"] = relationship("TripWallet", back_populates="members")

    __table_args__ = (
        UniqueConstraint("trip_id", "user_id", name="uq_trip_member"),
        CheckConstraint("contributed_amount >= 0", name="ck_tm_contributed_non_negative"),
        CheckConstraint("refunded_amount >= 0", name="ck_tm_refunded_non_negative"),
        CheckConstraint("refunded_amount <= contributed_amount", name="ck_tm_refunded_lte_contributed"),
        Index("ix_trip_members_trip_user", "trip_id", "user_id"),
    )

class TripExpense(Base):
    __tablename__ = "trip_expenses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    trip_id: Mapped[str] = mapped_column(String(36), ForeignKey("trip_wallets.id", ondelete="CASCADE"), nullable=False)
    
    # UPDATED: String(36) -> Integer
    recorded_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    description: Mapped[str] = mapped_column(String(512), nullable=False)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)

    trip: Mapped["TripWallet"] = relationship("TripWallet", back_populates="expenses")

    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_te_amount_positive"),
    )