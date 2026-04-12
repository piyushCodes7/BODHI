"""
/app/trips/service.py

Business logic for TripWallet.

State machine
-------------
  COLLECTING ──► ACTIVE ──► CLOSED (terminal; strictly immutable)

Rules
-----
- Contributions accepted only in COLLECTING state.
- Expenses accepted only in ACTIVE state.
- CLOSED is terminal — no writes of any kind are accepted.
- Every money movement writes a Ledger entry (source of truth).
- SELECT … FOR UPDATE locks prevent race conditions on concurrent
  contributions or expense submissions.
- Refund algorithm distributes remaining_balance proportionally to each
  member's initial contribution ratio using integer arithmetic; rounding
  remainder (≥ 0 paise) goes to the largest contributor.
- If total_contributed == 0 (no funds ever collected) the wallet closes
  cleanly with zero refunds.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from decimal import ROUND_DOWN, Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.core import Ledger, LedgerEntryType, LedgerReferenceType, PaymentStatus, User
from app.models.wallets import (
    MemberRole,
    TripExpense,
    TripMember,
    TripWallet,
    TripWalletStatus,
)
from app.schemas.wallets import (
    MemberRefundDetail,
    TripCloseResponse,
    TripContributeRequest,
    TripContributeResponse,
    TripExpenseCreate,
    TripExpenseRead,
    TripJoinRequest,
    TripMemberRead,
    TripWalletActivate,
    TripWalletCreate,
    TripWalletRead,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------
class TripServiceError(Exception):
    pass


class TripNotFoundError(TripServiceError):
    pass


class TripStateError(TripServiceError):
    """Raised when an action violates the state machine."""
    pass


class UserNotFoundError(TripServiceError):
    pass


class NotMemberError(TripServiceError):
    pass


class AlreadyMemberError(TripServiceError):
    pass


class InsufficientFundsError(TripServiceError):
    pass


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------
async def _fetch_trip_locked(db: AsyncSession, trip_id: str) -> TripWallet:
    result = await db.execute(
        select(TripWallet).where(TripWallet.id == trip_id).with_for_update()
    )
    trip = result.scalar_one_or_none()
    if trip is None:
        raise TripNotFoundError(f"TripWallet {trip_id} not found")
    return trip


async def _fetch_user(db: AsyncSession, user_id: str) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise UserNotFoundError(f"User {user_id} not found")
    return user


async def _fetch_member_locked(
    db: AsyncSession, trip_id: str, user_id: str
) -> TripMember | None:
    result = await db.execute(
        select(TripMember)
        .where(TripMember.trip_id == trip_id, TripMember.user_id == user_id)
        .with_for_update()
    )
    return result.scalar_one_or_none()


async def _all_members_locked(db: AsyncSession, trip_id: str) -> list[TripMember]:
    result = await db.execute(
        select(TripMember)
        .where(TripMember.trip_id == trip_id)
        .with_for_update()
    )
    return list(result.scalars().all())


def _assert_not_closed(trip: TripWallet) -> None:
    """Hard guard: CLOSED wallets are strictly immutable."""
    if trip.status == TripWalletStatus.CLOSED:
        raise TripStateError(
            f"TripWallet {trip.id} is CLOSED and immutable; no further actions allowed"
        )


def _write_ledger(
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
# Proportional refund algorithm
# ---------------------------------------------------------------------------
def _compute_refunds(
    members: list[TripMember], remaining_balance: int
) -> list[tuple[TripMember, int]]:
    """
    Distribute `remaining_balance` (paise) proportionally across members
    based on their `contributed_amount`.

    Algorithm
    ---------
    1. Compute each member's share using integer division (floor).
    2. Track the total allocated so far.
    3. Assign the rounding remainder (remaining_balance - sum_of_floors)
       to the member with the largest contribution.

    Returns a list of (TripMember, refund_amount_paise) tuples.
    Edge cases:
    - Zero total_contributed → everyone gets 0.
    - Zero remaining_balance → everyone gets 0.
    - Members with contributed_amount == 0 get 0 regardless.
    """
    if remaining_balance <= 0:
        return [(m, 0) for m in members]

    total_contributed = sum(m.contributed_amount for m in members)
    if total_contributed == 0:
        return [(m, 0) for m in members]

    allocations: list[tuple[TripMember, int]] = []
    allocated_total = 0
    largest_member: TripMember | None = None
    largest_contribution = -1

    for member in members:
        # Floor division — never over-allocate
        share = (member.contributed_amount * remaining_balance) // total_contributed
        allocations.append((member, share))
        allocated_total += share

        if member.contributed_amount > largest_contribution:
            largest_contribution = member.contributed_amount
            largest_member = member

    # Remainder (0 to len(members)-1 paise) → largest contributor
    remainder = remaining_balance - allocated_total
    if remainder > 0 and largest_member is not None:
        # Find and update the tuple in place via index
        for i, (m, share) in enumerate(allocations):
            if m is largest_member:
                allocations[i] = (m, share + remainder)
                break

    return allocations


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
async def create_trip(
    db: AsyncSession, payload: TripWalletCreate
) -> TripWalletRead:
    await _fetch_user(db, payload.created_by)

    trip = TripWallet(
        name=payload.name,
        description=payload.description,
        currency=payload.currency,
        created_by=payload.created_by,
        status=TripWalletStatus.COLLECTING,
    )
    db.add(trip)
    await db.flush()

    # Creator auto-joins as ADMIN
    admin_member = TripMember(
        trip_id=trip.id,
        user_id=payload.created_by,
        role=MemberRole.ADMIN,
    )
    db.add(admin_member)
    await db.flush()

    logger.info("TripWallet created: id=%s by=%s", trip.id, payload.created_by)
    return TripWalletRead.model_validate(trip)


async def join_trip(
    db: AsyncSession, trip_id: str, payload: TripJoinRequest
) -> TripMemberRead:
    trip = await _fetch_trip_locked(db, trip_id)
    _assert_not_closed(trip)

    if trip.status != TripWalletStatus.COLLECTING:
        raise TripStateError(
            "New members can only join during the COLLECTING phase"
        )

    await _fetch_user(db, payload.user_id)

    existing = await _fetch_member_locked(db, trip_id, payload.user_id)
    if existing is not None:
        raise AlreadyMemberError(f"User {payload.user_id} is already a member")

    member = TripMember(
        trip_id=trip_id,
        user_id=payload.user_id,
        role=payload.role,
    )
    db.add(member)
    await db.flush()

    logger.info("User %s joined trip %s", payload.user_id, trip_id)
    return TripMemberRead.model_validate(member)


async def contribute_to_trip(
    db: AsyncSession, trip_id: str, payload: TripContributeRequest
) -> TripContributeResponse:
    """
    Accept a contribution. Only allowed in COLLECTING state.
    Locks both the trip and member rows before mutation.
    """
    trip = await _fetch_trip_locked(db, trip_id)
    _assert_not_closed(trip)

    if trip.status != TripWalletStatus.COLLECTING:
        raise TripStateError(
            f"TripWallet {trip_id} is {trip.status.value}; contributions not accepted"
        )

    await _fetch_user(db, payload.user_id)

    member = await _fetch_member_locked(db, trip_id, payload.user_id)
    if member is None:
        raise NotMemberError(
            f"User {payload.user_id} is not a member of trip {trip_id}; join first"
        )

    # Update denormalised totals
    member.contributed_amount += payload.amount
    trip.total_contributed += payload.amount
    trip.remaining_balance += payload.amount

    # Ledger: CREDIT to the trip's virtual pool on behalf of the user
    ledger_entry = _write_ledger(
        db,
        user_id=payload.user_id,
        entry_type=LedgerEntryType.CREDIT,
        amount=payload.amount,
        currency=trip.currency,
        reference_type=LedgerReferenceType.PAYMENT,
        reference_id=trip_id,
        status=PaymentStatus.SUCCESS,
        description=f"Contribution to trip '{trip.name}'",
    )
    await db.flush()

    logger.info(
        "Trip contribution: user=%s trip=%s amount=%d total=%d",
        payload.user_id,
        trip_id,
        payload.amount,
        trip.total_contributed,
    )
    return TripContributeResponse(
        trip_id=trip_id,
        user_id=payload.user_id,
        contributed_amount=member.contributed_amount,
        trip_total=trip.total_contributed,
        ledger_entry_id=ledger_entry.id,
    )


async def activate_trip(
    db: AsyncSession, trip_id: str, payload: TripWalletActivate
) -> TripWalletRead:
    """Transition COLLECTING → ACTIVE. Only admin may activate."""
    trip = await _fetch_trip_locked(db, trip_id)
    _assert_not_closed(trip)

    if trip.status != TripWalletStatus.COLLECTING:
        raise TripStateError(
            f"Only COLLECTING trips can be activated (current: {trip.status.value})"
        )

    # Verify requester is an admin member
    member = await _fetch_member_locked(db, trip_id, payload.requested_by)
    if member is None or member.role != MemberRole.ADMIN:
        from app.models.wallets import MemberRole as MR  # avoid circular at top
        raise NotMemberError(
            f"User {payload.requested_by} is not an admin of trip {trip_id}"
        )

    trip.status = TripWalletStatus.ACTIVE
    await db.flush()

    logger.info("TripWallet %s → ACTIVE", trip_id)
    return TripWalletRead.model_validate(trip)


async def record_expense(
    db: AsyncSession, trip_id: str, payload: TripExpenseCreate
) -> TripExpenseRead:
    """
    Debit an expense from the trip pool. Only allowed in ACTIVE state.
    Validates sufficient remaining_balance before writing.
    """
    trip = await _fetch_trip_locked(db, trip_id)
    _assert_not_closed(trip)

    if trip.status != TripWalletStatus.ACTIVE:
        raise TripStateError(
            f"Expenses can only be recorded for ACTIVE trips (current: {trip.status.value})"
        )

    await _fetch_user(db, payload.recorded_by)

    member = await _fetch_member_locked(db, trip_id, payload.recorded_by)
    if member is None:
        raise NotMemberError(
            f"User {payload.recorded_by} is not a member of trip {trip_id}"
        )

    if payload.amount > trip.remaining_balance:
        raise InsufficientFundsError(
            f"Expense {payload.amount} exceeds remaining balance {trip.remaining_balance}"
        )

    # Debit pool
    trip.total_expenses += payload.amount
    trip.remaining_balance -= payload.amount

    expense = TripExpense(
        trip_id=trip_id,
        recorded_by=payload.recorded_by,
        amount=payload.amount,
        currency=trip.currency,
        description=payload.description,
        category=payload.category,
    )
    db.add(expense)
    await db.flush()

    # Ledger: DEBIT from the pool (charged to the recorder as the accountable party)
    _write_ledger(
        db,
        user_id=payload.recorded_by,
        entry_type=LedgerEntryType.DEBIT,
        amount=payload.amount,
        currency=trip.currency,
        reference_type=LedgerReferenceType.PAYMENT,
        reference_id=expense.id,
        status=PaymentStatus.SUCCESS,
        description=f"Expense '{payload.description}' on trip '{trip.name}'",
    )

    logger.info(
        "Expense recorded: trip=%s amount=%d remaining=%d",
        trip_id,
        payload.amount,
        trip.remaining_balance,
    )
    return TripExpenseRead.model_validate(expense)


async def close_trip(db: AsyncSession, trip_id: str) -> TripCloseResponse:
    """
    Transition ACTIVE → CLOSED.

    1. Lock all member rows.
    2. Compute proportional refunds from remaining_balance.
    3. Write a DEBIT ledger entry per member refunded (money leaving the pool
       back to the member) and a CREDIT entry on each member's personal ledger.
    4. Mark trip CLOSED and set closed_at.

    CLOSED is terminal — this function is idempotent-safe (will raise
    TripStateError if called on an already-closed trip).
    """
    trip = await _fetch_trip_locked(db, trip_id)

    if trip.status == TripWalletStatus.CLOSED:
        raise TripStateError(f"TripWallet {trip_id} is already CLOSED")

    if trip.status == TripWalletStatus.COLLECTING:
        raise TripStateError(
            "Cannot close a COLLECTING trip; activate it first (or cancel directly)"
        )

    members = await _all_members_locked(db, trip_id)
    refund_allocations = _compute_refunds(members, trip.remaining_balance)

    refund_details: list[MemberRefundDetail] = []
    total_contributed = sum(m.contributed_amount for m in members)

    for member, refund_amount in refund_allocations:
        member.refunded_amount = refund_amount

        ownership_bps = (
            (member.contributed_amount * 10_000) // total_contributed
            if total_contributed > 0
            else 0
        )

        if refund_amount > 0:
            # Pool side: DEBIT (funds leaving the trip pool)
            _write_ledger(
                db,
                user_id=member.user_id,
                entry_type=LedgerEntryType.DEBIT,
                amount=refund_amount,
                currency=trip.currency,
                reference_type=LedgerReferenceType.REFUND,
                reference_id=trip_id,
                status=PaymentStatus.SUCCESS,
                description=f"Refund on closure of trip '{trip.name}'",
            )
            # Member side: CREDIT (funds arriving back to the member)
            _write_ledger(
                db,
                user_id=member.user_id,
                entry_type=LedgerEntryType.CREDIT,
                amount=refund_amount,
                currency=trip.currency,
                reference_type=LedgerReferenceType.REFUND,
                reference_id=f"{trip_id}:{member.user_id}",  # scoped ref
                status=PaymentStatus.SUCCESS,
                description=f"Refund received from trip '{trip.name}'",
            )

        refund_details.append(
            MemberRefundDetail(
                user_id=member.user_id,
                contributed_amount=member.contributed_amount,
                refund_amount=refund_amount,
                ownership_bps=ownership_bps,
            )
        )

    # Finalise trip
    closed_at = datetime.now(timezone.utc)
    trip.status = TripWalletStatus.CLOSED
    trip.remaining_balance = 0  # all funds either expensed or refunded
    trip.closed_at = closed_at
    await db.flush()

    logger.info(
        "TripWallet %s CLOSED; remaining=%d distributed across %d members",
        trip_id,
        trip.remaining_balance,
        len(members),
    )

    return TripCloseResponse(
        trip_id=trip_id,
        status=TripWalletStatus.CLOSED,
        total_contributed=trip.total_contributed,
        total_expenses=trip.total_expenses,
        remaining_balance=0,
        refunds=refund_details,
        closed_at=closed_at,
    )


async def get_trip(db: AsyncSession, trip_id: str) -> TripWalletRead:
    result = await db.execute(
        select(TripWallet).where(TripWallet.id == trip_id)
    )
    trip = result.scalar_one_or_none()
    if trip is None:
        raise TripNotFoundError(f"TripWallet {trip_id} not found")
    return TripWalletRead.model_validate(trip)


async def list_trip_members(
    db: AsyncSession, trip_id: str
) -> list[TripMemberRead]:
    result = await db.execute(
        select(TripMember).where(TripMember.trip_id == trip_id)
    )
    return [TripMemberRead.model_validate(m) for m in result.scalars().all()]


async def list_trip_expenses(
    db: AsyncSession, trip_id: str
) -> list[TripExpenseRead]:
    result = await db.execute(
        select(TripExpense).where(TripExpense.trip_id == trip_id)
    )
    return [TripExpenseRead.model_validate(e) for e in result.scalars().all()]
