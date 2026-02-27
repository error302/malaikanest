"use client"

import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react'

type CartItem = { id: string | number; name: string; price: number; image?: string; qty: number; slug?: string }

type State = { items: CartItem[] }

type Action =
  | { type: 'hydrate'; items: CartItem[] }
  | { type: 'add'; item: CartItem }
  | { type: 'remove'; id: string | number }
  | { type: 'update'; id: string | number; qty: number }
  | { type: 'clear' }

const STORAGE_KEY = 'malaika_cart_v1'

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { items: action.items }
    case 'add': {
      const exists = state.items.find(i => i.id === action.item.id)
      if (exists) {
        return { items: state.items.map(i => i.id === action.item.id ? { ...i, qty: i.qty + action.item.qty } : i) }
      }
      return { items: [...state.items, action.item] }
    }
    case 'remove':
      return { items: state.items.filter(i => i.id !== action.id) }
    case 'update':
      return { items: state.items.map(i => i.id === action.id ? { ...i, qty: action.qty } : i) }
    case 'clear':
      return { items: [] }
    default:
      return state
  }
}

type CartContextType = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void
  remove: (id: string | number) => void
  updateQty: (id: string | number, qty: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        dispatch({ type: 'hydrate', items: JSON.parse(raw) })
      }
    } catch (e) {
      console.error('Failed to hydrate cart', e)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch (e) {
      console.error('Failed to persist cart', e)
    }
  }, [state.items])

  const add = (item: Omit<CartItem, 'qty'> & { qty?: number }) => {
    dispatch({ type: 'add', item: { ...item, qty: item.qty ?? 1 } })
  }
  const remove = (id: string | number) => dispatch({ type: 'remove', id })
  const updateQty = (id: string | number, qty: number) => dispatch({ type: 'update', id, qty })
  const clear = () => dispatch({ type: 'clear' })

  const value = useMemo(() => ({ items: state.items, add, remove, updateQty, clear }), [state.items])

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
