from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from pydantic import BaseModel, Field

from database import get_db
from models.portfolio import User, PortfolioItem, Transaction

# Our new real services!
from services.trade_service import execute_buy, execute_sell, compute_costs, reset_portfolio_db
from services.auth_service import get_current_user
from services.yfinance_service import get_live_price
from services.market_hours import market_status

router = APIRouter()

class BuyRequest(BaseModel):
    symbol: str = Field(..., example="RELIANCE.NS")
    amount_inr: float = Field(..., gt=0)

class SellRequest(BaseModel):
    symbol: str = Field(..., example="RELIANCE.NS")
    quantity: int = Field(..., gt=0)


@router.post("/buy")
async def buy_stock(
    req: BuyRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒 Requires Login
):
    status = market_status()
    
    try:
        price_data = await get_live_price(req.symbol)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch live price for {req.symbol}")
    
    # We now pass current_user.id instead of a hardcoded '1'
    result = await execute_buy(db, current_user.id, req.symbol.upper(), req.amount_inr, price_data["price"])
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    result["market_status"] = status
    return result


@router.post("/sell")
async def sell_stock(
    req: SellRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒 Requires Login
):
    status = market_status()
    
    try:
        price_data = await get_live_price(req.symbol)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch live price for {req.symbol}")
    
    result = await execute_sell(db, current_user.id, req.symbol.upper(), req.quantity, price_data["price"])
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    result["market_status"] = status
    return result


@router.get("/portfolio")
async def get_portfolio_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒 Requires Login
):
    # Fetch all holdings for the logged-in user
    result = await db.execute(select(PortfolioItem).where(PortfolioItem.user_id == current_user.id))
    holdings = result.scalars().all()
    
    total_value = current_user.balance
    holdings_detail = []

    for holding in holdings:
        # Try to get the live price, if yfinance fails, fallback to average buy price
        try:
            price_data = await get_live_price(holding.symbol)
            live_price = price_data["price"]
            day_change_pct = price_data.get("change_pct", 0)
        except Exception:
            live_price = holding.average_buy_price
            day_change_pct = 0.0
        
        current_value = holding.quantity * live_price
        invested_value = holding.quantity * holding.average_buy_price
        pnl = current_value - invested_value
        pnl_pct = round((pnl / invested_value) * 100, 2) if invested_value else 0
        
        total_value += current_value
        
        holdings_detail.append({
            "symbol": holding.symbol,
            "qty": holding.quantity,
            "avg_price": round(holding.average_buy_price, 2),
            "live_price": round(live_price, 2),
            "current_value": round(current_value, 2),
            "invested_value": round(invested_value, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": pnl_pct,
            "day_change_pct": day_change_pct
        })

    total_pnl = round(total_value - 100000.0, 2)
    
    return {
        "username": current_user.username,
        "cash": round(current_user.balance, 2),
        "total_value": round(total_value, 2),
        "total_pnl": total_pnl,
        "holdings": holdings_detail,
        "market_status": market_status()
    }


@router.get("/history")
async def transaction_history(
    limit: int = Query(50), 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒 Requires Login
):
    result = await db.execute(
        select(Transaction).where(Transaction.user_id == current_user.id).order_by(desc(Transaction.timestamp)).limit(limit)
    )
    txns = result.scalars().all()
    return {"transactions": txns}


@router.post("/reset")
async def reset(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒 Requires Login
):
    return await reset_portfolio_db(db, current_user.id)


@router.get("/costs-preview")
async def costs_preview(
    symbol: str = Query(...), 
    amount_inr: float = Query(...), 
    side: str = Query("BUY"),
    current_user: User = Depends(get_current_user)  # 🔒 Requires Login
):
    try:
        price_data = await get_live_price(symbol)
        live_price = price_data["price"]
    except Exception:
        raise HTTPException(status_code=502, detail=f"Could not fetch price for {symbol}")
    
    qty = int(amount_inr / live_price)
    trade_value = qty * live_price
    costs = compute_costs(trade_value, side.upper())
    
    net = trade_value + costs["total"] if side.upper() == "BUY" else trade_value - costs["total"]

    return {
        "symbol": symbol.upper(),
        "live_price": live_price,
        "quantity": qty,
        "trade_value": round(trade_value, 2),
        "costs": costs,
        "net_amount": round(net, 2),
        "market_status": market_status()
    }