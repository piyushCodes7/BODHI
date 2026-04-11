from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

# We will configure this to look for a local Postgres database named 'bodhi'
# Update 'postgres:password' with your actual local Postgres username and password later
DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/bodhi"

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

# Dependency to get the database session in your routers
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
