import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
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
      navigate('/staff/login')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await signIn(email, password)
      login(res.user)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
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

        <div className="text-center mt-4 space-y-2">
          <Link to="/forgot-password" className="block text-sm text-green-600 hover:underline">Forgot password?</Link>
          <p className="text-sm text-gray-500">
            No account?{' '}
            <Link to="/signup" className="text-green-600 hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
