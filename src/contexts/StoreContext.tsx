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
const CART_KEY = 'nda_cart'

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function writeCart(cart: CartItem[]) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)) } catch {}
}

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

function sortByOrderCount(products: Product[]) {
  return [...products].sort((a, b) => (b.order_count ?? 0) - (a.order_count ?? 0))
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const cached = readCache()

  const [storeName, setStoreName] = useState(cached?.storeName ?? 'Nimma Dinasi Angadi')
  const [storeLogo, setStoreLogo] = useState(cached?.storeLogo ?? '')
  const [categories, setCategories] = useState<Category[]>(cached?.categories ?? [])
  const [products] = useState<Product[]>(sortByOrderCount(cached?.products ?? []))
  const [loadingStore, setLoadingStore] = useState(!cached)
  const [cart, setCart] = useState<CartItem[]>(readCart())

  useEffect(() => {
    // Always fetch fresh in background — stale-while-revalidate
    // Products are NOT re-sorted after fetch to avoid visible list reorder
    Promise.all([getSettings(), getProducts()])
      .then(([settings, productsRes]) => {
        setStoreName(settings.store_name)
        setStoreLogo(settings.store_logo_url)
        setCategories(settings.categories)
        // Update cache with fresh order counts but don't change displayed order
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
      const next = idx >= 0
        ? prev.map((c, i) => i === idx ? { ...c, qty: c.qty + item.qty } : c)
        : [...prev, item]
      writeCart(next)
      return next
    })
  }

  function updateCartQty(productId: string, variantLabel: string, qty: number) {
    setCart(prev => {
      const next = qty <= 0
        ? prev.filter(c => !(c.product_id === productId && c.variant_label === variantLabel))
        : prev.map(c =>
            c.product_id === productId && c.variant_label === variantLabel ? { ...c, qty } : c
          )
      writeCart(next)
      return next
    })
  }

  function clearCart() {
    setCart([])
    writeCart([])
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
