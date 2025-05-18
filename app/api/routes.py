from fastapi import APIRouter, HTTPException, Query
from typing import Literal
from app.services.scheduler import get_interval, get_status
from app.core.config import settings

router = APIRouter()

@router.get("/volatility")
async def volatility(
    interval: Literal[tuple(settings.INTERVALS)] = Query("1h"),
    sort_by: str = Query("ma21"),
    descending: bool = Query(True),
    limit: int = Query(100, le=1000)
):
    data = await get_interval(interval)
    
    # Return empty data instead of error
    if not data:
        return {"interval": interval, "rows": [], "status": "initializing"}

    # Sort + clamp
    data = sorted(
        [d for d in data if sort_by in d],
        key=lambda x: x[sort_by],
        reverse=descending
    )[:limit]
    return {"interval": interval, "rows": data}

@router.get("/status")
async def status():
    """Get the current status of the backend data processing"""
    return await get_status()

@router.get("/debug/{interval}")
async def debug_data(interval: str):
    """Return raw data for debugging"""
    data = await get_interval(interval)
    return {"count": len(data), "sample": data[:5] if data else []}
