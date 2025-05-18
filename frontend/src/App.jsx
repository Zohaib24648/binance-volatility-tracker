import React, { useState } from 'react';
import VolatilityTable from './VolatilityTable';
import StatusPanel from './StatusPanel';

function App() {
  const [interval, setInterval] = useState("1h");
  
  return (
    <div className="container mx-auto">
      <header className="py-4 mb-6 border-b">
        <h1 className="text-3xl font-bold text-blue-700">Crypto Volatility Tracker</h1>
        <p className="text-gray-600 mt-1">Real-time crypto price volatility analytics</p>
      </header>
      
      <StatusPanel />
      
      <div className="mb-6 p-3 bg-gray-100 rounded flex items-center">
        <span className="font-medium mr-3">Select Timeframe:</span>
        <div className="flex space-x-2">
          {[
            {value: "1m", label: "1 Min"},
            {value: "15m", label: "15 Min"},
            {value: "1h", label: "1 Hour"},
            {value: "4h", label: "4 Hours"},
            {value: "1d", label: "1 Day"}
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setInterval(option.value)}
              className={`px-3 py-1 rounded ${
                interval === option.value 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <VolatilityTable interval={interval} />
      
      <footer className="mt-8 pt-4 border-t text-center text-gray-500 text-sm">
        <p>Data provided by Binance API • Refreshed automatically</p>
      </footer>
    </div>
  );
}

export default App;