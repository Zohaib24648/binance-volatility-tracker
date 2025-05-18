import pandas as pd
import numpy as np
from app.core.config import settings  # Add app. prefix
from app.services.binance_client import fetch_klines

async def volatility_for_symbol(symbol: str, interval: str) -> dict:
    raw = await fetch_klines(symbol, interval, settings.MAX_CANDLES)
    if not raw:
        return {}

    # Binance kline columns: open_time, open, high, low, close, volume, ...
    df = pd.DataFrame(raw,
        columns=["open_t","o","h","l","c","v","close_t","q","n","taker_base",
                 "taker_quote","ignore"])
    df[["o","c"]] = df[["o","c"]].astype(float)
    df["abs_change"] = (df["c"] - df["o"]).abs() / df["o"]

    result = {"symbol": symbol, "interval": interval}
    for w in settings.MA_WINDOWS:
        if len(df) >= w:
            result[f"ma{w}"] = df["abs_change"].tail(w).mean()
    return result
