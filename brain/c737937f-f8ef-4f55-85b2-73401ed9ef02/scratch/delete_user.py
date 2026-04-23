import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv("/Users/harshitrana/BODHI/bodhi-backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

async def delete_user(email):
    if not DATABASE_URL:
        print("DATABASE_URL not found")
        return
    
    url = DATABASE_URL
    if "postgresql://" in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://")
        
    engine = create_async_engine(url)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        try:
            # Delete related data first to avoid FK constraints
            # (Ledger, Payments, Transactions, etc.)
            
            # Find user ID first
            result = await session.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
            user = result.one_or_none()
            if not user:
                print(f"User {email} not found")
                return
            
            user_id = user[0]
            print(f"Deleting user {email} (ID: {user_id})...")
            
            # Delete in order of dependencies
            await session.execute(text("DELETE FROM ledger WHERE user_id = :uid"), {"uid": user_id})
            await session.execute(text("DELETE FROM payments WHERE user_id = :uid"), {"uid": user_id})
            await session.execute(text("DELETE FROM user_subscriptions WHERE user_id = :uid"), {"uid": user_id})
            await session.execute(text("DELETE FROM manual_transactions WHERE user_id = :uid"), {"uid": user_id})
            await session.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user_id})
            
            await session.commit()
            print("Successfully deleted account and all associated data.")
        except Exception as e:
            await session.rollback()
            print(f"Error: {e}")
        finally:
            await engine.dispose()

if __name__ == "__main__":
    email_to_delete = "sharmapiyush74860@gmail.com"
    asyncio.run(delete_user(email_to_delete))
