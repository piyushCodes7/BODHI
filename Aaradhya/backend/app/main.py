"""
/app/main.py
Bodhi — FastAPI application entrypoint. All routers registered here.
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import create_all_tables
from app.payments.router import router as payments_router
from app.api.wallet_router import router as wallet_router
from app.api.expense_router import router as expense_router
from app.api.insurance_router import router as insurance_router
from app.api.bootstrap_router import router as bootstrap_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(
    title="Bodhi",
    description="Gen Z fintech super app — backend API",
    version="0.3.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
app.include_router(payments_router, prefix=API_PREFIX)
app.include_router(wallet_router, prefix=API_PREFIX)
app.include_router(expense_router, prefix=API_PREFIX)
app.include_router(insurance_router, prefix=API_PREFIX)
app.include_router(bootstrap_router, prefix=API_PREFIX)


@app.on_event("startup")
async def on_startup() -> None:
    import app.models.core      # noqa: F401
    import app.models.wallets   # noqa: F401
    import app.models.expenses  # noqa: F401
    await create_all_tables()


@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "bodhi", "version": "0.3.0"}
