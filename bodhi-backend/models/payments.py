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
