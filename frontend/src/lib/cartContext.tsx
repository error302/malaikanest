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
import { showToast } from '@/components/Toast'

type CartItem = {
  id: string | number
  name: string
  price: number
  image?: string
  qty: number
  slug?: string
  product_id?: number
}

type ApiCartItem = {
  id: number
  product: {
    id: number
    name: string
    slug?: string
    price: string | number
    image?: string | null
  }
  quantity: number
}

type CartData = {
  items: CartItem[]
  subtotal: string
  total: string
}

type ApiCartData = {
  items?: ApiCartItem[]
  subtotal?: string | number
  total?: string | number
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

function normalizeCartItem(item: ApiCartItem): CartItem {
  const price = typeof item.product?.price === 'number' ? item.product.price : Number(item.product?.price || 0)

  return {
    id: item.product?.id ?? item.id,
    product_id: item.product?.id,
    name: item.product?.name || 'Product',
    price: Number.isFinite(price) ? price : 0,
    image: item.product?.image || '',
    qty: item.quantity || 0,
    slug: item.product?.slug,
  }
}

function normalizeCartData(cartData: ApiCartData | null | undefined): CartData {
  const items = Array.isArray(cartData?.items) ? cartData.items.map(normalizeCartItem) : []

  return {
    items,
    subtotal: String(cartData?.subtotal ?? '0'),
    total: String(cartData?.total ?? '0'),
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, cartData: action.cartData, items: action.cartData.items }
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
      return { ...state, items: [], cartData: { items: [], subtotal: '0', total: '0' } }
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
      dispatch({ type: 'HYDRATE', cartData: normalizeCartData(res.data) })
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
      const res = await api.post('/api/orders/cart/add/', {
        product_id: item.id,
        quantity: fullItem.qty,
      })
      dispatch({ type: 'HYDRATE', cartData: normalizeCartData(res.data) })
    } catch (e: any) {
      console.error('Failed to add to cart', e)
      const msg = e?.response?.data?.detail || 'Failed to add to cart'
      showToast(msg, 'error')
      await fetchCart()
    } finally {
      setLoading(false)
    }
  }, [fetchCart])

  const remove = useCallback(async (id: string | number) => {
    dispatch({ type: 'REMOVE', id })

    setLoading(true)
    try {
      const res = await api.post(`/api/orders/cart/remove/${id}/`)
      dispatch({ type: 'HYDRATE', cartData: normalizeCartData(res.data) })
    } catch (e) {
      console.error('Failed to remove from cart', e)
      await fetchCart()
    } finally {
      setLoading(false)
    }
  }, [fetchCart])

  const updateQty = useCallback(async (id: string | number, qty: number) => {
    // Store previous state for rollback
    const previousItems = [...state.items]
    
    if (qty < 1) {
      return remove(id)
    }

    // Optimistic update - update UI immediately
    dispatch({ type: 'UPDATE', id, qty })
    
    // Debounce the API call to prevent race conditions
    const debounceKey = `cart_update_${id}`
    const existingTimeout = (window as any)[debounceKey]
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    
    ;(window as any)[debounceKey] = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await api.post(`/api/orders/cart/update/`, {
          product_id: id,
          quantity: qty,
        })
        dispatch({ type: 'HYDRATE', cartData: normalizeCartData(res.data) })
      } catch (e) {
        // Rollback on error
        dispatch({ type: 'HYDRATE', cartData: { items: previousItems, subtotal: '0', total: '0' } })
        console.error('Failed to update cart', e)
        await fetchCart()
      } finally {
        setLoading(false)
        ;(window as any)[debounceKey] = null
      }
    }, 300) // 300ms debounce
  }, [state.items, remove, fetchCart])

  const clear = useCallback(async () => {
    dispatch({ type: 'CLEAR' })

    setLoading(true)
    try {
      await api.post('/api/orders/cart/clear/')
      localStorage.removeItem(STORAGE_KEY)
      dispatch({ type: 'HYDRATE', cartData: { items: [], subtotal: '0', total: '0' } })
    } catch (e) {
      console.error('Failed to clear cart', e)
      await fetchCart()
    } finally {
      setLoading(false)
    }
  }, [fetchCart])

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
