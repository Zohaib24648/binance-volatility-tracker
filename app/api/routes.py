from fastapi import APIRouter, HTTPException, Query
from typing import Literal, Optional
from app.services.scheduler import get_interval, get_status
from app.services.api_logger import api_logger
from app.core.config import settings

router = APIRouter()

@router.get("/volatility")
async def volatility(
    interval: str = Query("1h"),
    sort_by: str = Query("ma21"),
    descending: bool = Query(True),
    limit: int = Query(100, le=1000)
):
    data = await get_interval(interval)
    
    # Return empty data instead of error
    if not data:
        return {"interval": interval, "rows": [], "status": "initializing"}

    # Sort + clamp with proper handling for missing values
    def safe_sort_key(item):
        # Return -inf or inf as fallbacks for missing or None values based on sort direction
        # This ensures items without the sort_by key appear at the end of the list
        if sort_by not in item or item[sort_by] is None:
            return float('-inf') if descending else float('inf')
        return float(item[sort_by])  # Ensure numerical sorting
        
    sorted_data = sorted(data, key=safe_sort_key, reverse=descending)[:limit]
    return {"interval": interval, "rows": sorted_data}

@router.get("/status")
async def status():
    """Get the current status of the backend data processing"""
    return await get_status()

@router.get("/api-logs")
async def get_api_logs(
    limit: int = Query(100, le=1000),
    symbol_filter: Optional[str] = Query(None)
):
    """Get detailed API call logs"""
    logs = api_logger.get_logs(limit=limit, symbol_filter=symbol_filter)
    stats = api_logger.get_stats()
    return {
        "logs": logs,
        "stats": stats,
        "total_count": len(logs)
    }

@router.get("/api-stats")
async def get_api_stats():
    """Get API call statistics"""
    return api_logger.get_stats()

@router.post("/api-logs/clear")
async def clear_api_logs():
    """Clear all API logs and reset statistics"""
    api_logger.clear_logs()
    return {"message": "API logs cleared successfully"}

@router.get("/debug/{interval}")
async def debug_data(interval: str):
    """Return raw data for debugging"""
    data = await get_interval(interval)
    return {"count": len(data), "sample": data[:5] if data else []}
