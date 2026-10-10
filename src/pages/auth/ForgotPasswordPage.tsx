import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword, verifyOTP } from '../../api'

type Step = 'email' | 'otp'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setStep('otp')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyOTP(email, otp, newPassword)
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Reset password</h1>
        <p className="text-sm text-center text-gray-500 mb-6">
          {step === 'email' ? 'Enter your email to receive an OTP' : `OTP sent to ${email}`}
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  placeholder="you@example.com"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
                <input
                  type="text" required value={otp} onChange={e => setOtp(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  placeholder="Enter 6-digit OTP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                {loading ? 'Verifying…' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-4 text-sm text-gray-500">
          <Link to="/login" className="text-green-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  )
}
