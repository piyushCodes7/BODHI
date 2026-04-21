import asyncio
from database import AsyncSessionLocal
from models.core import User
from sqlalchemy.future import select
from services.auth_service import verify_password, create_access_token, timedelta, ACCESS_TOKEN_EXPIRE_MINUTES

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == 'test2@example.com'))
        user = result.scalar_one_or_none()
        if not user:
            print("User not found")
            return
        print("User found:", user.email)
        print("Password hashed:", user.hashed_password)
        
        is_valid = verify_password('testpassword', user.hashed_password)
        print("Is valid:", is_valid)
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        print("Token:", access_token)

asyncio.run(main())
