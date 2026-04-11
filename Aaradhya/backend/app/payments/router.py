"""
/app/payments/router.py

FastAPI router: /payments

Endpoints
---------
POST /payments/intent   — create a Razorpay order (payment intent)
POST /payments/webhook  — receive and verify Razorpay webhook events

Design contract
---------------
- Routes ONLY parse input, delegate to service, and serialise output.
- Zero business logic lives here.
- Raw request body is consumed for signature verification before Pydantic parsing.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.payments.service import (
    DuplicateWebhookError,
    InvalidSignatureError,
    PaymentNotFoundError,
    PaymentServiceError,
    UserNotFoundError,
    create_payment_intent,
    process_webhook,
)
from app.schemas.core import (
    PaymentIntentCreate,
    PaymentIntentResponse,
    WebhookAck,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


# ---------------------------------------------------------------------------
# POST /payments/intent
# ---------------------------------------------------------------------------
@router.post(
    "/intent",
    response_model=PaymentIntentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a payment intent (Razorpay order)",
    responses={
        201: {"description": "Payment intent created"},
        404: {"description": "User not found"},
        502: {"description": "Razorpay upstream error"},
    },
)
async def create_intent(
    body: PaymentIntentCreate,
    db: AsyncSession = Depends(get_db),
) -> PaymentIntentResponse:
    """
    Creates a Razorpay order and a corresponding PENDING Payment + Ledger record.

    **Amount must be supplied in paise (₹1 = 100 paise).**
    """
    try:
        return await create_payment_intent(db, body)
    except UserNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except PaymentServiceError as exc:
        logger.exception("PaymentServiceError in create_intent")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment gateway error; please retry",
        ) from exc


# ---------------------------------------------------------------------------
# POST /payments/webhook
# ---------------------------------------------------------------------------
@router.post(
    "/webhook",
    response_model=WebhookAck,
    status_code=status.HTTP_200_OK,
    summary="Razorpay webhook receiver",
    responses={
        200: {"description": "Event processed or safely ignored (duplicate)"},
        400: {"description": "Invalid signature or malformed payload"},
    },
)
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(
        ...,
        alias="X-Razorpay-Signature",
        description="HMAC-SHA256 signature from Razorpay",
    ),
    db: AsyncSession = Depends(get_db),
) -> WebhookAck:
    """
    Receives Razorpay webhook events.

    **Verification**: HMAC-SHA256 of the raw request body against
    `RAZORPAY_WEBHOOK_SECRET`.

    **Idempotency**: duplicate events (same payload hash) are ACK'd without
    re-processing.

    **Razorpay expects a 200 response** even for events we don't act on;
    non-2xx causes retries.
    """
    # Read raw bytes BEFORE any JSON parsing — signature covers the raw body
    raw_body: bytes = await request.body()

    try:
        return await process_webhook(db, raw_body, x_razorpay_signature)

    except DuplicateWebhookError:
        # Idempotent ACK — do not error; Razorpay will stop retrying
        logger.info("Duplicate webhook ACK'd")
        return WebhookAck(status="ok", message="duplicate event ignored")

    except InvalidSignatureError as exc:
        logger.warning("Webhook signature invalid: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        ) from exc

    except PaymentNotFoundError as exc:
        # Log but still ACK to prevent infinite Razorpay retries for unknown orders
        logger.error("Webhook references unknown order: %s", exc)
        return WebhookAck(status="ok", message="order not found; event noted")

    except PaymentServiceError as exc:
        logger.exception("Unhandled PaymentServiceError in webhook handler")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
