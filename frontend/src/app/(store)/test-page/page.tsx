'use client'

import { useState } from 'react'

export default function TestPage() {
  const [count, setCount] = useState(0)
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Page with useState</h1>
      <p>This is a test page with useState.</p>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
