import React, { useState } from 'react';
import VolatilityTable from './VolatilityTable';
import StatusPanel from './StatusPanel';
import ApiLogsPanel from './ApiLogsPanel';

function App() {
  const [interval, setInterval] = useState("1h");
  const [activeTab, setActiveTab] = useState("volatility");
  
  return (
    <div className="container mx-auto">
      <header className="py-4 mb-6 border-b">
        <h1 className="text-3xl font-bold text-blue-700">Crypto Volatility Tracker</h1>
        <p className="text-gray-600 mt-1">Real-time crypto price volatility analytics</p>
      </header>
      
      <StatusPanel />
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("volatility")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "volatility"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Volatility Data
            </button>
            <button
              onClick={() => setActiveTab("api-logs")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "api-logs"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              API Logs
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === "volatility" && (
        <>
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
        </>
      )}
      
      {activeTab === "api-logs" && <ApiLogsPanel />}
      
      <footer className="mt-8 pt-4 border-t text-center text-gray-500 text-sm">
        <p>Data provided by Binance API • Refreshed automatically</p>
      </footer>
    </div>
  );
}

export default App;