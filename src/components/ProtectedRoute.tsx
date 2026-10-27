import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Outlet />
  // Staff device should go to staff PIN, not customer login
  if (sessionStorage.getItem('nda_is_staff') === 'true') return <Navigate to="/staff/login" replace />
  return <Navigate to="/login" replace />
}

export function RequireStaff() {
  const staffAuthed = sessionStorage.getItem('nda_staff') === 'true'
  return staffAuthed ? <Outlet /> : <Navigate to="/staff/login" replace />
}
