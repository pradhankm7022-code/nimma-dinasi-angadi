import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { staffLogin, savePushSubscription } from '../../api'

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob(base64.replace(/-/g, '+').replace(/_/g, '/') + pad)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0))).buffer as ArrayBuffer
}

async function subscribePush() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !VAPID_PUBLIC) return
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    })
    await savePushSubscription(sub.toJSON() as PushSubscriptionJSON)
  } catch (e) {
    console.error('Push subscription failed:', e)
  }
}

export function StaffLoginPage() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const entryAllowed =
      sessionStorage.getItem('nda_staff_entry') === 'true' ||
      localStorage.getItem('nda_is_staff') === 'true'
    if (!entryAllowed) navigate('/', { replace: true })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await staffLogin(pin)
      sessionStorage.setItem('nda_staff', 'true')
      sessionStorage.setItem('nda_staff_token', res.staffToken)
      sessionStorage.setItem('nda_is_staff', 'true')
      sessionStorage.removeItem('nda_staff_entry')
      localStorage.setItem('nda_is_staff', 'true')
      subscribePush() // fire-and-forget — don't block navigation
      navigate('/staff/orders', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid PIN')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-xs">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Staff Login</h1>
        <p className="text-sm text-center text-gray-500 mb-6">Enter your PIN to continue</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
            <input
              type="password" inputMode="numeric" required value={pin} onChange={e => setPin(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-center tracking-widest outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              placeholder="••••"
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
            {loading ? 'Verifying…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
