"use client"

import React, { createContext, useContext, useReducer, useEffect, useMemo, useState } from 'react'

type CartItem = { 
  id: string | number; 
  name: string; 
  price: number; 
  image?: string; 
  qty: number; 
  slug?: string;
  product_id?: number;
}

type CartData = {
  items: CartItem[];
  subtotal: string;
  total: string;
}

type State = { 
  items: CartItem[]
  cartData: CartData | null
}

type Action =
  | { type: 'HYDRATE'; cartData: CartData }
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; id: string | number }
  | { type: 'UPDATE'; id: string | number; qty: number }
  | { type: 'CLEAR' }

const STORAGE_KEY = 'malaika_cart_v1'

const API_URL = process.env.NEXT_PUBLIC_API_URL

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, cartData: action.cartData, items: action.cartData?.items || [] }
    case 'ADD': {
      const exists = state.items.find(i => i.id === action.item.id)
      if (exists) {
        return { ...state, items: state.items.map(i => i.id === action.item.id ? { ...i, qty: i.qty + action.item.qty } : i) }
      }
      return { ...state, items: [...state.items, action.item] }
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
    case 'UPDATE':
      return { ...state, items: state.items.map(i => i.id === action.id ? { ...i, qty: action.qty } : i) }
    case 'CLEAR':
      return { ...state, items: [], cartData: null }
    default:
      return state
  }
}

type CartContextType = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'> & { qty?: number }) => Promise<void>
  remove: (id: string | number) => Promise<void>
  updateQty: (id: string | number, qty: number) => Promise<void>
  clear: () => Promise<void>
  loading: boolean
  synced: boolean
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], cartData: null })
  const [loading, setLoading] = useState(false)
  const [synced, setSynced] = useState(false)

  const fetchCart = async () => {
    if (!API_URL) {
      console.warn('NEXT_PUBLIC_API_URL is not configured. Cart sync disabled.')
      return
    }
    try {
      const res = await fetch(`${API_URL}/api/orders/cart/`, {
        credentials: 'include',
        cache: 'no-store'
      })
      if (res.ok) {
        const data = await res.json()
        dispatch({ type: 'HYDRATE', cartData: data })
        setSynced(true)
      }
    } catch (e) {
      console.error('Failed to fetch cart', e)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [])

  useEffect(() => {
    if (!synced) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch (e) {
      console.error('Failed to persist cart', e)
    }
  }, [state.items, synced])

  const add = async (item: Omit<CartItem, 'qty'> & { qty?: number }) => {
    const fullItem = { ...item, qty: item.qty ?? 1 }
    dispatch({ type: 'ADD', item: fullItem })
    
    if (!API_URL) {
      console.warn('NEXT_PUBLIC_API_URL not configured - item added locally only')
      return
    }
    setLoading(true)
    try {
      await fetch(`${API_URL}/api/orders/cart/add/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          product_id: item.id, 
          quantity: fullItem.qty 
        })
      })
    } catch (e) {
      console.error('Failed to add to cart', e)
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string | number) => {
    dispatch({ type: 'REMOVE', id })
    
    if (!API_URL) return
    setLoading(true)
    try {
      await fetch(`${API_URL}/api/orders/cart/remove/${id}/`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (e) {
      console.error('Failed to remove from cart', e)
    } finally {
      setLoading(false)
    }
  }

  const updateQty = async (id: string | number, qty: number) => {
    dispatch({ type: 'UPDATE', id, qty })
  }

  const clear = async () => {
    dispatch({ type: 'CLEAR' })
  }

  const value = useMemo(() => ({ 
    items: state.items, 
    add, 
    remove, 
    updateQty, 
    clear, 
    loading, 
    synced 
  }), [state.items, loading, synced])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
