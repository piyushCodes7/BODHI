"""
/app/schemas/wallets.py
Pydantic V2 schemas for GroupWallet, TripWallet, and related sub-resources.
All monetary amounts are integers (paise/cents).
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.wallets import (
    GroupWalletStatus,
    MemberRole,
    ProposalStatus,
    TripWalletStatus,
)

# ---------------------------------------------------------------------------
# Shared
# ---------------------------------------------------------------------------
_ORM = ConfigDict(from_attributes=True, populate_by_name=True)

PositivePaise = Annotated[int, Field(gt=0, description="Amount in paise")]
NonNegPaise = Annotated[int, Field(ge=0, description="Amount in paise (≥ 0)")]
Currency = Annotated[str, Field(min_length=3, max_length=3, pattern=r"^[A-Z]{3}$")]


# ===========================================================================
# GROUP WALLET schemas
# ===========================================================================

class GroupWalletCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1024)
    currency: Currency = "INR"
    target_amount: NonNegPaise = Field(
        default=0, description="0 = no hard cap"
    )
    created_by: str = Field(description="Bodhi user UUID of the creator")

    @field_validator("currency")
    @classmethod
    def upper(cls, v: str) -> str:
        return v.upper()


class GroupWalletRead(BaseModel):
    model_config = _ORM

    id: str
    name: str
    description: str | None
    currency: str
    status: GroupWalletStatus
    target_amount: int
    total_contributed: int
    created_by: str
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None


class GroupWalletStatusUpdate(BaseModel):
    status: GroupWalletStatus


# ---------------------------------------------------------------------------
# Group membership
# ---------------------------------------------------------------------------
class GroupJoinRequest(BaseModel):
    user_id: str = Field(description="Bodhi user UUID")
    role: MemberRole = MemberRole.MEMBER


class GroupMemberRead(BaseModel):
    model_config = _ORM

    id: str
    group_id: str
    user_id: str
    role: MemberRole
    contributed_amount: int
    ownership_bps: int = Field(
        description="Proportional ownership in basis points (10000 = 100 %)"
    )
    joined_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Group contribution
# ---------------------------------------------------------------------------
class GroupContributeRequest(BaseModel):
    user_id: str = Field(description="Bodhi user UUID")
    amount: PositivePaise

    @model_validator(mode="after")
    def check_positive(self) -> "GroupContributeRequest":
        if self.amount <= 0:
            raise ValueError("amount must be positive paise")
        return self


class GroupContributeResponse(BaseModel):
    group_id: str
    user_id: str
    contributed_amount: int = Field(description="Member's total after this contribution")
    ownership_bps: int
    group_total: int
    ledger_entry_id: str


# ---------------------------------------------------------------------------
# Vote proposal (placeholder)
# ---------------------------------------------------------------------------
class ProposalCreate(BaseModel):
    proposed_by: str
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    amount: NonNegPaise = 0
    destination: str | None = Field(default=None, max_length=512)
    voting_deadline: datetime | None = None


class ProposalRead(BaseModel):
    model_config = _ORM

    id: str
    group_id: str
    proposed_by: str
    title: str
    description: str | None
    amount: int
    destination: str | None
    status: ProposalStatus
    votes_for: int
    votes_against: int
    voting_deadline: datetime | None
    created_at: datetime
    resolved_at: datetime | None


# ===========================================================================
# TRIP WALLET schemas
# ===========================================================================

class TripWalletCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1024)
    currency: Currency = "INR"
    created_by: str = Field(description="Bodhi user UUID of the creator")

    @field_validator("currency")
    @classmethod
    def upper(cls, v: str) -> str:
        return v.upper()


class TripWalletRead(BaseModel):
    model_config = _ORM

    id: str
    name: str
    description: str | None
    currency: str
    status: TripWalletStatus
    total_contributed: int
    total_expenses: int
    remaining_balance: int
    created_by: str
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None


class TripWalletActivate(BaseModel):
    """Request to transition COLLECTING → ACTIVE."""
    requested_by: str = Field(description="Must be trip admin")


# ---------------------------------------------------------------------------
# Trip membership
# ---------------------------------------------------------------------------
class TripJoinRequest(BaseModel):
    user_id: str
    role: MemberRole = MemberRole.MEMBER


class TripMemberRead(BaseModel):
    model_config = _ORM

    id: str
    trip_id: str
    user_id: str
    role: MemberRole
    contributed_amount: int
    refunded_amount: int
    joined_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Trip contribution
# ---------------------------------------------------------------------------
class TripContributeRequest(BaseModel):
    user_id: str
    amount: PositivePaise


class TripContributeResponse(BaseModel):
    trip_id: str
    user_id: str
    contributed_amount: int
    trip_total: int
    ledger_entry_id: str


# ---------------------------------------------------------------------------
# Trip expense
# ---------------------------------------------------------------------------
class TripExpenseCreate(BaseModel):
    recorded_by: str = Field(description="Bodhi user UUID of the recorder")
    amount: PositivePaise
    description: str = Field(min_length=1, max_length=512)
    category: str | None = Field(default=None, max_length=64)


class TripExpenseRead(BaseModel):
    model_config = _ORM

    id: str
    trip_id: str
    recorded_by: str
    amount: int
    currency: str
    description: str
    category: str | None
    created_at: datetime


# ---------------------------------------------------------------------------
# Trip closure / refund
# ---------------------------------------------------------------------------
class MemberRefundDetail(BaseModel):
    user_id: str
    contributed_amount: int
    refund_amount: int
    ownership_bps: int = Field(description="Basis points of total pool")


class TripCloseResponse(BaseModel):
    trip_id: str
    status: TripWalletStatus
    total_contributed: int
    total_expenses: int
    remaining_balance: int
    refunds: list[MemberRefundDetail]
    closed_at: datetime
