"use client"

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react'

import api, { handleApiError } from '@/lib/api'
import { showToast } from '@/components/Toast'

type CartItem = {
  id: string | number
  name: string
  price: number
  image?: string
  qty: number
  slug?: string
  product_id?: number
  variant_id?: number
  variant_label?: string
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
  variant?: {
    id: number
    color?: string
    color_label?: string
    size?: string
    size_label?: string
    image?: string | null
  } | null
  quantity: number
  unit_price?: string | number
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
  const unitPrice = typeof item.unit_price === 'number'
    ? item.unit_price
    : Number(item.unit_price ?? item.product?.price ?? 0)
  const cartKey = item.variant?.id ? `variant-${item.variant.id}` : `product-${item.product?.id ?? item.id}`

  return {
    id: cartKey,
    product_id: item.product?.id,
    variant_id: item.variant?.id,
    variant_label: item.variant?.color_label || item.variant?.size_label || undefined,
    name: item.variant?.color_label ? `${item.product?.name || 'Product'} - ${item.variant.color_label}` : item.product?.name || 'Product',
    price: Number.isFinite(unitPrice) ? unitPrice : 0,
    image: item.variant?.image || item.product?.image || '',
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
  
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/orders/cart/', { headers: { 'Cache-Control': 'no-store' } })
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
    return () => {
      debounceTimersRef.current.forEach((timer) => clearTimeout(timer))
      debounceTimersRef.current.clear()
    }
  }, [])

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
      const res = await api.post('/api/v1/orders/cart/add/', {
        product_id: item.product_id ?? item.id,
        variant_id: item.variant_id,
        quantity: fullItem.qty,
      })
      dispatch({ type: 'HYDRATE', cartData: normalizeCartData(res.data) })
    } catch (e: any) {
      console.error('Failed to add to cart', e)
      const msg = handleApiError(e, 'Failed to add to cart')
      showToast(msg, 'error')
      await fetchCart()
    } finally {
      setLoading(false)
    }
  }, [fetchCart])

  const remove = useCallback(async (id: string | number) => {
    dispatch({ type: 'REMOVE', id })
    const item = state.items.find((entry) => entry.id === id)

    setLoading(true)
    try {
      if (!item?.product_id) {
        throw new Error('Cart item not found')
      }
      const res = await api.post(`/api/v1/orders/cart/remove/${item.product_id}/`, {
        variant_id: item.variant_id,
      })
      dispatch({ type: 'HYDRATE', cartData: normalizeCartData(res.data) })
    } catch (e) {
      console.error('Failed to remove from cart', e)
      await fetchCart()
    } finally {
      setLoading(false)
    }
  }, [fetchCart, state.items])

  const updateQty = useCallback(async (id: string | number, qty: number) => {
    const item = state.items.find((entry) => entry.id === id)
    const previousItems = [...state.items]
    
    if (qty < 1) {
      return remove(id)
    }

    dispatch({ type: 'UPDATE', id, qty })
    
    const debounceKey = String(id)
    
    const existingTimer = debounceTimersRef.current.get(debounceKey)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        if (!item?.product_id) {
          throw new Error('Cart item not found')
        }
        const res = await api.post(`/api/v1/orders/cart/update/`, {
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: qty,
        })
        dispatch({ type: 'HYDRATE', cartData: normalizeCartData(res.data) })
      } catch (e) {
        dispatch({ type: 'HYDRATE', cartData: { items: previousItems, subtotal: '0', total: '0' } })
        console.error('Failed to update cart', e)
        await fetchCart()
      } finally {
        setLoading(false)
        debounceTimersRef.current.delete(debounceKey)
      }
    }, 300)
    
    debounceTimersRef.current.set(debounceKey, timer)
  }, [state.items, remove, fetchCart])

  const clear = useCallback(async () => {
    dispatch({ type: 'CLEAR' })

    setLoading(true)
    try {
      await api.post('/api/v1/orders/cart/clear/')
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
