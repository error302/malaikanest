"use client"
import React, {useEffect, useState} from 'react'
import axios from 'axios'

export default function OrderStatus({orderId}:{orderId:string}){
  const [status, setStatus] = useState('pending')
  useEffect(()=>{
    let mounted = true
    const fetchStatus = async ()=>{
      try{
        const res = await axios.get((process.env.NEXT_PUBLIC_API_URL||'')+`/api/orders/orders/${orderId}/`, {withCredentials:true})
        if(mounted) setStatus(res.data.status)
      }catch(err){ }
    }
    fetchStatus()
    const t = setInterval(fetchStatus, 5000)
    return ()=>{ mounted=false; clearInterval(t) }
  },[orderId])

  return <div className="p-3 bg-white rounded">Order status: <strong>{status}</strong></div>
}
