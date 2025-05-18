import httpx
import asyncio
from app.core.config import settings
from functools import cache

@cache
def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=settings.BINANCE_BASE, timeout=10.0)

async def fetch_symbols() -> list[str]:
    """
    Returns every spot symbol quoted in SYMBOL_FILTER and currently trading.
    """
    data = (await _client().get("/api/v3/exchangeInfo")).json()["symbols"]
    return [s["symbol"]
            for s in data
            if s["status"] == "TRADING" and s["quoteAsset"] == settings.SYMBOL_FILTER]

async def fetch_klines(symbol: str, interval: str, limit: int):
    params = {"symbol": symbol, "interval": interval, "limit": limit}
    return (await _client().get("/api/v3/klines", params=params)).json()

# Graceful shutdown helper
async def close():
    await _client().aclose()
