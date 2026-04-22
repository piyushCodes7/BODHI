from routers.oauth import router as oauth_router
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.openapi.docs import get_swagger_ui_html
from services.scheduler import scheduler
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.security import OAuth2PasswordBearer
import asyncio
import logging

logger = logging.getLogger(__name__)

# Database & Models
from database import engine, Base
import models.portfolio
import models.social  # This ensures the Social tables get registered to the Base

# Routers
from routers import auth, trade, search, prices, simulate, social, ai, notification
from routers.social import router as social_router
from routers import payments, insurance, wallets, expenses, users, subscriptions
from routers import transfers

import models.wallets
import models.expenses
import models.payments
import models.notification
import models.manual_transaction  # AI voice-logged cash transactions


# ── Background DB init (non-blocking) ──────────────────────────────────────────
# We run table creation as a fire-and-forget background task so the app
# is immediately available to serve health checks. This prevents 502 errors
# during Elastic Beanstalk cold starts when RDS is slow to accept connections.
async def init_db():
    try:
        logger.info("⏳ Running DB table sync in background…")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ DB tables synced successfully.")
    except Exception as e:
        logger.error(f"❌ DB init failed (app will still serve): {e}")


# 1. Lifespan – non-blocking startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fire DB sync as background task so startup doesn't block on RDS
    asyncio.create_task(init_db())

    # Start the APScheduler
    try:
        scheduler.start()
        logger.info("🤖 Trading Scheduler Started")
    except Exception as e:
        logger.warning(f"⚠️ Scheduler failed to start: {e}")

    yield  # App is now running and serving requests

    # Shutdown
    try:
        scheduler.shutdown(wait=False)
    except Exception:
        pass


# 2. CRITICAL: Create the app!
# docs_url=None disables the default CDN-dependent docs so we can serve our own
app = FastAPI(
    title="BODHI API",
    version="1.0.0",
    description="BODHI Fintech Super App – Backend API",
    lifespan=lifespan,
    docs_url=None,   # We override below with a CDN that works on restricted networks
    openapi_url="/openapi.json",
    redoc_url="/redoc",
    swagger_ui_parameters={"persistAuthorization": True},
)

# 3. Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SECURITY DEFINITION ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Custom /docs endpoint using unpkg.com CDN
# (works on restricted/college networks where cdn.jsdelivr.net is often blocked)
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="BODHI API – Swagger UI",
        swagger_js_url="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
        swagger_css_url="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css",
        swagger_ui_parameters={"persistAuthorization": True},
    )

# Health check – always responds immediately, even before DB is ready
@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "BODHI API", "version": "1.0.0"}

# 4. Attach all routers
app.include_router(auth.router,         prefix="/auth",          tags=["Authentication"])
app.include_router(trade.router,        prefix="/trade",         tags=["Trade"])
app.include_router(search.router,       prefix="/search",        tags=["Search"])
app.include_router(prices.router,       prefix="/price",         tags=["Prices"])
app.include_router(simulate.router,     prefix="/simulate",      tags=["Simulate"])
app.include_router(social_router,       prefix="/social",        tags=["Social"])
app.include_router(payments.router)
app.include_router(insurance.router)
app.include_router(wallets.router)
app.include_router(expenses.router)
app.include_router(subscriptions.router)
app.include_router(oauth_router,                                 tags=["OAuth"])
app.include_router(ai.router)
app.include_router(notification.router, prefix="/notifications", tags=["Notifications"])
app.include_router(users.router,        prefix="/users",         tags=["Users"])
app.include_router(transfers.router)
