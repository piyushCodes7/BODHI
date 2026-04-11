from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Database & Routers
from database import engine, Base
import models.portfolio
from routers import auth, trade, search, prices, simulate

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        print("Building database tables...")
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="BODHI API",
    version="1.0.0",
    lifespan=lifespan,
    # This adds the global lock icon to the UI
    swagger_ui_parameters={"persistAuthorization": True} 
)

# --- SECURITY DEFINITION ---
# This tells FastAPI how to handle the lock icon and token injection
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- ROUTERS ---

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(trade.router, prefix="/trade", tags=["Trade"])
app.include_router(search.router, prefix="/search", tags=["Search"])
app.include_router(prices.router, prefix="/price", tags=["Prices"])
app.include_router(simulate.router, prefix="/simulate", tags=["Simulate"])