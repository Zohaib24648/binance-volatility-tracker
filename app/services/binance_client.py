import httpx
import asyncio
from app.core.config import settings
from app.services.api_logger import api_logger
from functools import cache

@cache
def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=settings.BINANCE_BASE, timeout=10.0)

async def fetch_symbols() -> list[str]:
    """
    Returns every spot symbol quoted in SYMBOL_FILTER and currently trading.
    """
    call_context = api_logger.start_call(
        method="GET",
        url="/api/v3/exchangeInfo",
        symbol="ALL_SYMBOLS"
    )
    
    try:
        response = await _client().get("/api/v3/exchangeInfo")
        data = response.json()
        
        api_logger.complete_call(
            call_context,
            response_status=response.status_code,
            response_data={"symbol_count": len(data.get("symbols", [])), "status": "success"}
        )
        
        symbols = [s["symbol"]
                  for s in data["symbols"]
                  if s["status"] == "TRADING" and s["quoteAsset"] == settings.SYMBOL_FILTER]
        
        return symbols
        
    except Exception as e:
        api_logger.complete_call(call_context, error=e)
        raise

async def fetch_klines(symbol: str, interval: str, limit: int):
    params = {"symbol": symbol, "interval": interval, "limit": limit}
    
    call_context = api_logger.start_call(
        method="GET",
        url="/api/v3/klines",
        params=params,
        symbol=symbol
    )
    
    try:
        response = await _client().get("/api/v3/klines", params=params)
        data = response.json()
        
        api_logger.complete_call(
            call_context,
            response_status=response.status_code,
            response_data={"candle_count": len(data), "symbol": symbol, "interval": interval}
        )
        
        return data
        
    except Exception as e:
        api_logger.complete_call(call_context, error=e)
        raise

# Graceful shutdown helper
async def close():
    await _client().aclose()
