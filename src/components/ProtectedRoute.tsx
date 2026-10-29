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
  const staffAuthed = sessionStorage.getItem('nda_staff') === 'true'
  const sp = useStorePath()
  return staffAuthed ? <Outlet /> : <Navigate to={sp('/staff/login')} replace />
}
