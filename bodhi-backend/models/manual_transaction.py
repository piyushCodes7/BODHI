"""
Manual Transaction model — stores cash/offline transactions logged via the AI voice agent.
These appear in the app's transaction history alongside system-generated records.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from database import Base


def _new_uuid() -> str:
    return str(uuid.uuid4())

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ManualTransaction(Base):
    __tablename__ = "manual_transactions"

    id = Column(String(36), primary_key=True, default=_new_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Transaction details extracted by the AI
    merchant = Column(String(255), nullable=False, default="Unknown")
    category = Column(String(100), nullable=False, default="Other")
    amount = Column(Float, nullable=False)
    type = Column(String(10), nullable=False, default="DEBIT")  # DEBIT or CREDIT
    note = Column(String(500), nullable=True)  # original transcript for reference

    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
