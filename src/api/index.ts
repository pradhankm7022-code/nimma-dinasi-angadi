import type { CartItem, Product, StoreSettings } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL as string

async function call<T>(params: Record<string, unknown>): Promise<T> {
  const url = new URL(BASE_URL)
  url.searchParams.set('action', params.action as string)
  url.searchParams.set('payload', JSON.stringify(params))
  const res = await fetch(url.toString())
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Request failed')
  return data as T
}

// Auth
export const signUp = (name: string, email: string, password: string, phone: string) =>
  call<{ ok: true; user: { id: string; name: string; email: string; phone: string } }>({ action: 'signUp', name, email, password, phone })

export const signIn = (email: string, password: string) =>
  call<{ ok: true; user: { id: string; name: string; email: string; phone: string } }>({ action: 'signIn', email, password })

export const forgotPassword = (email: string) =>
  call<{ ok: true }>({ action: 'forgotPassword', email })

export const verifyOTP = (email: string, otp: string, newPassword: string) =>
  call<{ ok: true }>({ action: 'verifyOTP', email, otp, newPassword })

// Store data
export const getSettings = () =>
  call<{ ok: true } & StoreSettings>({ action: 'getSettings' })

export const getProducts = () =>
  call<{ ok: true; products: Product[] }>({ action: 'getProducts' })

// Orders
export const placeOrder = (customerId: string, items: CartItem[]) =>
  call<{ ok: true; order_number: string }>({ action: 'placeOrder', customerId, items })

export const getMyOrders = (customerId: string) =>
  call<{ ok: true; orders: unknown[] }>({ action: 'getMyOrders', customerId })

export const getAllOrders = () =>
  call<{ ok: true; orders: unknown[] }>({ action: 'getAllOrders' })

export const updateOrderStatus = (orderId: string, status: string) =>
  call<{ ok: true }>({ action: 'updateOrderStatus', orderId, status })

export const finishBagging = (orderId: string, items: CartItem[]) =>
  call<{ ok: true }>({ action: 'finishBagging', orderId, items })

// Staff auth
export const staffLogin = (pin: string) =>
  call<{ ok: true }>({ action: 'staffLogin', pin })

// Category CRUD (staff)
export const createCategory = (name: string, image_url: string) =>
  call<{ ok: true; id: string }>({ action: 'createCategory', name, image_url })

export const updateCategory = (id: string, name: string, image_url: string) =>
  call<{ ok: true }>({ action: 'updateCategory', id, name, image_url })

export const deleteCategory = (id: string) =>
  call<{ ok: true }>({ action: 'deleteCategory', id })

// Product CRUD (staff)
export const createProduct = (product: Omit<Product, 'id' | 'category'>) =>
  call<{ ok: true; id: string }>({
    action: 'createProduct',
    name_en: product.name_en,
    name_kn: product.name_kn,
    category_id: product.category_id,
    image_url: product.image_url,
    in_stock: product.in_stock,
    variants: product.variants,
    search_keys: product.search_keys,
  })

export const updateProduct = (product: Product) =>
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
  })

export const deleteProduct = (id: string) =>
  call<{ ok: true }>({ action: 'deleteProduct', id })

// Push notifications (staff)
export const savePushSubscription = (sub: PushSubscriptionJSON) =>
  call<{ ok: true }>({ action: 'savePushSubscription', subscription: sub })
