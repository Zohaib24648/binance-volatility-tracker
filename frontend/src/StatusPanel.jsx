import React, { useEffect, useState } from "react";

export default function StatusPanel() {
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  
  useEffect(() => {
    const fetchStatus = () => {
      fetch("http://localhost:8000/api/status")
        .then(r => {
          if (!r.ok) throw new Error(`Status API error: ${r.status}`);
          return r.json();
        })
        .then(data => {
          setStatus(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching status:", err);
          setError(err.message);
          setLoading(false);
        });
    };
    
    fetchStatus();
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading) return <div className="text-sm text-gray-500">Loading backend status...</div>;
  if (error) return <div className="text-sm text-red-500">Status error: {error}</div>;
  
  return (
    <div className="mt-2 mb-4 p-3 bg-gray-100 rounded">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">Backend Status</h3>
        <button 
          onClick={() => setShowLogs(!showLogs)}
          className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
        >
          {showLogs ? "Hide Logs" : "Show Logs"}
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
        <div>
          <strong>Initialized:</strong> {status.initialized ? "Yes" : "No"}
        </div>
        <div>
          <strong>In Progress:</strong> {status.in_progress ? "Yes" : "No"}
        </div>
        <div>
          <strong>Symbols:</strong> {status.symbol_count}
        </div>
        <div>
          <strong>Last Update:</strong> {status.last_refresh ? 
            new Date(status.last_refresh).toLocaleTimeString() : "Never"}
        </div>
      </div>
      
      {/* Progress bar */}
      {status.in_progress && status.total_tasks > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress:</span>
            <span>{Math.round((status.current_progress / status.total_tasks) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{width: `${(status.current_progress / status.total_tasks) * 100}%`}}
            ></div>
          </div>
          <div className="text-xs mt-1">
            Processing: {status.current_progress} of {status.total_tasks} tasks
          </div>
        </div>
      )}
      
      {/* Currently processing */}
      {status.recent_symbols && status.recent_symbols.length > 0 && (
        <div className="mt-2 text-xs">
          <strong>Recently processed:</strong>
          <div className="flex flex-wrap gap-1 mt-1">
            {status.recent_symbols.map((sym, i) => (
              <span key={i} className="bg-gray-200 px-1 py-0.5 rounded">
                {sym}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {Object.keys(status.intervals || {}).length > 0 && (
        <div className="mt-2 text-sm">
          <strong>Loaded Intervals:</strong>
          <div className="grid grid-cols-5 gap-1">
            {Object.entries(status.intervals).map(([interval, count]) => (
              <div key={interval} className="text-xs">
                {interval}: {count}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Logs section */}
      {showLogs && status.logs && status.logs.length > 0 && (
        <div className="mt-4">
          <strong>Logs:</strong>
          <div className="mt-1 bg-black text-green-400 p-2 rounded text-xs font-mono h-48 overflow-y-auto">
            {status.logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}
      
      {status.errors && status.errors.length > 0 && (
        <div className="mt-2 text-red-500 text-sm">
          <strong>Errors:</strong>
          <ul className="list-disc pl-5">
            {status.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}