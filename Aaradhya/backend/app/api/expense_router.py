"""
/app/api/expense_router.py
FastAPI router for the Splitwise-style expense system.
Routes: parse → service → serialise. Zero business logic.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.expenses.service import (
    AlreadySettledError,
    DebtNotFoundError,
    ExpenseNotFoundError,
    ExpenseServiceError,
    OverpaymentError,
    SplitValidationError,
    UserNotFoundError,
    create_expense,
    get_net_debts,
    get_user_debts,
    settle_debt,
    simplify_debts,
)
from app.schemas.expenses import (
    ExpenseCreate,
    ExpenseRead,
    NetDebtGraph,
    SettlementCreate,
    SettlementRead,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.post(
    "",
    response_model=ExpenseRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create an expense and compute splits",
)
async def create(
    body: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
) -> ExpenseRead:
    try:
        return await create_expense(db, body)
    except UserNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except SplitValidationError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
    except ExpenseServiceError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc


@router.get(
    "/debts",
    response_model=NetDebtGraph,
    summary="Get all outstanding net debts",
)
async def all_debts(
    currency: str = Query(default="INR", min_length=3, max_length=3),
    db: AsyncSession = Depends(get_db),
) -> NetDebtGraph:
    return await get_net_debts(db, currency.upper())


@router.get(
    "/debts/{user_id}",
    response_model=NetDebtGraph,
    summary="Get debts for a specific user",
)
async def user_debts(
    user_id: str,
    currency: str = Query(default="INR"),
    db: AsyncSession = Depends(get_db),
) -> NetDebtGraph:
    return await get_user_debts(db, user_id, currency.upper())


@router.post(
    "/debts/simplify",
    response_model=list[dict],
    summary="Return simplified (netted) transfer list for a set of users",
)
async def simplify(
    user_ids: list[str],
    currency: str = Query(default="INR"),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    transfers = await simplify_debts(db, user_ids, currency.upper())
    return [
        {"from_user": t.from_user, "to_user": t.to_user, "amount": t.amount}
        for t in transfers
    ]


@router.post(
    "/settle",
    response_model=SettlementRead,
    status_code=status.HTTP_201_CREATED,
    summary="Settle (part of) a debt",
)
async def settle(
    body: SettlementCreate,
    db: AsyncSession = Depends(get_db),
) -> SettlementRead:
    try:
        return await settle_debt(db, body)
    except DebtNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except AlreadySettledError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except OverpaymentError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
    except ExpenseServiceError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
