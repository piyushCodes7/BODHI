from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr

from database import get_db
from models.core import User
from services.auth_service import get_password_hash, verify_password, create_access_token, timedelta, ACCESS_TOKEN_EXPIRE_MINUTES
from services.auth_service import send_otp_email

router = APIRouter()

class UserCreate(BaseModel):
    email: EmailStr      
    password: str
    full_name: str
    phone_number: str

class PasswordResetRequest(BaseModel):
    email: EmailStr


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already registered")
        
    # Create new user with ₹1,00,000 starting balance
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            phone=user_data.phone_number,
            hashed_password=get_password_hash(user_data.password) # Keep your existing password hash logic
        )
    
    db.add(new_user)
    await db.commit()
    return {"message": "User created successfully. Please log in."}

# Note: OAuth2PasswordRequestForm expects form data (username & password), not JSON!
@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # Find user
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    # Verify user and password
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Generate JWT Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "full_name": user.full_name,
    }

import random
from datetime import datetime, timezone

@router.post("/forgot-password")
async def request_password_reset(request: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if user:
        otp = str(random.randint(100000, 999999))
        user.reset_otp = otp
        user.reset_otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=15)
        await db.commit()
        
        # 🚀 FIRE THE REAL EMAIL
        send_otp_email(user.email, otp)
    
    return {"message": "If that account exists, a reset code has been sent."}

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

@router.post("/reset-password")
async def confirm_password_reset(request: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    # 1. Find the user
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # 2. Check if OTP exists and matches
    if not user.reset_otp or user.reset_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid reset code")
        
    # 3. Check if OTP has expired
    if user.reset_otp_expiry and datetime.now(timezone.utc) > user.reset_otp_expiry:
        raise HTTPException(status_code=400, detail="Reset code has expired")
        
    # 4. Update password and clear OTP fields
    user.hashed_password = get_password_hash(request.new_password)
    user.reset_otp = None
    user.reset_otp_expiry = None
    
    await db.commit()
    return {"message": "Password updated successfully"}