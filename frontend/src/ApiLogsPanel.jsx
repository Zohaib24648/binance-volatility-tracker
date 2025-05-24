import React, { useEffect, useState } from "react";

export default function ApiLogsPanel() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [symbolFilter, setSymbolFilter] = useState("");
  const [limit, setLimit] = useState(50);
  const [selectedLog, setSelectedLog] = useState(null);
  
  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });
      
      if (symbolFilter.trim()) {
        params.append('symbol_filter', symbolFilter.trim());
      }
      
      const response = await fetch(`http://localhost:8000/api/api-logs?${params}`);
      if (!response.ok) throw new Error(`API logs error: ${response.status}`);
      
      const data = await response.json();
      setLogs(data.logs || []);
      setStats(data.stats || {});
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error("Error fetching API logs:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/api-logs/clear", {
        method: "POST"
      });
      if (!response.ok) throw new Error(`Clear logs error: ${response.status}`);
      
      // Refresh logs after clearing
      fetchLogs();
    } catch (err) {
      console.error("Error clearing logs:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [limit, symbolFilter]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, limit, symbolFilter]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (success) => {
    return success ? "text-green-600" : "text-red-600";
  };

  const getMethodColor = (method) => {
    switch (method) {
      case "GET": return "bg-blue-100 text-blue-800";
      case "POST": return "bg-green-100 text-green-800";
      case "PUT": return "bg-yellow-100 text-yellow-800";
      case "DELETE": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return <div className="p-4">Loading API logs...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">API Call Logs</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label className="mr-2 text-sm">Auto-refresh:</label>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2 py-1 text-xs rounded ${
                autoRefresh ? 'bg-green-500 text-white' : 'bg-gray-300'
              }`}
            >
              {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>
          <button
            onClick={fetchLogs}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded"
          >
            Refresh
          </button>
          <button
            onClick={clearLogs}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded"
          >
            Clear Logs
          </button>
        </div>
      </div>

      {/* Statistics Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-100 p-3 rounded">
          <div className="text-lg font-bold">{stats.total_calls || 0}</div>
          <div className="text-sm text-gray-600">Total Calls</div>
        </div>
        <div className="bg-green-100 p-3 rounded">
          <div className="text-lg font-bold">{stats.successful_calls || 0}</div>
          <div className="text-sm text-gray-600">Successful</div>
        </div>
        <div className="bg-red-100 p-3 rounded">
          <div className="text-lg font-bold">{stats.failed_calls || 0}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="bg-yellow-100 p-3 rounded">
          <div className="text-lg font-bold">
            {stats.avg_response_time ? `${stats.avg_response_time.toFixed(1)}ms` : '0ms'}
          </div>
          <div className="text-sm text-gray-600">Avg Response</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Symbol Filter:</label>
          <input
            type="text"
            value={symbolFilter}
            onChange={(e) => setSymbolFilter(e.target.value)}
            placeholder="e.g., BTCUSDT"
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Limit:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
      </div>

      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}

      {/* Logs Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">URL</th>
                <th className="px-3 py-2 text-left">Symbol</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Response Time</th>
                <th className="px-3 py-2 text-left">Size</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">{formatTimestamp(log.timestamp)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${getMethodColor(log.method)}`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs max-w-xs truncate">
                    {log.url}
                  </td>
                  <td className="px-3 py-2">{log.symbol || '-'}</td>
                  <td className="px-3 py-2">
                    <span className={getStatusColor(log.success)}>
                      {log.success ? `${log.response_status}` : 'ERROR'}
                    </span>
                  </td>
                  <td className="px-3 py-2">{log.response_time_ms.toFixed(1)}ms</td>
                  <td className="px-3 py-2">
                    {log.response_size ? `${(log.response_size / 1024).toFixed(1)}KB` : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-500 hover:text-blue-700 text-xs"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {logs.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No API logs found. {symbolFilter ? 'Try adjusting the filter.' : 'Make some API calls to see logs here.'}
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-3/4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">API Call Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}
                </div>
                <div>
                  <strong>Method:</strong> {selectedLog.method}
                </div>
                <div className="col-span-2">
                  <strong>URL:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{selectedLog.url}</code>
                </div>
                <div>
                  <strong>Symbol:</strong> {selectedLog.symbol || 'N/A'}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <span className={getStatusColor(selectedLog.success)}>
                    {selectedLog.success ? selectedLog.response_status : 'FAILED'}
                  </span>
                </div>
                <div>
                  <strong>Response Time:</strong> {selectedLog.response_time_ms.toFixed(2)}ms
                </div>
                <div>
                  <strong>Response Size:</strong> {selectedLog.response_size ? `${selectedLog.response_size} bytes` : 'N/A'}
                </div>
              </div>

              {selectedLog.params && Object.keys(selectedLog.params).length > 0 && (
                <div>
                  <strong>Request Parameters:</strong>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.params, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.error_message && (
                <div>
                  <strong>Error:</strong>
                  <div className="bg-red-100 p-2 rounded text-red-700">
                    {selectedLog.error_message}
                  </div>
                </div>
              )}

              {selectedLog.response_preview && (
                <div>
                  <strong>Response Preview:</strong>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-64">
                    {selectedLog.response_preview}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
