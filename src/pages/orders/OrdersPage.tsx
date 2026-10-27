import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from '../../components/ui/BottomNav'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'
import { getMyOrders } from '../../api'
import type { Order } from '../../types'

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Ready: 'bg-blue-100 text-blue-700',
  'Picked Up': 'bg-green-100 text-green-700',
}

export function OrdersPage() {
  const { user } = useAuth()
  const { addToCart } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const newOrder = (location.state as { newOrder?: string } | null)?.newOrder
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [reordered, setReordered] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getMyOrders(user.id)
      .then(res => setOrders(res.orders as Order[]))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  function handleReorder(order: Order) {
    order.items.forEach(item => {
      addToCart({
        product_id: item.product_id,
        product_name_en: item.product_name_en,
        product_name_kn: item.product_name_kn,
        product_image_url: item.product_image_url,
        variant_label: item.variant_label,
        variant_price: item.variant_price,
        qty: item.qty,
      })
    })
    setReordered(order.id)
    setTimeout(() => navigate('/cart'), 800)
  }

  return (
    <div className="min-h-svh bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">My Orders</h1>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {newOrder && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
            Order <span className="font-bold">{newOrder}</span> placed successfully!
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
        ) : error ? (
          <div className="text-center text-red-400 py-16 text-sm">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-400 py-16 text-sm">No orders yet</div>
        ) : (
          orders.map(order => {
            const isExpanded = expanded === order.id
            const isReordering = reordered === order.id
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header row */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <div>
                    <p className="text-sm font-bold text-gray-900">{order.order_number}</p>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                    <ul className="space-y-1">
                      {order.items.map((item, i) => (
                        <li key={i} className="flex justify-between text-xs">
                          <span className={item.available === false ? 'line-through text-gray-400' : 'text-gray-600'}>
                            {item.product_name_en} <span className="text-gray-400">({item.variant_label})</span>
                            {item.available === false && <span className="ml-1 text-red-400 no-underline">· Not available</span>}
                          </span>
                          <span className={`font-medium ${item.available === false ? 'text-gray-300' : 'text-gray-600'}`}>x{item.qty}</span>
                        </li>
                      ))}
                    </ul>
                    {order.photo_urls && order.photo_urls.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {order.photo_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 block"
                          >
                            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                    {order.items.length > 0 && (
                      <button
                        onClick={() => handleReorder(order)}
                        disabled={isReordering}
                        className="w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 disabled:opacity-50 text-green-700 font-semibold text-sm py-2.5 rounded-xl transition-colors"
                      >
                        {isReordering ? (
                          'Adding to cart…'
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reorder
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <BottomNav />
    </div>
  )
}
