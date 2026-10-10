import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

export function SignUpPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await signUp(form.name, form.email, form.password, form.phone)
      login(res.user)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Create account</h1>
        <p className="text-sm text-center text-gray-500 mb-6">Join Nimma Dinasi Angadi</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
          )}
          {[
            { label: 'Full Name', field: 'name', type: 'text', placeholder: 'Ravi Kumar' },
            { label: 'Email', field: 'email', type: 'email', placeholder: 'you@example.com' },
            { label: 'Phone', field: 'phone', type: 'tel', placeholder: '9876543210' },
            { label: 'Password', field: 'password', type: 'password', placeholder: '••••••••' },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type} required value={form[field as keyof typeof form]} onChange={set(field)}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
          ))}
          <button
            type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
