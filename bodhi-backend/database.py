from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "")

try:
    if DATABASE_URL:
        engine = create_async_engine(DATABASE_URL, echo=True, pool_pre_ping=True)
        AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    else:
        print("⚠️ WARNING: DATABASE_URL is missing!")
        engine = None
        AsyncSessionLocal = None
except Exception as e:
    print(f"❌ Failed to create engine: {e}")
    engine = None
    AsyncSessionLocal = None

Base = declarative_base()

# Dependency to get the database session in your routers
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
