import { createContext, useContext, useEffect, useState } from 'react'
import { getProducts, getSettings } from '../api'
import type { CartItem, Category, Product } from '../types'

interface StoreContextValue {
  storeName: string
  storeLogo: string
  categories: Category[]
  setCategories: (cats: Category[]) => void
  products: Product[]
  loadingStore: boolean
  // Cart
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  updateCartQty: (productId: string, variantLabel: string, qty: number) => void
  clearCart: () => void
  cartCount: number
}

const StoreContext = createContext<StoreContextValue | null>(null)

const CACHE_KEY = 'nda_store_cache'

interface StoreCache {
  storeName: string
  storeLogo: string
  categories: Category[]
  products: Product[]
}

function readCache(): StoreCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeCache(data: StoreCache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch {}
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const cached = readCache()

  const [storeName, setStoreName] = useState(cached?.storeName ?? 'Nimma Dinasi Angadi')
  const [storeLogo, setStoreLogo] = useState(cached?.storeLogo ?? '')
  const [categories, setCategories] = useState<Category[]>(cached?.categories ?? [])
  const [products, setProducts] = useState<Product[]>(cached?.products ?? [])
  const [loadingStore, setLoadingStore] = useState(!cached) // no spinner if cache exists
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    // Always fetch fresh in background — stale-while-revalidate
    Promise.all([getSettings(), getProducts()])
      .then(([settings, productsRes]) => {
        setStoreName(settings.store_name)
        setStoreLogo(settings.store_logo_url)
        setCategories(settings.categories)
        setProducts(productsRes.products)
        writeCache({
          storeName: settings.store_name,
          storeLogo: settings.store_logo_url,
          categories: settings.categories,
          products: productsRes.products,
        })
      })
      .catch(console.error)
      .finally(() => setLoadingStore(false))
  }, [])

  function addToCart(item: CartItem) {
    setCart(prev => {
      const idx = prev.findIndex(
        c => c.product_id === item.product_id && c.variant_label === item.variant_label
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty }
        return next
      }
      return [...prev, item]
    })
  }

  function updateCartQty(productId: string, variantLabel: string, qty: number) {
    setCart(prev =>
      qty <= 0
        ? prev.filter(c => !(c.product_id === productId && c.variant_label === variantLabel))
        : prev.map(c =>
            c.product_id === productId && c.variant_label === variantLabel ? { ...c, qty } : c
          )
    )
  }

  function clearCart() {
    setCart([])
  }

  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0)

  return (
    <StoreContext.Provider value={{
      storeName, storeLogo, categories, setCategories, products, loadingStore,
      cart, addToCart, updateCartQty, clearCart, cartCount,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
