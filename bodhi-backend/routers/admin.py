from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Dict, Any

from database import get_db
from models.core import User, Ledger, Payment
from services.auth_service import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])

async def get_current_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have administrative privileges."
        )
    return current_user

@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Returns high-level statistics for the admin dashboard.
    """
    # Total Users
    users_count_result = await db.execute(select(func.count(User.id)))
    total_users = users_count_result.scalar()

    # Total Balance across all users
    balance_sum_result = await db.execute(select(func.sum(User.balance)))
    total_balance = balance_sum_result.scalar() or 0.0

    # Total Transactions
    tx_count_result = await db.execute(select(func.count(Ledger.id)))
    total_transactions = tx_count_result.scalar()

    return {
        "total_users": total_users,
        "total_balance_pool": total_balance,
        "total_transactions": total_transactions,
        "currency": "INR"
    }

@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    List users with pagination.
    """
    result = await db.execute(
        select(User)
        .order_by(User.created_at.desc())
        .offset(skip).limit(limit)
    )
    users = result.scalars().all()
    
    return [
        {
            "id": u.id,
            "email": u.email,
            "phone": u.phone,
            "full_name": u.full_name,
            "balance": u.balance,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "is_admin": u.is_admin,
            "created_at": u.created_at
        } for u in users
    ]

@router.get("/transactions")
async def list_transactions(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    List global ledger transactions.
    """
    result = await db.execute(
        select(Ledger)
        .order_by(Ledger.created_at.desc())
        .offset(skip).limit(limit)
    )
    txs = result.scalars().all()
    
    return [
        {
            "id": t.id,
            "user_id": t.user_id,
            "entry_type": t.entry_type,
            "amount": t.amount / 100,  # Convert paise to INR
            "description": t.description,
            "status": t.status,
            "created_at": t.created_at
        } for t in txs
    ]

@router.post("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Enable or disable a user account.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = not user.is_active
    await db.commit()
    
    return {"status": "success", "user": user.email, "is_active": user.is_active}
