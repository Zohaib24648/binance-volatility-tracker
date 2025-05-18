import React, { useEffect, useState, useCallback, useRef } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";

export default function VolatilityTable({ interval = "1h" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("ma21");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const refreshInterval = useRef(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/volatility?interval=${interval}&sort_by=${sortBy}&descending=true`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const json = await response.json();
      setRows(json.rows || []);
      setLastUpdated(new Date());
      retryCount.current = 0; // Reset retry count on success
    } catch (err) {
      setError(err.message);
      // Implement exponential backoff for retries
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        setTimeout(() => fetchData(isInitialLoad), 2000 * retryCount.current);
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [interval, sortBy]);

  // Initial data load
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(() => fetchData(false), 10000); // Refresh every 10 seconds
    } else if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh, fetchData]);

  const columns = React.useMemo(
    () => [
      { accessorKey: "symbol", header: "Pair" },
      ...[7, 21, 50, 100, 200].map(w => ({
        accessorKey: `ma${w}`,
        header: `MA${w}`,
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? (value * 100).toFixed(2) + '%' : "-";
        },
      })),
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) return <div className="p-4">Loading volatility data...</div>;
  if (error && rows.length === 0) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!rows.length) return <div className="p-4">No volatility data available.</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{interval} average volatility</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {lastUpdated && (
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
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
            onClick={() => fetchData(false)}
            disabled={refreshing}
            className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Now'}
          </button>
          <div>
            <label className="mr-2">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border p-1"
            >
              <option value="ma7">MA7</option>
              <option value="ma21">MA21</option>
              <option value="ma50">MA50</option>
              <option value="ma100">MA100</option>
              <option value="ma200">MA200</option>
            </select>
          </div>
        </div>
      </div>
      
      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      
      {refreshing && (
        <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded animate-pulse">
          Refreshing data...
        </div>
      )}
      
      <table className="w-full border text-sm">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="cursor-pointer border px-2 py-1"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: " ▲", desc: " ▼" }[header.column.getIsSorted()] || ""}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="border hover:bg-gray-100">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-2 py-1 text-center">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
