import json
import time
from collections import deque
from datetime import datetime
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
import logging

@dataclass
class APICall:
    """Represents a single API call with all details"""
    timestamp: str
    method: str
    url: str
    params: Optional[Dict[str, Any]]
    headers: Optional[Dict[str, str]]
    request_body: Optional[str]  # Complete request body
    request_size: int
    response_status: Optional[int]
    response_headers: Optional[Dict[str, str]]  # Response headers
    response_body: Optional[str]  # Complete response body
    response_size: Optional[int]
    response_time_ms: float
    success: bool
    error_message: Optional[str]
    response_preview: Optional[str]  # First 500 chars of response
    symbol: Optional[str]  # For easier filtering

class APILogger:
    """Centralized API call logging service"""
    
    def __init__(self, max_logs: int = 1000):
        self._logs = deque(maxlen=max_logs)
        self._stats = {
            "total_calls": 0,
            "successful_calls": 0,
            "failed_calls": 0,
            "total_response_time": 0.0,
            "avg_response_time": 0.0,
            "last_reset": datetime.now().isoformat()
        }
        
    def start_call(self, method: str, url: str, params: Optional[Dict] = None, 
                   headers: Optional[Dict] = None, symbol: Optional[str] = None,
                   request_body: Optional[str] = None) -> Dict[str, Any]:
        """Start tracking an API call. Returns call context for completion."""
        return {
            "start_time": time.time(),
            "method": method,
            "url": url,
            "params": params or {},
            "headers": headers or {},
            "request_body": request_body,
            "symbol": symbol,
            "request_size": len(request_body or json.dumps(params or {}))
        }
    
    def complete_call(self, call_context: Dict[str, Any], response_status: Optional[int] = None,
                     response_data: Any = None, response_headers: Optional[Dict] = None,
                     error: Optional[Exception] = None):
        """Complete and log an API call"""
        end_time = time.time()
        response_time_ms = (end_time - call_context["start_time"]) * 1000
        
        # Prepare response body and preview
        response_body = None
        response_preview = None
        response_size = 0
        
        if response_data is not None:
            if isinstance(response_data, (dict, list)):
                response_body = json.dumps(response_data, indent=2)
                response_size = len(response_body)
                response_preview = response_body[:500] + ("..." if len(response_body) > 500 else "")
            else:
                response_body = str(response_data)
                response_size = len(response_body)
                response_preview = response_body[:500] + ("..." if len(response_body) > 500 else "")
        
        # Create API call record
        api_call = APICall(
            timestamp=datetime.now().isoformat(),
            method=call_context["method"],
            url=call_context["url"],
            params=call_context["params"],
            headers=call_context["headers"],
            request_body=call_context["request_body"],
            request_size=call_context["request_size"],
            response_status=response_status,
            response_headers=response_headers or {},
            response_body=response_body,
            response_size=response_size,
            response_time_ms=response_time_ms,
            success=error is None and (response_status is None or 200 <= response_status < 300),
            error_message=str(error) if error else None,
            response_preview=response_preview,
            symbol=call_context["symbol"]
        )
        
        # Add to logs
        self._logs.append(api_call)
        
        # Update stats
        self._stats["total_calls"] += 1
        if api_call.success:
            self._stats["successful_calls"] += 1
        else:
            self._stats["failed_calls"] += 1
        
        self._stats["total_response_time"] += response_time_ms
        self._stats["avg_response_time"] = self._stats["total_response_time"] / self._stats["total_calls"]
        
        # Log to standard logger as well
        if api_call.success:
            logging.info(f"API {api_call.method} {api_call.url} - {response_time_ms:.1f}ms - {response_status}")
        else:
            logging.error(f"API {api_call.method} {api_call.url} - FAILED - {api_call.error_message}")
    
    def get_logs(self, limit: Optional[int] = None, symbol_filter: Optional[str] = None) -> list[Dict[str, Any]]:
        """Get recent API logs with optional filtering"""
        logs = list(self._logs)
        
        # Filter by symbol if specified
        if symbol_filter:
            logs = [log for log in logs if log.symbol and symbol_filter.lower() in log.symbol.lower()]
        
        # Reverse to get most recent first
        logs.reverse()
        
        # Apply limit
        if limit:
            logs = logs[:limit]
            
        return [asdict(log) for log in logs]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get API call statistics"""
        return self._stats.copy()
    
    def clear_logs(self):
        """Clear all logs and reset stats"""
        self._logs.clear()
        self._stats = {
            "total_calls": 0,
            "successful_calls": 0,
            "failed_calls": 0,
            "total_response_time": 0.0,
            "avg_response_time": 0.0,
            "last_reset": datetime.now().isoformat()
        }

# Global logger instance
api_logger = APILogger()
