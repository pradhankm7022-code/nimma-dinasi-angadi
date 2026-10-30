import type { CartItem, Product, StoreSettings } from '../types'

let _storeUrl: string | null = null

export function setStoreUrl(url: string) {
  _storeUrl = url
}

function getBaseUrl(): string {
  if (_storeUrl) return _storeUrl
  // fallback to env var for single-store / dev mode
  return import.meta.env.VITE_API_URL as string
}

async function callOnce<T>(params: Record<string, unknown>): Promise<T> {
  const payload = encodeURIComponent(JSON.stringify(params))
  const res = await fetch(`${getBaseUrl()}?action=${params.action as string}&payload=${payload}`)
  const text = await res.text()
  let data: Record<string, unknown>
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('html')
  }
  if (!data.ok) throw new Error(data.error as string || 'Request failed')
  return data as T
}

async function call<T>(params: Record<string, unknown>): Promise<T> {
  try {
    return await callOnce<T>(params)
  } catch (err) {
    if (err instanceof Error && err.message === 'html') {
      // Google Apps Script returned HTML (timeout/cold start) — retry once
      try {
        return await callOnce<T>(params)
      } catch (err2) {
        if (err2 instanceof Error && err2.message === 'html') {
          throw new Error('Server error — please try again')
        }
        throw err2
      }
    }
    throw err
  }
}

// Auth
export const signUp = (name: string, email: string, password: string, phone: string) =>
  call<{ ok: true; user: { id: string; name: string; email: string; phone: string }; token: string }>({ action: 'signUp', name, email, password, phone })

export const signIn = (email: string, password: string) =>
  call<{ ok: true; user: { id: string; name: string; email: string; phone: string }; token: string }>({ action: 'signIn', email, password })

export const forgotPassword = (email: string) =>
  call<{ ok: true }>({ action: 'forgotPassword', email })

export const verifyOTP = (email: string, otp: string, newPassword: string) =>
  call<{ ok: true }>({ action: 'verifyOTP', email, otp, newPassword })

export const updatePhone = (customerId: string, token: string, phone: string) =>
  call<{ ok: true; phone: string }>({ action: 'updatePhone', customerId, token, phone })

// Store data
export const getSettings = () =>
  call<{ ok: true } & StoreSettings>({ action: 'getSettings' })

export const getProducts = () =>
  call<{ ok: true; products: Product[] }>({ action: 'getProducts' })

// Orders
export const placeOrder = (customerId: string, token: string, items: CartItem[], photoUrls?: string[]) =>
  call<{ ok: true; order_number: string }>({ action: 'placeOrder', customerId, token, items, photoUrls: photoUrls ?? [] })

export const getMyOrders = (customerId: string, token: string) =>
  call<{ ok: true; orders: unknown[] }>({ action: 'getMyOrders', customerId, token })

export const getAllOrders = (staffToken: string) =>
  call<{ ok: true; orders: unknown[] }>({ action: 'getAllOrders', staffToken })

export const updateOrderStatus = (orderId: string, status: string, staffToken: string) =>
  call<{ ok: true }>({ action: 'updateOrderStatus', orderId, status, staffToken })

export const finishBagging = (orderId: string, items: CartItem[], staffToken: string) =>
  call<{ ok: true }>({ action: 'finishBagging', orderId, items, staffToken })

// Staff auth
export const staffLogin = (pin: string) =>
  call<{ ok: true; staffToken: string }>({ action: 'staffLogin', pin })

// Category CRUD (staff)
export const createCategory = (name: string, image_url: string, staffToken: string) =>
  call<{ ok: true; id: string }>({ action: 'createCategory', name, image_url, staffToken })

export const updateCategory = (id: string, name: string, image_url: string, staffToken: string) =>
  call<{ ok: true }>({ action: 'updateCategory', id, name, image_url, staffToken })

export const deleteCategory = (id: string, staffToken: string) =>
  call<{ ok: true }>({ action: 'deleteCategory', id, staffToken })

// Product CRUD (staff)
export const createProduct = (product: Omit<Product, 'id' | 'category'>, staffToken: string) =>
  call<{ ok: true; id: string }>({
    action: 'createProduct',
    name_en: product.name_en,
    name_kn: product.name_kn,
    category_id: product.category_id,
    image_url: product.image_url,
    in_stock: product.in_stock,
    variants: product.variants,
    search_keys: product.search_keys,
    staffToken,
  })

export const updateProduct = (product: Product, staffToken: string) =>
  call<{ ok: true }>({
    action: 'updateProduct',
    id: product.id,
    name_en: product.name_en,
    name_kn: product.name_kn,
    category_id: product.category_id,
    image_url: product.image_url,
    in_stock: product.in_stock,
    variants: product.variants,
    search_keys: product.search_keys,
    staffToken,
  })

export const deleteProduct = (id: string, staffToken: string) =>
  call<{ ok: true }>({ action: 'deleteProduct', id, staffToken })

// Push notifications (staff)
export const savePushSubscription = (sub: PushSubscriptionJSON) =>
  call<{ ok: true }>({ action: 'savePushSubscription', subscription: sub })
