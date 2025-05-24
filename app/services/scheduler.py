import asyncio
import time
import logging
from collections import defaultdict, deque
from datetime import datetime
from app.core.config import settings
from app.services.binance_client import fetch_symbols, close
from app.services.volatility import volatility_for_symbol
from app.services.api_logger import api_logger

_cache: dict[str, list[dict]] = defaultdict(list)
_initialized = False
_recent_logs = deque(maxlen=30)  # Store recent logs
_status = {
    "initialized": False,
    "last_refresh": None,
    "symbol_count": 0,
    "intervals": {},
    "errors": [],
    "in_progress": False,
    "startup_time": datetime.now().isoformat(),
    "current_progress": 0,
    "total_tasks": 0,
    "recent_symbols": [],  # Track recently processed symbols
    "logs": []  # Store recent log messages
}

def _add_log(message):
    timestamp = datetime.now().strftime("%H:%M:%S")
    log_entry = f"[{timestamp}] {message}"
    _recent_logs.append(log_entry)
    _status["logs"] = list(_recent_logs)
    logging.info(message)

async def refresh_loop():
    global _initialized
    while True:
        start = time.time()
        _status["in_progress"] = True
        _status["errors"] = []  # Clear previous errors
        _status["current_progress"] = 0
        _status["recent_symbols"] = []
        
        try:
            symbols = await fetch_symbols()
            _status["symbol_count"] = len(symbols)
            _add_log(f"Fetched {len(symbols)} symbols from Binance")
            
            # Create tasks for all combinations
            all_tasks = [
                (sym, ivl) for sym in symbols for ivl in settings.INTERVALS
            ]
            
            # Record the total
            _status["total_tasks"] = len(all_tasks)
            
            # Process in smaller batches to show progress
            batch_size = 50
            total_results = []
            
            for i in range(0, len(all_tasks), batch_size):
                batch = all_tasks[i:i+batch_size]
                _add_log(f"Processing batch {i//batch_size + 1}/{len(all_tasks)//batch_size + 1} ({len(batch)} symbols)")
                
                # Track symbols being processed
                current_symbols = [f"{sym}:{ivl}" for sym, ivl in batch[:10]]  # Show first 10 only
                _status["recent_symbols"] = current_symbols
                
                # Process batch
                tasks = [volatility_for_symbol(sym, ivl) for sym, ivl in batch]
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                total_results.extend(batch_results)
                
                # Update progress
                _status["current_progress"] += len(batch)
                _add_log(f"Progress: {_status['current_progress']}/{_status['total_tasks']} tasks completed")
            
            # Count errors
            error_count = sum(1 for r in total_results if isinstance(r, Exception))
            if error_count:
                _status["errors"].append(f"{error_count} symbols failed to fetch")
                _add_log(f"WARNING: {error_count} tasks failed with errors")

            # Clean + bucket by interval for quick lookup
            by_interval = defaultdict(list)
            for r in total_results:
                if isinstance(r, dict) and r:
                    by_interval[r["interval"]].append(r)
            
            # Update interval stats
            for interval in settings.INTERVALS:
                count = len(by_interval.get(interval, []))
                _status["intervals"][interval] = count
                _add_log(f"Loaded {count} symbols for {interval} interval")
            
            # Only update cache if we got data
            if any(by_interval.values()):
                _cache.clear()
                _cache.update(by_interval)
                _initialized = True
                _status["initialized"] = True
                _add_log("Cache updated successfully!")
                
            _status["last_refresh"] = datetime.now().isoformat()
            
            elapsed = time.time() - start
            _add_log(f"Refresh complete: {sum(len(v) for v in _cache.values())} volatility records in {elapsed:.1f}s")
        except Exception as e:
            error_msg = f"Error refreshing data: {e}"
            _add_log(f"ERROR: {error_msg}")
            logging.error(error_msg)
            _status["errors"].append(str(e))
        finally:
            _status["in_progress"] = False
            
        await asyncio.sleep(settings.REFRESH_SEC)

async def get_interval(interval: str) -> list[dict]:
    if not _initialized:
        return []
    return _cache.get(interval, [])

async def get_status():
    status = _status.copy()
    # Add API call statistics
    status["api_stats"] = api_logger.get_stats()
    return status

async def on_shutdown():
    await close()
