import os
import jwt
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Dict, Any

from database import get_db
from models.core import User, Ledger, Payment
from models.notification import Notification, NotificationType
from services.auth_service import create_access_token, oauth2_scheme, SECRET_KEY, ALGORITHM
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])

class SendNotificationRequest(BaseModel):
    user_ids: List[str] = []
    send_to_all: bool = False
    title: str
    message: str
    type: str = "INFO"

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "bodhi123")

async def get_current_admin(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "superuser":
            raise HTTPException(status_code=403, detail="Not an administrator")
        return {"username": payload.get("sub")}
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate admin credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/login")
async def admin_login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Dedicated login endpoint for administrators. Uses hardcoded/env credentials
    completely separate from the mobile app users.
    """
    if form_data.username == ADMIN_USERNAME and form_data.password == ADMIN_PASSWORD:
        access_token_expires = timedelta(minutes=60 * 24)
        access_token = create_access_token(
            data={"sub": form_data.username, "role": "superuser"}, 
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect admin username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

@router.post("/notifications/send")
async def send_admin_notification(
    req: SendNotificationRequest,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    Send a notification to specific users or broadcast to all users.
    """
    if req.send_to_all:
        users_result = await db.execute(select(User.id))
        target_ids = users_result.scalars().all()
    else:
        target_ids = req.user_ids

    if not target_ids:
        raise HTTPException(status_code=400, detail="No users selected.")

    notifications = [
        Notification(
            user_id=uid,
            title=req.title,
            message=req.message,
            type=NotificationType(req.type)
        )
        for uid in target_ids
    ]
    
    db.add_all(notifications)
    await db.commit()
    
    return {"message": f"Successfully sent notifications to {len(target_ids)} users"}

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
