'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function TestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [count, setCount] = useState(0)
  
  const redirect = searchParams.get('redirect') || '/'
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Page with useRouter and useSearchParams</h1>
      <p>This is a test page.</p>
      <p>Count: {count}</p>
      <p>Redirect: {redirect}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
