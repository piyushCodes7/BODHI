from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import AsyncSessionLocal # Import your DB session maker
from models.portfolio import Transaction, PortfolioItem
from services.yfinance_service import get_live_price

scheduler = AsyncIOScheduler()

async def process_morning_amos():
    print("🌅 Market Open! Processing After Market Orders (AMOs)...")
    
    async with AsyncSessionLocal() as db:
        # 1. Find all pending orders
        result = await db.execute(select(Transaction).where(Transaction.status == "PENDING_AMO"))
        pending_orders = result.scalars().all()
        
        for order in pending_orders:
            try:
                # 2. Get the new opening price!
                price_data = await get_live_price(order.symbol)
                new_open_price = price_data["price"]
                
                # Note: In a highly advanced system, you'd check if they still have enough 
                # blocked cash for the new price if it gapped up. For now, we will just execute it.
                
                if order.type == "BUY":
                    # Add to portfolio
                    port_res = await db.execute(
                        select(PortfolioItem).where(PortfolioItem.user_id == order.user_id, PortfolioItem.symbol == order.symbol)
                    )
                    holding = port_res.scalars().first()
                    
                    if holding:
                        old_total = holding.quantity * holding.average_buy_price
                        new_cost = order.quantity * new_open_price
                        holding.quantity += order.quantity
                        holding.average_buy_price = (old_total + new_cost) / holding.quantity
                    else:
                        new_holding = PortfolioItem(
                            user_id=order.user_id, 
                            symbol=order.symbol, 
                            quantity=order.quantity, 
                            average_buy_price=new_open_price
                        )
                        db.add(new_holding)

                # 3. Mark as Executed
                order.status = "EXECUTED"
                # Update the transaction price to the actual execution price
                order.price = new_open_price 
                order.total_value = order.quantity * new_open_price
                
            except Exception as e:
                print(f"Failed to execute AMO for {order.symbol}: {e}")
                
        await db.commit()
        print(f"✅ Processed {len(pending_orders)} AMOs.")

# Schedule the job to run Monday through Friday at exactly 9:15 AM
scheduler.add_job(process_morning_amos, 'cron', day_of_week='mon-fri', hour=9, minute=15)