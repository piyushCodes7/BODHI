"""
/app/schemas/core.py
Pydantic V2 schemas for User, Ledger, and Payment domain objects.
All monetary amounts are integers (paise/cents) — never floats.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Annotated, Any

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)

from app.models.core import LedgerEntryType, LedgerReferenceType, PaymentStatus

# ---------------------------------------------------------------------------
# Shared config
# ---------------------------------------------------------------------------
_ORM_CONFIG = ConfigDict(from_attributes=True, populate_by_name=True)

# ---------------------------------------------------------------------------
# Primitives / Annotated types
# ---------------------------------------------------------------------------
PositivePaise = Annotated[int, Field(gt=0, description="Amount in paise (1 INR = 100 paise)")]
Currency = Annotated[str, Field(min_length=3, max_length=3, pattern=r"^[A-Z]{3}$")]


# ---------------------------------------------------------------------------
# User schemas
# ---------------------------------------------------------------------------
class UserCreate(BaseModel):
    email: EmailStr
    phone: str | None = Field(
        default=None,
        pattern=r"^\+?[1-9]\d{7,14}$",
        description="E.164 phone number",
    )
    full_name: str = Field(min_length=1, max_length=255)

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class UserRead(BaseModel):
    model_config = _ORM_CONFIG

    id: str
    email: str
    phone: str | None
    full_name: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, pattern=r"^\+?[1-9]\d{7,14}$")
    is_active: bool | None = None


# ---------------------------------------------------------------------------
# Ledger schemas
# ---------------------------------------------------------------------------
class LedgerEntryRead(BaseModel):
    model_config = _ORM_CONFIG

    id: str
    user_id: str
    entry_type: LedgerEntryType
    amount: PositivePaise
    currency: Currency
    reference_type: LedgerReferenceType
    reference_id: str
    status: PaymentStatus
    description: str | None
    created_at: datetime


class BalanceSummary(BaseModel):
    """Derived balance — computed from ledger, never stored."""

    user_id: str
    currency: str
    total_credits: int = Field(ge=0)
    total_debits: int = Field(ge=0)
    net_balance: int  # credits - debits; may be negative if debits exceed credits


# ---------------------------------------------------------------------------
# Payment / Intent schemas
# ---------------------------------------------------------------------------
class PaymentIntentCreate(BaseModel):
    """Request body for POST /payments/intent."""

    user_id: str = Field(description="Bodhi user UUID")
    amount: PositivePaise = Field(description="Amount in paise")
    currency: Currency = Field(default="INR")
    description: str | None = Field(default=None, max_length=512)
    metadata: dict[str, Any] | None = Field(default=None)

    @field_validator("currency")
    @classmethod
    def upper_currency(cls, v: str) -> str:
        return v.upper()


class PaymentIntentResponse(BaseModel):
    """Returned after creating a Razorpay order."""

    payment_id: str = Field(description="Bodhi internal payment UUID")
    razorpay_order_id: str
    amount: PositivePaise
    currency: Currency
    status: PaymentStatus
    key_id: str = Field(description="Razorpay Key ID for frontend checkout")


class PaymentRead(BaseModel):
    model_config = _ORM_CONFIG

    id: str
    user_id: str
    razorpay_order_id: str
    razorpay_payment_id: str | None
    amount: int
    amount_paid: int
    currency: str
    status: PaymentStatus
    description: str | None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Webhook schemas
# ---------------------------------------------------------------------------
class RazorpayWebhookPayload(BaseModel):
    """
    Minimal validated shape of a Razorpay webhook event body.
    Full payload is kept raw for signature verification.
    """

    model_config = ConfigDict(extra="allow")

    event: str = Field(description="e.g. payment.captured, order.paid")
    payload: dict[str, Any]

    @field_validator("event")
    @classmethod
    def event_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("event field must not be blank")
        return v


class WebhookAck(BaseModel):
    """Standard acknowledgement returned to Razorpay."""

    status: str = "ok"
    message: str = "processed"


# ---------------------------------------------------------------------------
# Error / generic response helpers
# ---------------------------------------------------------------------------
class ErrorDetail(BaseModel):
    code: str
    message: str
    field: str | None = None


class ErrorResponse(BaseModel):
    errors: list[ErrorDetail]
