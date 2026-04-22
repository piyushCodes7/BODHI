from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

from database import get_db
from models.core import User
from models.manual_transaction import ManualTransaction
from services.auth_service import get_current_user, verify_password, get_password_hash

router = APIRouter()

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    current_password: str

class AccountDelete(BaseModel):
    password: str

class VerifyPasswordRequest(BaseModel):
    password: str

class UserProfile(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str]
    age: Optional[int]
    gender: Optional[str]
    has_password: bool

@router.get("/me", response_model=UserProfile)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    user_profile = UserProfile(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        age=current_user.age,
        gender=current_user.gender,
        has_password=current_user.hashed_password is not None
    )
    return user_profile

@router.put("/me", response_model=UserProfile)
async def update_my_profile(
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify current password before any changes
    if not verify_password(user_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Update failed.",
        )
    
    if user_data.full_name is not None:
        current_user.full_name = user_data.full_name
    if user_data.phone is not None:
        current_user.phone = user_data.phone
    if user_data.age is not None:
        current_user.age = user_data.age
    if user_data.gender is not None:
        current_user.gender = user_data.gender
        
    await db.commit()
    await db.refresh(current_user)
    
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        age=current_user.age,
        gender=current_user.gender,
        has_password=current_user.hashed_password is not None
    )

@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_my_account(
    data: AccountDelete,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify password before deletion
    if not verify_password(data.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Deletion cancelled.",
        )
    
    await db.delete(current_user)
    await db.commit()
    return {"message": "Account deleted successfully."}

@router.post("/verify")
async def verify_user_password(
    data: VerifyPasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """Simple endpoint to verify the current user's password."""
    if current_user.hashed_password is None:
        # OAuth user: auto-succeed because they have a valid session and no set password
        return {"success": True, "method": "oauth"}

    if not verify_password(data.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password.",
        )
    return {"success": True}


# ─────────────────────────────────────────────────────────────
# Manual Transactions (Voice-logged cash/offline transactions)
# ─────────────────────────────────────────────────────────────

class ManualTransactionCreate(BaseModel):
    merchant: str
    category: str
    amount: float
    type: str = "DEBIT"
    note: Optional[str] = None  # original transcript

class ManualTransactionRead(BaseModel):
    id: str
    merchant: str
    category: str
    amount: float
    type: str
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/transactions", response_model=ManualTransactionRead, status_code=status.HTTP_201_CREATED)
async def add_manual_transaction(
    data: ManualTransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a cash/offline transaction that was voice-logged via the AI agent."""
    tx = ManualTransaction(
        user_id=current_user.id,
        merchant=data.merchant,
        category=data.category,
        amount=data.amount,
        type=data.type,
        note=data.note,
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    return tx


@router.get("/transactions", response_model=List[ManualTransactionRead])
async def list_manual_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch all manually-logged transactions for the current user (newest first)."""
    result = await db.execute(
        select(ManualTransaction)
        .where(ManualTransaction.user_id == current_user.id)
        .order_by(ManualTransaction.created_at.desc())
    )
    return result.scalars().all()
