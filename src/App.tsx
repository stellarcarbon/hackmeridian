import React, { useState } from 'react';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { fetch_user_shares, sink_user_carbon, swap_usdc_to_carbon, USER_ADDRESSES } from './services/SwapService'
import type { SinkingResponse } from '@stellarcarbon/sc-sdk';

function App() {
  const [steps, setSteps] = useState<SinkingResponse[]>([]);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button
          onClick={async () => {
            const result = await sink_user_carbon(10, {
              "GCMFQP44AR32S7IRIUKNOEJW5PNWOCLRHLQWSHUCSV4QZOMUXZOVA7Q2": 0.99,
              "GDOFDSMFRPOYTOLWODK4O6BZTGDJ4GRHLHX5THXN4TIFE2SXASQYFLPJ": 0.01
            });
            setSteps(result);
          }}
        >
          SINK
        </button>
        <p>
          transactions: {JSON.stringify(steps)}
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
