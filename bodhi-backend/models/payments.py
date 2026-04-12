from __future__ import annotations
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger, CheckConstraint, DateTime, Enum as SAEnum, ForeignKey, Index, Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base # Adjust if your Base is imported differently

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

def _new_uuid() -> str:
    return str(uuid.uuid4())

class LedgerEntryType(str, enum.Enum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"

class LedgerReferenceType(str, enum.Enum):
    PAYMENT = "PAYMENT"
    REFUND = "REFUND"
    ADJUSTMENT = "ADJUSTMENT"
    FEE = "FEE"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    PARTIAL = "PARTIAL"

class Ledger(Base):
    __tablename__ = "ledger"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    # UPDATED to Integer
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    entry_type: Mapped[LedgerEntryType] = mapped_column(SAEnum(LedgerEntryType, name="ledger_entry_type_enum"), nullable=False)
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    
    reference_type: Mapped[LedgerReferenceType] = mapped_column(SAEnum(LedgerReferenceType, name="ledger_ref_type_enum"), nullable=False)
    reference_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    status: Mapped[PaymentStatus] = mapped_column(SAEnum(PaymentStatus, name="payment_status_enum"), nullable=False)
    
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow, index=True)

    # REMOVED back_populates to prevent login crash
    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_ledger_amount_positive"),
        UniqueConstraint("reference_type", "reference_id", "entry_type", name="uq_ledger_ref_entry_type"),
        Index("ix_ledger_user_created", "user_id", "created_at"),
    )

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    # UPDATED to Integer
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    razorpay_order_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    amount_paid: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    status: Mapped[PaymentStatus] = mapped_column(SAEnum(PaymentStatus, name="payment_status_enum"), nullable=False, default=PaymentStatus.PENDING)
    
    webhook_idempotency_key: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    # REMOVED back_populates to prevent login crash
    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_payments_amount_positive"),
        CheckConstraint("amount_paid >= 0", name="ck_payments_amount_paid_non_negative"),
        CheckConstraint("amount_paid <= amount", name="ck_payments_amount_paid_lte_amount"),
    )