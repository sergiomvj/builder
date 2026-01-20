'use client';

import { useState } from 'react';

export default function MinimalTest() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Minimal Test Page</h1>
      <p>This is a minimal test to check for infinite loops.</p>
      <p>Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        Increment
      </button>
    </div>
  );
}