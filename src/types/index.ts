export interface ProductVariant {
  label: string
  price: number
  default?: boolean
}

export interface Product {
  id: string
  name_en: string
  name_kn: string
  category_id: string
  category: string
  image_url: string
  in_stock: boolean
  variants: ProductVariant[]
  search_keys: string
  order_count: number
}

export interface Category {
  id: string
  name: string
  name_kn: string
  image_url: string
}

export interface StoreSettings {
  store_name: string
  store_logo_url: string
  store_config?: string
  categories: Category[]
}

export interface StoreConfig {
  showPrice?: boolean
  showStaffPrice?: boolean
}

export interface CartItem {
  product_id: string
  product_name_en: string
  product_name_kn: string
  product_image_url: string
  variant_label: string
  variant_price: number
  qty: number
  available?: boolean // set by staff during bagging; undefined = not yet bagged
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  customer_name?: string
  customer_phone?: string
  items: CartItem[]
  photo_urls?: string[]
  status: 'Pending' | 'Ready' | 'Picked Up'
  created_at: string
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
}
