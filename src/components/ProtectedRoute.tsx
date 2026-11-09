import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStorePath } from '../lib/useStorePath'

export function RequireAuth() {
  const { user, loading } = useAuth()
  const sp = useStorePath()
  if (loading) return null
  if (user) return <Outlet />
  if (localStorage.getItem('nda_is_staff') === 'true') return <Navigate to={sp('/staff/login')} replace />
  return <Navigate to={sp('/login')} replace />
}

export function RequireStaff() {
  const staffAuthed = (() => {
    if (sessionStorage.getItem('nda_staff') === 'true') return true
    const token = localStorage.getItem('nda_staff_token')
    const expiry = Number(localStorage.getItem('nda_staff_token_expiry') || 0)
    return !!token && Date.now() < expiry
  })()
  const sp = useStorePath()
  return staffAuthed ? <Outlet /> : <Navigate to={sp('/staff/login')} replace />
}
