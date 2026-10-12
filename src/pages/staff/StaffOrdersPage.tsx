import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAllOrders, finishBagging, updateOrderStatus } from '../../api'
import type { CartItem, Order } from '../../types'

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Ready: 'bg-blue-100 text-blue-700',
  'Picked Up': 'bg-green-100 text-green-700',
}

type ItemState = 'pending' | 'bagged' | 'unavailable'

export function StaffOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  // orderId -> array of item states
  const [bagging, setBagging] = useState<Record<string, ItemState[]>>({})

  const navigate = useNavigate()

  useEffect(() => {
    // Replace entire history stack so back button exits the app
    window.history.replaceState(null, '', '/staff/orders')
  }, [])

  function handleLogout() {
    sessionStorage.removeItem('nda_staff')
    localStorage.removeItem('nda_is_staff')
    navigate('/staff/login', { replace: true })
  }

  useEffect(() => {
    getAllOrders()
      .then(res => setOrders(res.orders as Order[]))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function startBagging(order: Order) {
    setBagging(prev => ({
      ...prev,
      [order.id]: order.items.map(() => 'pending'),
    }))
  }

  async function setItemState(order: Order, idx: number, state: ItemState) {
    const current = bagging[order.id] ?? order.items.map(() => 'pending' as ItemState)
    const next = current.map((s, i) => i === idx ? state : s)
    setBagging(prev => ({ ...prev, [order.id]: next }))

    // All items resolved → finish bagging
    const allDone = next.every(s => s !== 'pending')
    if (allDone) {
      setUpdating(order.id)
      const updatedItems: CartItem[] = order.items.map((item, i) => ({
        ...item,
        available: next[i] === 'bagged',
      }))
      try {
        await finishBagging(order.id, updatedItems)
        setOrders(prev => prev.map(o =>
          o.id === order.id ? { ...o, status: 'Ready', items: updatedItems } : o
        ))
        setBagging(prev => { const s = { ...prev }; delete s[order.id]; return s })
      } catch (e) { console.error(e) }
      setUpdating(null)
    }
  }

  async function changeStatus(orderId: string, status: Order['status']) {
    setUpdating(orderId)
    try {
      await updateOrderStatus(orderId, status)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    } catch (e) { console.error(e) }
    setUpdating(null)
  }

  return (
    <div className="min-h-svh bg-gray-50 pb-6">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Orders</h1>
        <div className="flex items-center gap-3">
          <Link to="/staff/products" className="text-sm text-green-600 font-medium hover:underline">Products</Link>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors" title="Logout">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-400 py-16 text-sm">No orders yet</div>
        ) : (
          orders.map(order => {
            const isExpanded = expanded === order.id
            const itemStates = bagging[order.id]
            const isBagging = !!itemStates
            const doneCount = itemStates?.filter(s => s !== 'pending').length ?? 0

            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <div>
                    <p className="text-sm font-bold text-gray-900">{order.order_number}</p>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
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

                {/* Expanded */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
                    <ul className="space-y-2">
                      {order.items.map((item, i) => {
                        const state: ItemState = itemStates?.[i] ?? (
                          item.available === false || item.available as unknown === 'false' ? 'unavailable' :
                          item.available === true || item.available as unknown === 'true' ? 'bagged' :
                          'pending'
                        )
                        return (
                          <li key={i} className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 transition-colors ${
                            state === 'bagged' ? 'bg-green-50' :
                            state === 'unavailable' ? 'bg-red-50' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`truncate ${
                                state === 'unavailable' ? 'line-through text-red-400' :
                                state === 'bagged' ? 'text-gray-400' : 'text-gray-700'
                              }`}>
                                {item.product_name_en}
                                <span className="text-gray-400 ml-1">({item.variant_label})</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span className="text-gray-500 text-xs">x{item.qty}</span>
                              {isBagging && state === 'pending' && (
                                <>
                                  <button
                                    onClick={() => setItemState(order, i, 'bagged')}
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                                  >
                                    ✓ Bagged
                                  </button>
                                  <button
                                    onClick={() => setItemState(order, i, 'unavailable')}
                                    className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                                  >
                                    ✕
                                  </button>
                                </>
                              )}
                              {!isBagging && state === 'unavailable' && (
                                <span className="text-xs text-red-500 font-semibold">✕ No stock</span>
                              )}
                              {!isBagging && state === 'bagged' && (
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>

                    {order.status === 'Pending' && !isBagging && (
                      <button
                        onClick={() => startBagging(order)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        Start Bagging
                      </button>
                    )}

                    {order.status === 'Pending' && isBagging && (
                      <p className="text-xs text-center text-gray-400">
                        {doneCount} / {order.items.length} items done
                        {updating === order.id && ' · Saving…'}
                      </p>
                    )}

                    {order.status === 'Ready' && (
                      <button
                        disabled={updating === order.id}
                        onClick={() => changeStatus(order.id, 'Picked Up')}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        Mark Picked Up
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
