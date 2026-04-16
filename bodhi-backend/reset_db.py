import asyncio
from sqlalchemy import text
from database import engine
from models.core import Base

async def reset_database():
    async with engine.begin() as conn:
        print("☢️  Nuking all ghost tables (CASCADE DROP)...")
        # This completely wipes the database clean, ignoring dependencies
        await conn.execute(text("DROP SCHEMA public CASCADE;"))
        await conn.execute(text("CREATE SCHEMA public;"))
        
        print("✨ Building fresh tables from your new models...")
        # Now we safely rebuild only the tables that actually exist in your code
        await conn.run_sync(Base.metadata.create_all)
        
    print("✅ Database perfectly wiped and synced!")

if __name__ == "__main__":
    asyncio.run(reset_database())