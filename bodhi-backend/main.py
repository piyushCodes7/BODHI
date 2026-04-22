from routers.oauth import router as oauth_router
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.openapi.docs import get_swagger_ui_html
from services.scheduler import scheduler
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.security import OAuth2PasswordBearer

# Database & Models
from database import engine, Base
import models.portfolio
import models.social  # This ensures the Social tables get registered to the Base

# Routers
from routers import auth, trade, search, prices, simulate, social, ai, notification
from routers.social import router as social_router
from routers import payments, insurance, wallets, expenses, users, subscriptions

import models.wallets
import models.expenses
import models.payments
import models.notification
import models.manual_transaction  # AI voice-logged cash transactions

# 1. Lifespan (Building the database)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Building database tables...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    print("Tables built successfully!")
    yield

# 2. CRITICAL: Create the app!
# docs_url=None disables the default CDN-dependent docs so we can serve our own
app = FastAPI(
    title="BODHI API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,   # We override this below with a custom CDN
    swagger_ui_parameters={"persistAuthorization": True}
)

@app.on_event("startup")
async def startup_event():
    # Start the background AMO processor
    scheduler.start()
    print("🤖 Trading Scheduler Started")

# 3. Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SECURITY DEFINITION ---
# This tells FastAPI how to handle the lock icon and token injection
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Custom /docs endpoint using unpkg.com CDN (works on restricted/college networks
# where the default cdn.jsdelivr.net is often blocked)
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="BODHI API - Swagger UI",
        swagger_js_url="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
        swagger_css_url="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css",
        swagger_ui_parameters={"persistAuthorization": True},
    )

# 4. NOW we attach all the routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(trade.router, prefix="/trade", tags=["Trade"])
app.include_router(search.router, prefix="/search", tags=["Search"])
app.include_router(prices.router, prefix="/price", tags=["Prices"])
app.include_router(simulate.router, prefix="/simulate", tags=["Simulate"])

# And here is your social router, safely placed AFTER the app exists!
app.include_router(social_router, prefix="/social", tags=["Social"])
app.include_router(payments.router)
app.include_router(insurance.router)
app.include_router(wallets.router)
app.include_router(expenses.router)
app.include_router(subscriptions.router)
app.include_router(oauth_router, tags=["oauth"])
app.include_router(ai.router)
app.include_router(notification.router, prefix="/notifications", tags=["Notifications"])
app.include_router(users.router, prefix="/users", tags=["Users"])

# ─── NEW: Transfers (P2P, QR, Requests, Razorpay) ───
from routers import transfers
app.include_router(transfers.router)
