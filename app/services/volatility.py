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
    
    # Convert columns to appropriate types
    df[["o","h","l","c"]] = df[["o","h","l","c"]].astype(float)
    
    # Calculate candle amplitude (high-low range) divided by open price
    # This represents the total price movement within each candle
    df["amplitude"] = (df["h"] - df["l"]) / df["o"]

    result = {"symbol": symbol, "interval": interval}
    for w in settings.MA_WINDOWS:
        if len(df) >= w:
            # Convert float to string for consistent dictionary value types
            result[f"ma{w}"] = str(df["amplitude"].tail(w).mean())
    return result
