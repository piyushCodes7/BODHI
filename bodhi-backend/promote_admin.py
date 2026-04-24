import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from models.core import User

# Use the same connection string logic as database.py
DATABASE_URL = "sqlite+aiosqlite:///./bodhi.db"
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def promote_user(email: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            user.is_admin = True
            await session.commit()
            print(f"✅ User {email} has been promoted to Admin.")
        else:
            print(f"❌ User {email} not found.")

if __name__ == "__main__":
    email = "sharmapiyush74860@gmail.com"
    asyncio.run(promote_user(email))
