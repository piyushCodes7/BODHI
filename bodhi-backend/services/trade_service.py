from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from models.core import User
from models.portfolio import PortfolioItem, Transaction
import logging

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
async def execute_buy(db: AsyncSession, user_id: int, symbol: str, amount_inr: float, live_price: float) -> dict:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        return {"error": "User not found"}

    quantity = int(amount_inr / live_price)
    if quantity < 1:
        return {"error": f"Amount ₹{amount_inr:.0f} is less than one share price ₹{live_price:.2f}"}

    trade_value = quantity * live_price
    costs = compute_costs(trade_value, "BUY")
    total_debit = trade_value + costs["total"]

    if total_debit > user.balance:
        return {"error": f"Insufficient funds. Need ₹{total_debit:.2f}, have ₹{user.balance:.2f}"}

    user.balance = round(user.balance - total_debit, 4)

    result = await db.execute(select(PortfolioItem).where(PortfolioItem.user_id == user_id, PortfolioItem.symbol == symbol))
    portfolio_item = result.scalar_one_or_none()

    if portfolio_item:
        new_qty = portfolio_item.quantity + quantity
        new_avg = ((portfolio_item.quantity * portfolio_item.average_buy_price) + trade_value) / new_qty
        portfolio_item.quantity = new_qty
        portfolio_item.average_buy_price = round(new_avg, 4)
    else:
        portfolio_item = PortfolioItem(user_id=user_id, symbol=symbol, quantity=quantity, average_buy_price=round(live_price, 4))
        db.add(portfolio_item)

    transaction = Transaction(
        user_id=user_id, type="BUY", symbol=symbol, quantity=quantity, 
        price=live_price, total_value=round(total_debit, 2)
    )
    db.add(transaction)
    
    await db.commit()
    return {"success": True, "remaining_cash": user.balance, "quantity_bought": quantity}

async def execute_sell(db: AsyncSession, user_id: int, symbol: str, quantity: int, live_price: float) -> dict:
    result = await db.execute(select(PortfolioItem).where(PortfolioItem.user_id == user_id, PortfolioItem.symbol == symbol))
    portfolio_item = result.scalar_one_or_none()

    if not portfolio_item or portfolio_item.quantity < quantity:
        held = portfolio_item.quantity if portfolio_item else 0
        return {"error": f"You only hold {held} shares of {symbol}"}

    trade_value = quantity * live_price
    costs = compute_costs(trade_value, "SELL")
    net_credit = trade_value - costs["total"]

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one()
    user.balance = round(user.balance + net_credit, 4)

    portfolio_item.quantity -= quantity
    if portfolio_item.quantity == 0:
        await db.delete(portfolio_item)

    transaction = Transaction(
        user_id=user_id, type="SELL", symbol=symbol, quantity=quantity, 
        price=live_price, total_value=round(net_credit, 2)
    )
    db.add(transaction)
    
    await db.commit()
    return {"success": True, "remaining_cash": user.balance, "net_credit": net_credit}

async def reset_portfolio_db(db: AsyncSession, user_id: int):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        user.balance = 100000.0

    await db.execute(delete(PortfolioItem).where(PortfolioItem.user_id == user_id))
    await db.execute(delete(Transaction).where(Transaction.user_id == user_id))
    
    await db.commit()
    return {"success": True, "message": "Portfolio reset to ₹1,00,000"}