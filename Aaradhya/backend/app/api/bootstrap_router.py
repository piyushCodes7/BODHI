"""
/app/api/bootstrap_router.py
Development bootstrap endpoint to provision deterministic demo entities
used by the React Native app during local integration testing.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.core import User
from app.models.wallets import (
    GroupMember,
    GroupWallet,
    GroupWalletStatus,
    MemberRole,
    TripExpense,
    TripMember,
    TripWallet,
    TripWalletStatus,
)

router = APIRouter(prefix="/bootstrap", tags=["bootstrap"])

DEMO_USER_1_ID = "7f5d2b8e-17cc-4d8f-a855-d76fb309a100"
DEMO_USER_2_ID = "f650d4af-8bc0-4c0f-a1db-6cbaa3299f16"
DEMO_USER_3_ID = "33fe5b65-b0f5-4786-a3ca-019d68bfaa97"

DEMO_TRIP_ID = "6b8ca3c7-cf68-4a73-8a7e-f0947f0b45e0"
DEMO_GROUP_ID = "fcf0e2ab-2b32-4b16-b9d5-e884f3f72d6d"


class DemoBootstrapResponse(BaseModel):
    current_user_id: str
    trip_id: str
    group_id: str


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _ensure_user(
    db: AsyncSession,
    *,
    user_id: str,
    email: str,
    full_name: str,
) -> None:
    user = await db.get(User, user_id)
    if user is not None:
        return

    db.add(
        User(
            id=user_id,
            email=email,
            full_name=full_name,
            is_active=True,
            is_verified=True,
        )
    )


async def _ensure_trip(db: AsyncSession) -> None:
    trip = await db.get(TripWallet, DEMO_TRIP_ID)
    if trip is not None:
        return

    now = _utcnow()
    db.add(
        TripWallet(
            id=DEMO_TRIP_ID,
            name="Kyoto Retreat",
            description="Spring planning trip",
            currency="JPY",
            status=TripWalletStatus.ACTIVE,
            total_contributed=8_400_000,
            total_expenses=6_470_000,
            remaining_balance=1_930_000,
            created_by=DEMO_USER_1_ID,
            created_at=now,
            updated_at=now,
        )
    )

    db.add_all(
        [
            TripMember(
                trip_id=DEMO_TRIP_ID,
                user_id=DEMO_USER_1_ID,
                role=MemberRole.ADMIN,
                contributed_amount=2_800_000,
            ),
            TripMember(
                trip_id=DEMO_TRIP_ID,
                user_id=DEMO_USER_2_ID,
                role=MemberRole.MEMBER,
                contributed_amount=2_800_000,
            ),
            TripMember(
                trip_id=DEMO_TRIP_ID,
                user_id=DEMO_USER_3_ID,
                role=MemberRole.MEMBER,
                contributed_amount=2_800_000,
            ),
        ]
    )

    db.add_all(
        [
            TripExpense(
                trip_id=DEMO_TRIP_ID,
                recorded_by=DEMO_USER_1_ID,
                amount=4_200_000,
                currency="JPY",
                description="Ritz-Carlton Kyoto",
                category="ACCOMMODATION",
                created_at=now,
            ),
            TripExpense(
                trip_id=DEMO_TRIP_ID,
                recorded_by=DEMO_USER_1_ID,
                amount=1_450_000,
                currency="JPY",
                description="Shinkansen Nozomi",
                category="TRANSPORT",
                created_at=now,
            ),
            TripExpense(
                trip_id=DEMO_TRIP_ID,
                recorded_by=DEMO_USER_1_ID,
                amount=820_000,
                currency="JPY",
                description="Gion Dinner Split",
                category="DINING",
                created_at=now,
            ),
        ]
    )


async def _ensure_group(db: AsyncSession) -> None:
    group = await db.get(GroupWallet, DEMO_GROUP_ID)
    if group is not None:
        return

    now = _utcnow()
    db.add(
        GroupWallet(
            id=DEMO_GROUP_ID,
            name="Goa Trip Fund",
            description="Social contribution pool",
            currency="USD",
            status=GroupWalletStatus.OPEN,
            target_amount=2_000_000,
            total_contributed=1_425_000,
            created_by=DEMO_USER_1_ID,
            created_at=now,
            updated_at=now,
        )
    )

    db.add_all(
        [
            GroupMember(
                group_id=DEMO_GROUP_ID,
                user_id=DEMO_USER_1_ID,
                role=MemberRole.ADMIN,
                contributed_amount=825_000,
                ownership_bps=5789,
            ),
            GroupMember(
                group_id=DEMO_GROUP_ID,
                user_id=DEMO_USER_2_ID,
                role=MemberRole.MEMBER,
                contributed_amount=350_000,
                ownership_bps=2456,
            ),
            GroupMember(
                group_id=DEMO_GROUP_ID,
                user_id=DEMO_USER_3_ID,
                role=MemberRole.MEMBER,
                contributed_amount=250_000,
                ownership_bps=1755,
            ),
        ]
    )


@router.post(
    "/demo",
    response_model=DemoBootstrapResponse,
    summary="Ensure demo users, trip, and group exist",
)
async def ensure_demo_data(db: AsyncSession = Depends(get_db)) -> DemoBootstrapResponse:
    # Keep this endpoint idempotent so frontend can call it every app launch.
    await _ensure_user(
        db,
        user_id=DEMO_USER_1_ID,
        email="james@bodhi.local",
        full_name="James Carter",
    )
    await _ensure_user(
        db,
        user_id=DEMO_USER_2_ID,
        email="hana@bodhi.local",
        full_name="Hana Mori",
    )
    await _ensure_user(
        db,
        user_id=DEMO_USER_3_ID,
        email="kenji@bodhi.local",
        full_name="Kenji Sato",
    )
    await db.flush()

    await _ensure_trip(db)
    await _ensure_group(db)
    await db.flush()

    return DemoBootstrapResponse(
        current_user_id=DEMO_USER_1_ID,
        trip_id=DEMO_TRIP_ID,
        group_id=DEMO_GROUP_ID,
    )