"use client"
import React, { useState } from 'react'

export default function Filters({ onChange }: { onChange: (q:any)=>void }) {
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [age, setAge] = useState('')

  return (
    <aside className="bg-white p-4 rounded-lg shadow-sm">
      <h4 className="font-semibold mb-3">Filters</h4>
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">Age</label>
        <select className="w-full p-2 border rounded" value={age} onChange={(e)=>{setAge(e.target.value); onChange({age: e.target.value})}}>
          <option value="">Any</option>
          <option value="0-3">0–3 months</option>
          <option value="3-6">3–6 months</option>
          <option value="6-12">6–12 months</option>
          <option value="12-36">1–3 years</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">Price (max)</label>
        <input type="range" min={100} max={10000} value={priceRange[1]} onChange={(e)=>{setPriceRange([0, Number(e.target.value)]); onChange({price_max: e.target.value})}} className="w-full" />
        <div className="text-sm text-gray-500 mt-2">Up to Ksh {priceRange[1]}</div>
      </div>
      <div className="mt-4">
        <button className="w-full px-3 py-2 bg-pastelPink text-gray-800 rounded" onClick={()=>onChange({})}>Clear</button>
      </div>
    </aside>
  )
}
