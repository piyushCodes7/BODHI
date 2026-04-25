import asyncio
import os
import sys
from sqlalchemy import text
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Setup hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    """Manual script to create the first root administrator in the BODHI system."""
    
    # 1. Configuration
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ Error: DATABASE_URL environment variable is not set.")
        return

    print("🛡️ BODHI Root Admin Creation")
    print("-" * 30)

    try:
        email = input("Enter Admin Email: ").strip()
        password = input("Enter Admin Password: ").strip()
        full_name = input("Enter Full Name: ").strip()

        if not email or not password:
            print("❌ Error: Email and password are required.")
            return

        # 2. Hash Password
        hashed_password = pwd_context.hash(password)

        # 3. Connect and Insert
        engine = create_async_engine(db_url)
        AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with AsyncSessionLocal() as session:
            # Check if user exists
            from sqlalchemy import select
            # Note: We use raw text or import User. Importing User might require setting up PYTHONPATH.
            # To keep this script simple and standalone, we'll use a raw insert.
            
            check_sql = text("SELECT id FROM users WHERE email = :email")
            result = await session.execute(check_sql, {"email": email})
            if result.fetchone():
                print(f"⚠️ User with email {email} already exists. Update their role to 'admin' manually in psql.")
                return

            insert_sql = text("""
                INSERT INTO users (id, email, full_name, hashed_password, role, is_active, is_verified, created_at, updated_at)
                VALUES (gen_random_uuid(), :email, :full_name, :password, 'admin', true, true, now(), now())
            """)
            
            await session.execute(insert_sql, {
                "email": email,
                "full_name": full_name,
                "password": hashed_password
            })
            await session.commit()
            
        print(f"✅ Successfully created Admin: {email}")
        print("-" * 30)
        print("You can now login at /static/admin/login.html")

    except Exception as e:
        print(f"❌ Failed to create admin: {e}")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(create_admin())
