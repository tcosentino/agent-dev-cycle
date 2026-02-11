import { useState } from 'react'

/**
 * Counter Component
 *
 * A simple counter demonstrating Test-Spec Linkage.
 * Each button action corresponds to a spec scenario.
 */
export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div className="counter">
      <h2>Counter Example</h2>
      <div className="count-display" data-testid="count-value">
        {count}
      </div>
      <div className="button-group">
        <button
          data-testid="increment-button"
          onClick={() => setCount(count + 1)}
        >
          Increment
        </button>
        <button
          data-testid="decrement-button"
          onClick={() => setCount(count - 1)}
        >
          Decrement
        </button>
        <button
          data-testid="reset-button"
          onClick={() => setCount(0)}
        >
          Reset
        </button>
      </div>
      <style>{`
        .counter {
          padding: 2rem;
          text-align: center;
          border: 2px solid #ddd;
          border-radius: 8px;
          max-width: 400px;
          margin: 0 auto;
        }
        .count-display {
          font-size: 4rem;
          font-weight: bold;
          margin: 2rem 0;
          color: #333;
        }
        .button-group {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        button {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          border: none;
          border-radius: 4px;
          background: #007bff;
          color: white;
          cursor: pointer;
          transition: background 0.2s;
        }
        button:hover {
          background: #0056b3;
        }
      `}</style>
    </div>
  )
}
