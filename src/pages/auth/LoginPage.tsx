import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'

type Step = 'ask' | 'signin'

export function LoginPage() {
  const { login } = useAuth()
  const { storeName, storeLogo } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('ask')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tapCount, setTapCount] = useState(0)

  function handleTitleTap() {
    const next = tapCount + 1
    setTapCount(next)
    if (next >= 5) {
      setTapCount(0)
      sessionStorage.setItem('nda_staff_entry', 'true')
      navigate('/staff/login')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await signIn(email, password)
      login(res.user, res.token)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'ask') {
    return (
      <div className="min-h-svh flex flex-col bg-gray-50">
        {/* Green hero banner */}
        <div className="bg-green-600 flex flex-col items-center justify-center pt-16 pb-12 px-4 flex-1">
          {/* Logo or initials */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center mb-5 shadow-lg">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-white select-none">
                {storeName.charAt(0)}
              </span>
            )}
          </div>

          {/* Store name */}
          <h1 className="text-3xl font-bold text-white text-center leading-tight select-none">
            {storeName}
          </h1>
          <p className="text-green-100 text-sm mt-2 text-center">ನಿಮ್ಮ ದಿನಸಿ ಅಂಗಡಿ</p>
        </div>

        {/* Bottom card */}
        <div className="bg-white rounded-t-3xl -mt-6 px-6 pt-8 pb-10 shadow-lg">
          <p className="text-lg font-semibold text-gray-800 text-center mb-1">Welcome!</p>
          <p className="text-sm text-gray-500 text-center mb-7">Are you shopping with us for the first time?</p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/signup')}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors shadow-sm"
            >
              Yes, create an account
            </button>
            <button
              onClick={() => setStep('signin')}
              className="w-full bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-800 font-semibold py-3.5 rounded-xl text-sm transition-colors"
            >
              No, I already have an account
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <button onClick={() => setStep('ask')} className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1 select-none" onClick={handleTitleTap}>Welcome back</h1>
        <p className="text-sm text-center text-gray-500 mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-4">
          <a href="/forgot-password" className="text-sm text-green-600 hover:underline">Forgot password?</a>
        </div>
      </div>
    </div>
  )
}
