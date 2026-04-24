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
from models.core import User, Ledger, Payment, AdminUser
from models.notification import Notification, NotificationType
from services.auth_service import create_access_token, oauth2_scheme, SECRET_KEY, ALGORITHM, pwd_context, get_password_hash
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/admin", tags=["Admin"])

class SendNotificationRequest(BaseModel):
    user_ids: List[str] = []
    send_to_all: bool = False
    title: str
    message: str
    type: str = "INFO"

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
async def admin_login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """
    Login endpoint for administrators. Strictly verifies against the AdminUser
    database table (all hardcoded passwords have been removed).
    """
    result = await db.execute(select(AdminUser).where(AdminUser.email == form_data.username))
    db_admin = result.scalar_one_or_none()
    
    # Do not allow login for 'pending' un-setup accounts
    if db_admin and db_admin.hashed_password != "pending" and pwd_context.verify(form_data.password, db_admin.hashed_password):
        access_token_expires = timedelta(minutes=60 * 24)
        access_token = create_access_token(
            data={"sub": db_admin.email, "role": "superuser"}, 
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect admin username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

class BootstrapRequest(BaseModel):
    emails: List[EmailStr]

@router.post("/bootstrap")
async def bootstrap_admins(req: BootstrapRequest, db: AsyncSession = Depends(get_db)):
    """
    One-time system initialization. Creates the initial admin accounts without 
    passwords and returns setup links.
    """
    result = await db.execute(select(func.count(AdminUser.id)))
    count = result.scalar()
    
    if count > 0:
        raise HTTPException(status_code=403, detail="System already bootstrapped. Use standard invite or forgot-password flows.")
    
    links = []
    for email in req.emails:
        new_admin = AdminUser(
            email=email,
            full_name=email.split("@")[0],
            hashed_password="pending",
            is_superadmin=True
        )
        db.add(new_admin)
        
        invite_token = create_access_token(
            data={"sub": email, "name": new_admin.full_name, "intent": "admin_setup"}, 
            expires_delta=timedelta(days=7)
        )
        links.append({"email": email, "setup_link": f"/admin-panel?setup_token={invite_token}"})
    
    await db.commit()
    return {
        "message": "Bootstrap successful. Discard all git/env credentials. Use these links to set passwords privately.",
        "links": links
    }

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AdminUser).where(AdminUser.email == req.email))
    admin = result.scalar_one_or_none()
    
    if not admin:
        return {"message": "If that email is registered, a reset link will be available soon.", "reset_link": None}
        
    reset_token = create_access_token(
        data={"sub": admin.email, "name": admin.full_name, "intent": "admin_reset"}, 
        expires_delta=timedelta(hours=2)
    )
    
    return {
        "message": "Reset request accepted.", 
        "reset_link": f"/admin-panel?setup_token={reset_token}"
    }

    result = await db.execute(select(AdminUser).where(AdminUser.email == form_data.username))
    db_admin = result.scalar_one_or_none()
    
    if db_admin and pwd_context.verify(form_data.password, db_admin.hashed_password):
        access_token_expires = timedelta(minutes=60 * 24)
        access_token = create_access_token(
            data={"sub": db_admin.email, "role": "superuser"}, 
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect admin username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

class InviteAdminRequest(BaseModel):
    email: EmailStr
    full_name: str

@router.post("/invite")
async def invite_admin(
    req: InviteAdminRequest,
    admin: dict = Depends(get_current_admin)
):
    """
    Generates a secure registration link for a new admin.
    """
    invite_token = create_access_token(
        data={"sub": req.email, "name": req.full_name, "intent": "admin_setup"}, 
        expires_delta=timedelta(days=3)
    )
    
    # In a real production system with configured SMTP, we would call send_email here.
    # For now, we return the secure setup link so the Master Admin can share it privately.
    setup_url = f"/admin-panel?setup_token={invite_token}"
    return {"message": "Invite generated successfully.", "setup_url": setup_url}

class SetupAdminRequest(BaseModel):
    token: str
    password: str

@router.post("/setup")
async def setup_admin(
    req: SetupAdminRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Consumes an invite token and creates the admin user account.
    """
    try:
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=[ALGORITHM])
        intent = payload.get("intent")
        if intent not in ["admin_setup", "admin_reset"]:
            raise HTTPException(status_code=400, detail="Invalid token intent")
            
        email = payload.get("sub")
        full_name = payload.get("name")
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    result = await db.execute(select(AdminUser).where(AdminUser.email == email))
    db_admin = result.scalar_one_or_none()
    
    hashed_pwd = get_password_hash(req.password)
    
    if db_admin:
        if intent == "admin_setup" and db_admin.hashed_password != "pending":
            raise HTTPException(status_code=400, detail="This admin account is already set up.")
        db_admin.hashed_password = hashed_pwd
    else:
        new_admin = AdminUser(
            email=email,
            full_name=full_name,
            hashed_password=hashed_pwd
        )
        db.add(new_admin)
        
    await db.commit()
    
    return {"message": "Admin account credentials successfully updated. You can now log in."}

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
