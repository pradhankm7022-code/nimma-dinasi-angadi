import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { useStorePath } from '../../lib/useStorePath'

export function SignUpPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const sp = useStorePath()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const hasContactPicker = 'contacts' in navigator && 'ContactsManager' in window

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function pickAccount() {
    try {
      const contacts = await (navigator as any).contacts.select(['email'], { multiple: false })
      if (contacts.length && contacts[0].email?.length) {
        setForm(f => ({ ...f, email: contacts[0].email[0] }))
      }
    } catch {
      // cancelled or unavailable — do nothing
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const res = await signUp(form.name, form.email, form.password, form.phone)
      login(res.user, res.token)
      navigate(sp('/'), { replace: true })
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text" required value={form.name} onChange={set('name')}
              placeholder="Ravi Kumar"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required value={form.email} onChange={set('email')}
              placeholder="you@example.com" autoComplete="email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            {hasContactPicker && (
              <button type="button" onClick={pickAccount}
                className="mt-1.5 flex items-center gap-1 text-xs text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
                Select from Google account
              </button>
            )}
          </div>
          {[
            { label: 'Phone', field: 'phone', type: 'tel', placeholder: '9876543210', hint: '' },
            { label: 'Set Password', field: 'password', type: 'password', placeholder: '••••••••', hint: 'At least 6 characters' },
          ].map(({ label, field, type, placeholder, hint }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type} required value={form[field as keyof typeof form]} onChange={set(field)}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
              {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
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
          <Link to={sp('/login')} className="text-green-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
