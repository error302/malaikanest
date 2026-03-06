"use client"

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react'

import api from '@/lib/api'

type CartItem = {
  id: string | number
  name: string
  price: number
  image?: string
  qty: number
  slug?: string
  product_id?: number
}

type CartData = {
  items: CartItem[]
  subtotal: string
  total: string
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

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, cartData: action.cartData, items: action.cartData?.items || [] }
    case 'ADD': {
      const exists = state.items.find((i) => i.id === action.item.id)
      if (exists) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, qty: i.qty + action.item.qty } : i
          ),
        }
      }
      return { ...state, items: [...state.items, action.item] }
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case 'UPDATE':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, qty: action.qty } : i
        ),
      }
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

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get('/api/orders/cart/', { headers: { 'Cache-Control': 'no-store' } })
      dispatch({ type: 'HYDRATE', cartData: res.data })
      setSynced(true)
    } catch (e) {
      console.error('Failed to fetch cart', e)
    }
  }, [])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  useEffect(() => {
    if (!synced) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch (e) {
      console.error('Failed to persist cart', e)
    }
  }, [state.items, synced])

  const add = useCallback(async (item: Omit<CartItem, 'qty'> & { qty?: number }) => {
    const fullItem = { ...item, qty: item.qty ?? 1 }
    dispatch({ type: 'ADD', item: fullItem })

    setLoading(true)
    try {
      await api.post('/api/orders/cart/add/', {
        product_id: item.id,
        quantity: fullItem.qty,
      })
    } catch (e) {
      dispatch({ type: 'REMOVE', id: item.id })
      console.error('Failed to add to cart', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const remove = useCallback(async (id: string | number) => {
    const itemToRemove = state.items.find((i) => i.id === id)
    dispatch({ type: 'REMOVE', id })

    setLoading(true)
    try {
      await api.post(`/api/orders/cart/remove/${id}/`)
    } catch (e) {
      if (itemToRemove) {
        dispatch({ type: 'ADD', item: itemToRemove })
      }
      console.error('Failed to remove from cart', e)
    } finally {
      setLoading(false)
    }
  }, [state.items])

  const updateQty = useCallback(async (id: string | number, qty: number) => {
    if (qty < 1) {
      return remove(id)
    }

    const oldItem = state.items.find((i) => i.id === id)
    const oldQty = oldItem?.qty
    dispatch({ type: 'UPDATE', id, qty })

    setLoading(true)
    try {
      await api.post('/api/orders/cart/update/', {
        product_id: id,
        quantity: qty,
      })
    } catch (e) {
      if (oldQty !== undefined) {
        dispatch({ type: 'UPDATE', id, qty: oldQty })
      }
      console.error('Failed to update cart', e)
    } finally {
      setLoading(false)
    }
  }, [state.items, remove])

  const clear = useCallback(async () => {
    const currentItems = [...state.items]
    dispatch({ type: 'CLEAR' })

    setLoading(true)
    try {
      await api.post('/api/orders/cart/clear/')
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      currentItems.forEach((item) => {
        dispatch({ type: 'ADD', item })
      })
      console.error('Failed to clear cart', e)
    } finally {
      setLoading(false)
    }
  }, [state.items])

  const value = useMemo(
    () => ({
      items: state.items,
      add,
      remove,
      updateQty,
      clear,
      loading,
      synced,
    }),
    [state.items, add, remove, updateQty, clear, loading, synced]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
