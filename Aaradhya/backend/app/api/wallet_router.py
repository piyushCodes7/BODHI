"""
/app/api/wallet_router.py

FastAPI router for GroupWallet and TripWallet resources.

Design contract
---------------
- Zero business logic here. Routes parse → delegate → serialise.
- 409 Conflict for stale-state / duplicate errors.
- 422 is handled automatically by FastAPI/Pydantic.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

# Group service + exceptions
import app.groups.service as group_svc
from app.groups.service import (
    AlreadyMemberError as GAlreadyMember,
    GroupClosedError,
    GroupNotFoundError,
    GroupServiceError,
    NotMemberError as GNotMember,
    UserNotFoundError as GUserNotFound,
)

# Trip service + exceptions
import app.trips.service as trip_svc
from app.trips.service import (
    AlreadyMemberError as TAlreadyMember,
    InsufficientFundsError,
    NotMemberError as TNotMember,
    TripNotFoundError,
    TripServiceError,
    TripStateError,
    UserNotFoundError as TUserNotFound,
)

# Schemas
from app.schemas.wallets import (
    GroupContributeRequest,
    GroupContributeResponse,
    GroupJoinRequest,
    GroupMemberRead,
    GroupWalletCreate,
    GroupWalletRead,
    ProposalCreate,
    ProposalRead,
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

router = APIRouter(prefix="/wallets", tags=["wallets"])


# ===========================================================================
# GROUP WALLET endpoints
# ===========================================================================

_GROUP_PREFIX = "/groups"


@router.post(
    f"{_GROUP_PREFIX}",
    response_model=GroupWalletRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a group investment wallet",
)
async def create_group(
    body: GroupWalletCreate,
    db: AsyncSession = Depends(get_db),
) -> GroupWalletRead:
    try:
        return await group_svc.create_group(db, body)
    except GUserNotFound as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.get(
    f"{_GROUP_PREFIX}/{{group_id}}",
    response_model=GroupWalletRead,
    summary="Get group wallet details",
)
async def get_group(
    group_id: str,
    db: AsyncSession = Depends(get_db),
) -> GroupWalletRead:
    try:
        return await group_svc.get_group(db, group_id)
    except GroupNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.post(
    f"{_GROUP_PREFIX}/{{group_id}}/members",
    response_model=GroupMemberRead,
    status_code=status.HTTP_201_CREATED,
    summary="Join a group wallet",
)
async def join_group(
    group_id: str,
    body: GroupJoinRequest,
    db: AsyncSession = Depends(get_db),
) -> GroupMemberRead:
    try:
        return await group_svc.join_group(db, group_id, body)
    except GroupNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except GUserNotFound as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except GroupClosedError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except GAlreadyMember as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc


@router.get(
    f"{_GROUP_PREFIX}/{{group_id}}/members",
    response_model=list[GroupMemberRead],
    summary="List group members",
)
async def list_group_members(
    group_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[GroupMemberRead]:
    return await group_svc.list_members(db, group_id)


@router.post(
    f"{_GROUP_PREFIX}/{{group_id}}/contribute",
    response_model=GroupContributeResponse,
    status_code=status.HTTP_200_OK,
    summary="Contribute funds to a group wallet",
)
async def contribute_to_group(
    group_id: str,
    body: GroupContributeRequest,
    db: AsyncSession = Depends(get_db),
) -> GroupContributeResponse:
    try:
        return await group_svc.contribute(db, group_id, body)
    except GroupNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except GUserNotFound as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except GroupClosedError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except GroupServiceError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc


@router.post(
    f"{_GROUP_PREFIX}/{{group_id}}/close",
    response_model=GroupWalletRead,
    summary="Close a group wallet",
)
async def close_group(
    group_id: str,
    db: AsyncSession = Depends(get_db),
) -> GroupWalletRead:
    try:
        return await group_svc.close_group(db, group_id)
    except GroupNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except GroupClosedError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc


@router.post(
    f"{_GROUP_PREFIX}/{{group_id}}/proposals",
    response_model=ProposalRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a fund-deployment vote proposal",
)
async def create_proposal(
    group_id: str,
    body: ProposalCreate,
    db: AsyncSession = Depends(get_db),
) -> ProposalRead:
    try:
        return await group_svc.create_proposal(db, group_id, body)
    except GroupNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except GroupClosedError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except GNotMember as exc:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(exc)) from exc


# ===========================================================================
# TRIP WALLET endpoints
# ===========================================================================

_TRIP_PREFIX = "/trips"


@router.post(
    f"{_TRIP_PREFIX}",
    response_model=TripWalletRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a trip / event wallet",
)
async def create_trip(
    body: TripWalletCreate,
    db: AsyncSession = Depends(get_db),
) -> TripWalletRead:
    try:
        return await trip_svc.create_trip(db, body)
    except TUserNotFound as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.get(
    f"{_TRIP_PREFIX}/{{trip_id}}",
    response_model=TripWalletRead,
    summary="Get trip wallet details",
)
async def get_trip(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
) -> TripWalletRead:
    try:
        return await trip_svc.get_trip(db, trip_id)
    except TripNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.post(
    f"{_TRIP_PREFIX}/{{trip_id}}/members",
    response_model=TripMemberRead,
    status_code=status.HTTP_201_CREATED,
    summary="Join a trip wallet",
)
async def join_trip(
    trip_id: str,
    body: TripJoinRequest,
    db: AsyncSession = Depends(get_db),
) -> TripMemberRead:
    try:
        return await trip_svc.join_trip(db, trip_id, body)
    except TripNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except TUserNotFound as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except TripStateError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except TAlreadyMember as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc


@router.get(
    f"{_TRIP_PREFIX}/{{trip_id}}/members",
    response_model=list[TripMemberRead],
    summary="List trip members",
)
async def list_trip_members(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[TripMemberRead]:
    return await trip_svc.list_trip_members(db, trip_id)


@router.post(
    f"{_TRIP_PREFIX}/{{trip_id}}/contribute",
    response_model=TripContributeResponse,
    summary="Contribute funds to a trip wallet",
)
async def contribute_to_trip(
    trip_id: str,
    body: TripContributeRequest,
    db: AsyncSession = Depends(get_db),
) -> TripContributeResponse:
    try:
        return await trip_svc.contribute_to_trip(db, trip_id, body)
    except TripNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except TUserNotFound as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except TripStateError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except TNotMember as exc:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(exc)) from exc
    except TripServiceError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc


@router.post(
    f"{_TRIP_PREFIX}/{{trip_id}}/activate",
    response_model=TripWalletRead,
    summary="Transition trip from COLLECTING → ACTIVE",
)
async def activate_trip(
    trip_id: str,
    body: TripWalletActivate,
    db: AsyncSession = Depends(get_db),
) -> TripWalletRead:
    try:
        return await trip_svc.activate_trip(db, trip_id, body)
    except TripNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except TripStateError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except TNotMember as exc:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(exc)) from exc


@router.post(
    f"{_TRIP_PREFIX}/{{trip_id}}/expenses",
    response_model=TripExpenseRead,
    status_code=status.HTTP_201_CREATED,
    summary="Record an expense against an ACTIVE trip wallet",
)
async def record_expense(
    trip_id: str,
    body: TripExpenseCreate,
    db: AsyncSession = Depends(get_db),
) -> TripExpenseRead:
    try:
        return await trip_svc.record_expense(db, trip_id, body)
    except TripNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except TUserNotFound as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except TripStateError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except TNotMember as exc:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(exc)) from exc
    except InsufficientFundsError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc


@router.get(
    f"{_TRIP_PREFIX}/{{trip_id}}/expenses",
    response_model=list[TripExpenseRead],
    summary="List all expenses for a trip wallet",
)
async def list_expenses(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[TripExpenseRead]:
    return await trip_svc.list_trip_expenses(db, trip_id)


@router.post(
    f"{_TRIP_PREFIX}/{{trip_id}}/close",
    response_model=TripCloseResponse,
    summary="Close an ACTIVE trip wallet and issue proportional refunds",
)
async def close_trip(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
) -> TripCloseResponse:
    try:
        return await trip_svc.close_trip(db, trip_id)
    except TripNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except TripStateError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
