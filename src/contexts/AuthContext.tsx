import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  sessionToken: string | null
  loading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (partial: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'nda_user'
const TOKEN_KEY = 'nda_user_token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const token = localStorage.getItem(TOKEN_KEY)
      if (stored) setUser(JSON.parse(stored))
      if (token) setSessionToken(token)
    } catch {}
    setLoading(false)
  }, [])

  function login(user: User, token: string) {
    setUser(user)
    setSessionToken(token)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    localStorage.setItem(TOKEN_KEY, token)
  }

  function logout() {
    setUser(null)
    setSessionToken(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }

  function updateUser(partial: Partial<User>) {
    setUser(prev => {
      if (!prev) return prev
      const next = { ...prev, ...partial }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, sessionToken, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
