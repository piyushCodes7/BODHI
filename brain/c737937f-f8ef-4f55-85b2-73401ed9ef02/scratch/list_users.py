import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from dotenv import load_dotenv

# Path to backend .env
load_dotenv("/Users/harshitrana/BODHI/bodhi-backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

async def list_users():
    if not DATABASE_URL:
        print("DATABASE_URL not found")
        return
    
    # Force use of asyncpg if not specified
    url = DATABASE_URL
    if "postgresql://" in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://")
        
    engine = create_async_engine(url)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(text("SELECT email, full_name FROM users"))
            users = result.all()
            for user in users:
                print(f"User: {user[0]} ({user[1]})")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_users())
