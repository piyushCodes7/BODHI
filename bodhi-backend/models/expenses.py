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

class SplitMethod(str, enum.Enum):
    EQUAL = "EQUAL"
    EXACT = "EXACT"
    PERCENTAGE = "PERCENTAGE"

class ExpenseStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SETTLED = "SETTLED"
    CANCELLED = "CANCELLED"

class DebtStatus(str, enum.Enum):
    OUTSTANDING = "OUTSTANDING"
    SETTLED = "SETTLED"

class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    group_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("group_wallets.id", ondelete="SET NULL"), nullable=True, index=True)
    trip_id: Mapped[str | None] = mapped_column(Integer, ForeignKey("trip_wallets.id", ondelete="SET NULL"), nullable=True, index=True)

    # 🟢 FIXED: Mapped[str] and String(36)
    paid_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    description: Mapped[str] = mapped_column(String(512), nullable=False)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)

    total_amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")

    split_method: Mapped[SplitMethod] = mapped_column(SAEnum(SplitMethod, name="split_method_enum"), nullable=False)
    status: Mapped[ExpenseStatus] = mapped_column(SAEnum(ExpenseStatus, name="expense_status_enum"), nullable=False, default=ExpenseStatus.ACTIVE)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    splits: Mapped[list["ExpenseSplit"]] = relationship("ExpenseSplit", back_populates="expense", lazy="noload", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("total_amount > 0", name="ck_expense_amount_positive"),
    )

class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    expense_id: Mapped[str] = mapped_column(String(36), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False)
    
    # 🟢 FIXED: Mapped[str] and String(36)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    owed_amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    percentage_bps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_settled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    expense: Mapped["Expense"] = relationship("Expense", back_populates="splits")

    __table_args__ = (
        UniqueConstraint("expense_id", "user_id", name="uq_expense_split_user"),
        CheckConstraint("owed_amount >= 0", name="ck_split_owed_non_negative"),
        CheckConstraint("percentage_bps IS NULL OR (percentage_bps >= 0 AND percentage_bps <= 10000)", name="ck_split_pct_bps_range"),
        Index("ix_expense_splits_expense", "expense_id"),
        Index("ix_expense_splits_user", "user_id"),
    )

class Debt(Base):
    __tablename__ = "debts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    
    debtor_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    creditor_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    net_amount: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    status: Mapped[DebtStatus] = mapped_column(SAEnum(DebtStatus, name="debt_status_enum"), nullable=False, default=DebtStatus.OUTSTANDING)

    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)

    __table_args__ = (
        UniqueConstraint("debtor_id", "creditor_id", "currency", name="uq_debt_pair_currency"),
        CheckConstraint("debtor_id != creditor_id", name="ck_debt_no_self"),
        CheckConstraint("net_amount >= 0", name="ck_debt_amount_non_negative"),
    )

class Settlement(Base):
    __tablename__ = "settlements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    debt_id: Mapped[str] = mapped_column(String(36), ForeignKey("debts.id", ondelete="RESTRICT"), nullable=False)
    
    paid_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    paid_to: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))

    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    note: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)

    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_settlement_amount_positive"),
        CheckConstraint("paid_by != paid_to", name="ck_settlement_no_self"),
    )