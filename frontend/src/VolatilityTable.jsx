import React, { useEffect, useState } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";

export default function VolatilityTable({ interval = "1h" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("ma21");

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`http://localhost:8000/api/volatility?interval=${interval}&sort_by=${sortBy}&descending=true`)
      .then(r => {
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        return r.json();
      })
      .then(json => {
        setRows(json.rows || []);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [interval, sortBy]);

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
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!rows.length) return <div className="p-4">No volatility data available.</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{interval} average volatility</h2>
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
            <tr key={row.id} className="border">
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
