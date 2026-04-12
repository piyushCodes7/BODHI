"""
/app/payments/service.py

Razorpay payment service.

Responsibilities
----------------
1. Create Razorpay orders (payment intents).
2. Verify incoming webhook signatures (HMAC-SHA256).
3. Process webhook events with strict idempotency (no double-credit).
4. Write every money movement to the central Ledger table.
5. Use SELECT … FOR UPDATE row-locking to prevent race conditions.

Money rule: all amounts are integers in the smallest currency unit (paise).
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
from typing import Any

import razorpay  # pip install razorpay
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.core import (
    Ledger,
    LedgerEntryType,
    LedgerReferenceType,
    Payment,
    PaymentStatus,
    User,
)
from app.schemas.core import (
    PaymentIntentCreate,
    PaymentIntentResponse,
    WebhookAck,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Razorpay client (singleton)
# ---------------------------------------------------------------------------
_RAZORPAY_KEY_ID: str = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_CHANGEME")
_RAZORPAY_KEY_SECRET: str = os.environ.get("RAZORPAY_KEY_SECRET", "CHANGEME")
_RAZORPAY_WEBHOOK_SECRET: str = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "CHANGEME")

_rz_client = razorpay.Client(auth=(_RAZORPAY_KEY_ID, _RAZORPAY_KEY_SECRET))


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------
class PaymentServiceError(Exception):
    """Base error for this service."""


class UserNotFoundError(PaymentServiceError):
    pass


class DuplicateWebhookError(PaymentServiceError):
    """Raised when the idempotency key already exists — safe to ACK."""


class InvalidSignatureError(PaymentServiceError):
    """Raised when Razorpay signature verification fails."""


class PaymentNotFoundError(PaymentServiceError):
    pass


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------
def _compute_idempotency_key(raw_body: bytes) -> str:
    """SHA-256 of the raw webhook body bytes."""
    return hashlib.sha256(raw_body).hexdigest()


def _verify_razorpay_signature(raw_body: bytes, signature: str) -> None:
    """
    Verify X-Razorpay-Signature header using HMAC-SHA256.
    Raises InvalidSignatureError if verification fails.
    """
    expected = hmac.new(
        _RAZORPAY_WEBHOOK_SECRET.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise InvalidSignatureError("Razorpay signature mismatch")


async def _get_user_for_update(db: AsyncSession, user_id: str) -> User:
    """
    Fetch user with FOR UPDATE lock to prevent concurrent balance mutations.
    """
    result = await db.execute(
        select(User).where(User.id == user_id).with_for_update()
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise UserNotFoundError(f"User {user_id} not found")
    return user


async def _get_payment_for_update(
    db: AsyncSession, razorpay_order_id: str
) -> Payment:
    """
    Fetch payment by Razorpay order ID with FOR UPDATE lock.
    """
    result = await db.execute(
        select(Payment)
        .where(Payment.razorpay_order_id == razorpay_order_id)
        .with_for_update()
    )
    payment = result.scalar_one_or_none()
    if payment is None:
        raise PaymentNotFoundError(
            f"Payment not found for order {razorpay_order_id}"
        )
    return payment


def _write_ledger_entry(
    db: AsyncSession,
    *,
    user_id: str,
    entry_type: LedgerEntryType,
    amount: int,
    currency: str,
    reference_type: LedgerReferenceType,
    reference_id: str,
    status: PaymentStatus,
    description: str | None = None,
) -> Ledger:
    """
    Construct and stage a Ledger row.
    The UniqueConstraint on (reference_type, reference_id, entry_type)
    acts as a final DB-level idempotency guard.
    """
    entry = Ledger(
        user_id=user_id,
        entry_type=entry_type,
        amount=amount,
        currency=currency,
        reference_type=reference_type,
        reference_id=reference_id,
        status=status,
        description=description,
    )
    db.add(entry)
    return entry


# ---------------------------------------------------------------------------
# Public service API
# ---------------------------------------------------------------------------
async def create_payment_intent(
    db: AsyncSession,
    payload: PaymentIntentCreate,
) -> PaymentIntentResponse:
    """
    1. Validate the user exists.
    2. Create a Razorpay order.
    3. Persist a PENDING Payment record.
    4. Write a PENDING ledger entry (CREDIT intent).
    """
    # Validate user — no FOR UPDATE needed here (read-only check)
    user_result = await db.execute(select(User).where(User.id == payload.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise UserNotFoundError(f"User {payload.user_id} not found")

    # Create Razorpay order (sync SDK — run in threadpool in production)
    try:
        rz_order: dict[str, Any] = _rz_client.order.create(
            {
                "amount": payload.amount,       # already in paise
                "currency": payload.currency,
                "payment_capture": 1,           # auto-capture
                "notes": payload.metadata or {},
            }
        )
    except Exception as exc:
        logger.exception("Razorpay order creation failed")
        raise PaymentServiceError("Failed to create Razorpay order") from exc

    razorpay_order_id: str = rz_order["id"]

    # Persist Payment record
    payment = Payment(
        user_id=payload.user_id,
        razorpay_order_id=razorpay_order_id,
        amount=payload.amount,
        amount_paid=0,
        currency=payload.currency,
        status=PaymentStatus.PENDING,
        description=payload.description,
        metadata_json=json.dumps(payload.metadata) if payload.metadata else None,
    )
    db.add(payment)
    await db.flush()  # populate payment.id

    # Write PENDING ledger entry — intent of money movement
    _write_ledger_entry(
        db,
        user_id=payload.user_id,
        entry_type=LedgerEntryType.CREDIT,
        amount=payload.amount,
        currency=payload.currency,
        reference_type=LedgerReferenceType.PAYMENT,
        reference_id=payment.id,
        status=PaymentStatus.PENDING,
        description=f"Intent for order {razorpay_order_id}",
    )

    logger.info(
        "PaymentIntent created: payment_id=%s order=%s amount=%d %s",
        payment.id,
        razorpay_order_id,
        payload.amount,
        payload.currency,
    )

    return PaymentIntentResponse(
        payment_id=payment.id,
        razorpay_order_id=razorpay_order_id,
        amount=payload.amount,
        currency=payload.currency,
        status=PaymentStatus.PENDING,
        key_id=_RAZORPAY_KEY_ID,
    )


async def process_webhook(
    db: AsyncSession,
    raw_body: bytes,
    signature: str,
) -> WebhookAck:
    """
    Handle an inbound Razorpay webhook.

    Safety guarantees
    -----------------
    - Signature is verified via HMAC-SHA256 before any DB work.
    - Idempotency key (SHA-256 of raw body) is checked; duplicate events
      are ACK'd immediately without re-processing.
    - Payment row is locked with SELECT … FOR UPDATE before state mutation.
    - Ledger entry is written atomically with the Payment update.
    """
    # 1. Verify signature
    _verify_razorpay_signature(raw_body, signature)

    # 2. Idempotency check
    idem_key = _compute_idempotency_key(raw_body)
    existing = await db.execute(
        select(Payment).where(Payment.webhook_idempotency_key == idem_key)
    )
    if existing.scalar_one_or_none() is not None:
        logger.info("Duplicate webhook ignored: idem_key=%s", idem_key)
        raise DuplicateWebhookError("Duplicate webhook")

    # 3. Parse event
    try:
        event_data: dict[str, Any] = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise PaymentServiceError("Invalid JSON in webhook body") from exc

    event_name: str = event_data.get("event", "")
    payload: dict[str, Any] = event_data.get("payload", {})

    logger.info("Webhook event received: %s", event_name)

    # Route to specific handler
    if event_name in ("payment.captured", "order.paid"):
        await _handle_payment_captured(db, payload, idem_key)
    elif event_name == "payment.failed":
        await _handle_payment_failed(db, payload, idem_key)
    else:
        logger.debug("Unhandled webhook event type: %s", event_name)

    return WebhookAck(status="ok", message=f"event '{event_name}' processed")


# ---------------------------------------------------------------------------
# Private webhook event handlers
# ---------------------------------------------------------------------------
async def _handle_payment_captured(
    db: AsyncSession,
    payload: dict[str, Any],
    idem_key: str,
) -> None:
    """
    Handle payment.captured / order.paid.

    Determines if this is a FULL payment (SUCCESS) or PARTIAL payment.
    Writes exactly ONE ledger CREDIT entry per successful payment capture.
    """
    payment_entity: dict[str, Any] = (
        payload.get("payment", {}).get("entity", {})
        or payload.get("order", {}).get("entity", {})
    )
    order_entity: dict[str, Any] = payload.get("order", {}).get("entity", {})

    # Prefer explicit order_id; fall back to payment's order_id field
    razorpay_order_id: str = order_entity.get("id") or payment_entity.get("order_id", "")
    razorpay_payment_id: str = payment_entity.get("id", "")
    amount_paid: int = int(payment_entity.get("amount", 0))  # paise
    currency: str = payment_entity.get("currency", "INR")

    if not razorpay_order_id:
        logger.error("Cannot resolve order_id from webhook payload")
        raise PaymentServiceError("Missing order_id in webhook payload")

    # Lock the Payment row
    payment = await _get_payment_for_update(db, razorpay_order_id)

    # Guard: skip if already SUCCESS (shouldn't happen after idem check, but belt+braces)
    if payment.status == PaymentStatus.SUCCESS:
        logger.warning(
            "Payment %s already SUCCESS; skipping re-credit", payment.id
        )
        return

    # Determine new status
    new_amount_paid = payment.amount_paid + amount_paid

    # Clamp to prevent exceeding order amount due to rounding edge-cases
    if new_amount_paid > payment.amount:
        logger.warning(
            "amount_paid (%d) > order amount (%d) for payment %s — clamping",
            new_amount_paid,
            payment.amount,
            payment.id,
        )
        new_amount_paid = payment.amount

    if new_amount_paid >= payment.amount:
        new_status = PaymentStatus.SUCCESS
    else:
        new_status = PaymentStatus.PARTIAL

    # Mutate Payment state
    payment.status = new_status
    payment.amount_paid = new_amount_paid
    payment.razorpay_payment_id = razorpay_payment_id
    payment.webhook_idempotency_key = idem_key

    # Write SUCCESS ledger entry
    _write_ledger_entry(
        db,
        user_id=payment.user_id,
        entry_type=LedgerEntryType.CREDIT,
        amount=amount_paid,
        currency=currency,
        reference_type=LedgerReferenceType.PAYMENT,
        reference_id=payment.id,
        status=new_status,
        description=f"Razorpay capture {razorpay_payment_id} for order {razorpay_order_id}",
    )

    logger.info(
        "Payment %s → %s (paid=%d / total=%d)",
        payment.id,
        new_status.value,
        new_amount_paid,
        payment.amount,
    )


async def _handle_payment_failed(
    db: AsyncSession,
    payload: dict[str, Any],
    idem_key: str,
) -> None:
    """
    Handle payment.failed.
    Marks the Payment FAILED and writes a FAILED ledger entry (no money moved).
    """
    payment_entity: dict[str, Any] = payload.get("payment", {}).get("entity", {})
    razorpay_order_id: str = payment_entity.get("order_id", "")
    razorpay_payment_id: str = payment_entity.get("id", "")
    currency: str = payment_entity.get("currency", "INR")

    if not razorpay_order_id:
        raise PaymentServiceError("Missing order_id in failed payment webhook")

    payment = await _get_payment_for_update(db, razorpay_order_id)

    # Only transition from PENDING → FAILED (idempotent guard)
    if payment.status != PaymentStatus.PENDING:
        logger.info(
            "Payment %s already %s; ignoring failed event",
            payment.id,
            payment.status.value,
        )
        return

    payment.status = PaymentStatus.FAILED
    payment.razorpay_payment_id = razorpay_payment_id
    payment.webhook_idempotency_key = idem_key

    _write_ledger_entry(
        db,
        user_id=payment.user_id,
        entry_type=LedgerEntryType.CREDIT,  # Amount = order amount; status marks it FAILED
        amount=payment.amount,
        currency=currency,
        reference_type=LedgerReferenceType.PAYMENT,
        reference_id=payment.id,
        status=PaymentStatus.FAILED,
        description=f"Failed payment {razorpay_payment_id} for order {razorpay_order_id}",
    )

    logger.info("Payment %s marked FAILED", payment.id)
