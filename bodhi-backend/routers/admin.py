import os
import jwt
from datetime import timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Dict, Any

from database import get_db
from models.core import User, Ledger, Payment, AdminUser
from models.notification import Notification, NotificationType
from services.auth_service import (
    create_access_token, oauth2_scheme, SECRET_KEY, ALGORITHM, pwd_context, get_password_hash,
    SENDER_EMAIL, SENDER_PASSWORD, SMTP_SERVER, SMTP_PORT
)
from pydantic import BaseModel, EmailStr

def dispatch_admin_email(to_email: str, subject: str, html_body: str):
    """Sends authentic branded emails directly to admin accounts routing setup links."""
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print(f"Warning: SMTP credentials missing in .env! Simulated dispatch to {to_email}")
        return
        
    msg = MIMEMultipart()
    msg['From'] = f"BODHI Administrative System <{SENDER_EMAIL}>"
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_body, 'html'))
    
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"✅ Auth Mail dispatched to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send auth mail to {to_email}: {e}")

router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_INVITE_CODE = os.getenv("ADMIN_INVITE_CODE", "dkeftc@938(*/")

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

@router.get("/status")
async def get_system_status(db: AsyncSession = Depends(get_db)):
    """Public endpoint to check if the administration system is initialized."""
    result = await db.execute(select(func.count(AdminUser.id)))
    return {"bootstrapped": result.scalar() > 0}

class BootstrapRequest(BaseModel):
    emails: List[EmailStr]
    secret_code: str

@router.post("/bootstrap")
async def bootstrap_admins(req: BootstrapRequest, db: AsyncSession = Depends(get_db)):
    """
    One-time system initialization. Creates the initial admin accounts without 
    passwords and returns setup links.
    """
    if req.secret_code != ADMIN_INVITE_CODE:
        raise HTTPException(status_code=403, detail="Invalid Master Verification Passcode.")
        
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
        base_domain = os.getenv("API_BASE_URL", "http://bodhi-env.eba-at8qpmww.ap-south-1.elasticbeanstalk.com")
        setup_url = f"{base_domain}/admin-panel?setup_token={invite_token}"
        links.append({"email": email, "setup_link": setup_url})
        
        dispatch_admin_email(
            to_email=email,
            subject="BODHI Admin: System Initialization Access",
            html_body=f"<h3>Welcome to BODHI</h3><p>You have been assigned root master privileges. Please setup your password to secure your account:</p><p><a href='{setup_url}'><b>Set My Password</b></a></p>"
        )
    
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
    
    base_domain = os.getenv("API_BASE_URL", "http://bodhi-env.eba-at8qpmww.ap-south-1.elasticbeanstalk.com")
    reset_url = f"{base_domain}/admin-panel?setup_token={reset_token}"
    
    dispatch_admin_email(
        to_email=admin.email,
        subject="BODHI Admin: Password Reset Requested",
        html_body=f"<h3>Password Recovery</h3><p>A request was made to edit your administrative password. If this was you, please click the secure link below to change it. This link permanently expires in 2 hours.</p><p><a href='{reset_url}'><b>Reset My Password</b></a></p>"
    )
    
    return {
        "message": "Reset request accepted.", 
        "reset_link": reset_url
    }

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
    
    base_domain = os.getenv("API_BASE_URL", "http://bodhi-env.eba-at8qpmww.ap-south-1.elasticbeanstalk.com")
    setup_url = f"{base_domain}/admin-panel?setup_token={invite_token}"
    
    dispatch_admin_email(
        to_email=req.email,
        subject="BODHI Admin: Exclusive Team Invitation",
        html_body=f"<h3>You have been invited to BODHI Admin!</h3><p>{admin.get('username', 'An administrator')} has invited you to help manage the platform.</p><p>Please accept your invitation and create your password securely below:</p><p><a href='{setup_url}'><b>Accept Invitation</b></a></p>"
    )
    
    return {"message": "Invite authenticated and emailed successfully.", "setup_url": setup_url}

class SetupAdminRequest(BaseModel):
    token: str
    password: str
    secret_code: str

@router.post("/setup")
async def setup_admin(
    req: SetupAdminRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Consumes an invite token and creates the admin user account.
    """
    if req.secret_code != ADMIN_INVITE_CODE:
        raise HTTPException(status_code=403, detail="Invalid Master Verification Passcode.")
        
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
