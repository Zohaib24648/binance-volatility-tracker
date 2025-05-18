import React, { useState } from 'react';
import VolatilityTable from './VolatilityTable';
import StatusPanel from './StatusPanel';

function App() {
  const [interval, setInterval] = useState("1h");
  
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Crypto Volatility Tracker</h1>
      
      <StatusPanel />
      
      <div className="mb-4">
        <label className="mr-2">Timeframe:</label>
        <select 
          value={interval} 
          onChange={(e) => setInterval(e.target.value)}
          className="border p-1"
        >
          <option value="1m">1 Minute</option>
          <option value="15m">15 Minutes</option>
          <option value="1h">1 Hour</option>
          <option value="4h">4 Hours</option>
          <option value="1d">1 Day</option>
        </select>
      </div>
      
      <VolatilityTable interval={interval} />
    </div>
  );
}

export default App;