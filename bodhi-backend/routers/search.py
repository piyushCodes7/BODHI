from fastapi import APIRouter, Query, HTTPException
from services.yfinance_service import search_symbols, get_stock_info
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("")
async def search_stocks(q: str = Query("", description="Search query for NSE/BSE stocks")):
    """
    Search for NSE/BSE stocks matching the query.
    Returns symbol, name, exchange for the asset picker UI.
    If q is empty, returns the Nifty 50 list.
    """
    try:
        results = await search_symbols(query=q, max_results=10)
        return {"results": results, "query": q}
    except Exception as e:
        logger.error(f"Search endpoint error for query '{q}': {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while searching for symbols.")


@router.get("/info")
async def stock_info(symbol: str = Query(..., example="RELIANCE.NS")):
    """Full metadata: name, sector, market cap, etc."""
    try:
        info = await get_stock_info(symbol)
        return info
    except Exception as e:
        logger.error(f"stock_info failed for {symbol}: {e}")
        raise HTTPException(status_code=502, detail=f"Could not fetch info for {symbol}")