from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from models.core import User
from models.portfolio import PortfolioItem, Transaction
import logging
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import update, delete
import math

logger = logging.getLogger(__name__)

# ── Indian market cost calculator ──────────────────────────────────────────
def compute_costs(trade_value: float, side: str) -> dict:
    brokerage     = min(20.0, trade_value * 0.0003)
    stt           = trade_value * (0.001 if side == "SELL" else 0.0)
    exchange_fee  = trade_value * 0.0000335
    sebi_fee      = trade_value * 0.000001
    stamp_duty    = trade_value * (0.00015 if side == "BUY" else 0.0)
    gst           = (brokerage + exchange_fee + sebi_fee) * 0.18

    total_charges = brokerage + stt + exchange_fee + sebi_fee + stamp_duty + gst

    return {
        "brokerage": round(brokerage, 4),
        "stt": round(stt, 4),
        "exchange_fee": round(exchange_fee, 4),
        "sebi_fee": round(sebi_fee, 6),
        "stamp_duty": round(stamp_duty, 4),
        "gst": round(gst, 4),
        "total": round(total_charges, 4),
    }

# ── Async Trade Execution ────────────────────────────────────────────────
async def execute_buy(db, user_id, symbol, amount_inr, current_price, is_market_open):
    # 1. Fetch the user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    # Calculate quantity
    qty = int(amount_inr / current_price)
    total_cost = qty * current_price

    if qty <= 0:
        return {"error": "Amount too low to buy even 1 share."}
    # 🔥 Handle potential NoneType by defaulting to 0.0
    current_balance = user.paper_balance if user.paper_balance is not None else 0.0

    if current_balance < total_cost:
        raise HTTPException(status_code=400, detail="Insufficient paper balance")

    # 2. Block the funds (We do this immediately so they can't double-spend overnight)
    user.paper_balance -= total_cost

    if is_market_open:
        # 🟢 MARKET IS OPEN: Execute Immediately
        # Add to Portfolio logic...
        portfolio_result = await db.execute(
            select(PortfolioItem).where(PortfolioItem.user_id == user_id, PortfolioItem.symbol == symbol)
        )
        holding = portfolio_result.scalars().first()
        
        if holding:
            old_total = holding.quantity * holding.average_buy_price
            holding.quantity += qty
            holding.average_buy_price = (old_total + total_cost) / holding.quantity
        else:
            new_holding = PortfolioItem(user_id=user_id, symbol=symbol, quantity=qty, average_buy_price=current_price)
            db.add(new_holding)

        txn_status = "EXECUTED"
        msg = f"Successfully bought {qty} shares of {symbol}."
        
    else:
        # 🌙 MARKET IS CLOSED: Send to AMO Waiting Room
        # Note: We already blocked their cash above, but we DO NOT add the stock to their portfolio yet!
        txn_status = "PENDING_AMO"
        msg = "Market is closed. Your order is placed as an AMO and will execute at 9:15 AM."

    # 3. Record the Transaction
    new_txn = Transaction(
        user_id=user_id,
        type="BUY",
        symbol=symbol,
        quantity=qty,
        price=current_price,
        total_value=total_cost,
        status=txn_status  # <-- Save the status!
    )
    db.add(new_txn)
    
    await db.commit()
    return {"status": "success", "message": msg, "order_status": txn_status}

async def execute_sell(db, user_id, symbol, amount_inr, current_price, is_market_open):
    # 1. Fetch the user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    # Calculate quantity
    qty = int(amount_inr / current_price)
    total_cost = qty * current_price

    if qty <= 0:
        return {"error": "Amount too low to buy even 1 share."}
    if user.paper_balance < total_cost:
        return {"error": "Insufficient virtual funds."}

    # 2. Block the funds (We do this immediately so they can't double-spend overnight)
    user.paper_balance -= total_cost

    if is_market_open:
        # 🟢 MARKET IS OPEN: Execute Immediately
        # Add to Portfolio logic...
        portfolio_result = await db.execute(
            select(PortfolioItem).where(PortfolioItem.user_id == user_id, PortfolioItem.symbol == symbol)
        )
        holding = portfolio_result.scalars().first()
        
        if holding:
            old_total = holding.quantity * holding.average_buy_price
            holding.quantity += qty
            holding.average_buy_price = (old_total + total_cost) / holding.quantity
        else:
            new_holding = PortfolioItem(user_id=user_id, symbol=symbol, quantity=qty, average_buy_price=current_price)
            db.add(new_holding)

        txn_status = "EXECUTED"
        msg = f"Successfully bought {qty} shares of {symbol}."
        
    else:
        # 🌙 MARKET IS CLOSED: Send to AMO Waiting Room
        # Note: We already blocked their cash above, but we DO NOT add the stock to their portfolio yet!
        txn_status = "PENDING_AMO"
        msg = "Market is closed. Your order is placed as an AMO and will execute at 9:15 AM."

    # 3. Record the Transaction
    new_txn = Transaction(
        user_id=user_id,
        type="BUY",
        symbol=symbol,
        quantity=qty,
        price=current_price,
        total_value=total_cost,
        status=txn_status  # <-- Save the status!
    )
    db.add(new_txn)
    
    await db.commit()
    return {"status": "success", "message": msg, "order_status": txn_status}

async def reset_portfolio_db(db: AsyncSession, user_id: str):
    try:
        # 1. Reset balance to 1 Lakh
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(paper_balance=100000.0)
        )
        
        # 2. Delete all holdings (PortfolioItems)
        await db.execute(
            delete(PortfolioItem).where(PortfolioItem.user_id == user_id)
        )
        
        # 3. Delete all trade history (Transactions)
        # Note: Ensure the class name matches your model (e.g., Transaction or TradeTransaction)
        await db.execute(
            delete(Transaction).where(Transaction.user_id == user_id)
        )

        # 4. Commit the changes
        await db.commit()
        print(f"✅ Portfolio reset successful for {user_id}")
        return True
        
    except Exception as e:
        await db.rollback() # 🟢 Must await the rollback now!
        print(f"❌ Reset Database Error: {e}")
        return False