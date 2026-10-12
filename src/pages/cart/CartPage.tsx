import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomNav } from '../../components/ui/BottomNav'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'
import { placeOrder } from '../../api'

export function CartPage() {
  const { cart, updateCartQty, clearCart } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePlaceOrder() {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const res = await placeOrder(user.id, cart)
      clearCart()
      navigate('/orders', { state: { newOrder: res.order_number } })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">Cart</h1>
      </div>

      <div className="px-4 pt-4">
        {cart.length === 0 ? (
          <div className="text-center text-gray-400 py-16 text-sm">Your cart is empty</div>
        ) : (
          <div className="space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
            )}
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

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mt-2">
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
