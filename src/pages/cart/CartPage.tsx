import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomNav } from '../../components/ui/BottomNav'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'
import { placeOrder } from '../../api'
import { uploadToCloudinary } from '../../lib/cloudinary'

const PHOTOS_KEY = 'nda_cart_photos'

function readPhotos(): string[] {
  try { return JSON.parse(localStorage.getItem(PHOTOS_KEY) || '[]') } catch { return [] }
}
function writePhotos(urls: string[]) {
  try { localStorage.setItem(PHOTOS_KEY, JSON.stringify(urls)) } catch {}
}

export function CartPage() {
  const { cart, updateCartQty, clearCart } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>(readPhotos)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    setError('')
    try {
      const url = await uploadToCloudinary(file)
      setPhotoUrls(prev => {
        const next = [...prev, url]
        writePhotos(next)
        return next
      })
    } catch {
      setError('Photo upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  function removePhoto(idx: number) {
    setPhotoUrls(prev => {
      const next = prev.filter((_, i) => i !== idx)
      writePhotos(next)
      return next
    })
  }

  async function handlePlaceOrder() {
    if (!user) return
    if (cart.length === 0 && photoUrls.length === 0) {
      setError('Add items or photos to place an order.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await placeOrder(user.id, cart, photoUrls)
      clearCart()
      setPhotoUrls([])
      writePhotos([])
      navigate('/orders', { state: { newOrder: res.order_number } })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  const isEmpty = cart.length === 0 && photoUrls.length === 0

  return (
    <div className="min-h-svh bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Cart</h1>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCameraCapture}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 disabled:opacity-40 text-green-700 font-medium text-sm px-3 py-1.5 rounded-lg transition-colors relative"
          title="Add photo item"
        >
          {uploading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          <span>{uploading ? 'Uploading…' : 'Add Photo'}</span>
          {photoUrls.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {photoUrls.length}
            </span>
          )}
        </button>
      </div>

      <div className="px-4 pt-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">{error}</div>
        )}

        {isEmpty ? (
          <div className="text-center text-gray-400 py-16 text-sm">Your cart is empty</div>
        ) : (
          <div className="space-y-3">
            {/* Cart items */}
            {cart.map(item => (
              <div key={`${item.product_id}-${item.variant_label}`} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3 shadow-sm">
                <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {item.product_image_url ? (
                    <img src={item.product_image_url} alt={item.product_name_en} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.product_name_en}</p>
                  <p className="text-xs text-gray-400">{item.product_name_kn}</p>
                  <p className="text-xs text-green-700 font-medium mt-0.5">{item.variant_label}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center bg-green-600 rounded-lg overflow-hidden">
                    <button onClick={() => updateCartQty(item.product_id, item.variant_label, item.qty - 1)}
                      className="px-3 py-1 text-white font-bold text-lg leading-none active:bg-green-700">−</button>
                    <span className="px-2 py-1 text-white font-bold text-sm min-w-[24px] text-center">{item.qty}</span>
                    <button onClick={() => updateCartQty(item.product_id, item.variant_label, item.qty + 1)}
                      className="px-3 py-1 text-white font-bold text-lg leading-none active:bg-green-700">+</button>
                  </div>
                </div>
              </div>
            ))}

            {/* Photo items inline */}
            {photoUrls.map((url, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3 shadow-sm">
                <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <img src={url} alt={`Photo item ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Photo Item {idx + 1}</p>
                  <p className="text-xs text-gray-400">ಫೋಟೋ ಐಟಂ</p>
                </div>
                <button
                  onClick={() => removePhoto(idx)}
                  className="self-start p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Place order */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <button
                onClick={handlePlaceOrder} disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                {loading ? 'Placing order…' : 'Place Order'}
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
