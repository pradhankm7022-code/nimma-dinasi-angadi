import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export function RequireStaff() {
  const staffAuthed = sessionStorage.getItem('nda_staff') === 'true'
  return staffAuthed ? <Outlet /> : <Navigate to="/staff/login" replace />
}
