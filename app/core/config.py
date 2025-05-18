from pydantic_settings import BaseSettings  # Changed from pydantic import BaseSettings

class Settings(BaseSettings):
    BINANCE_BASE: str = "https://api.binance.com"
    SYMBOL_FILTER: str = "USDT"           # quote asset to keep
    MAX_CANDLES: int = 200                # enough for the biggest MA window
    INTERVALS: list[str] = ["1m", "15m", "1h", "4h", "1d"]
    MA_WINDOWS: list[int] = [7, 21, 50, 100, 200]
    REFRESH_SEC: int = 60                 # background refresh cadence

settings = Settings()
