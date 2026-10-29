import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { RequireAuth, RequireStaff } from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { LangProvider } from './contexts/LangContext'
import { StoreProvider } from './contexts/StoreContext'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignUpPage } from './pages/auth/SignUpPage'
import { CartPage } from './pages/cart/CartPage'
import { CatalogPage } from './pages/catalog/CatalogPage'
import { CategoryProductsPage } from './pages/catalog/CategoryProductsPage'
import { OrdersPage } from './pages/orders/OrdersPage'
import { StaffLoginPage } from './pages/staff/StaffLoginPage'
import { StaffOrdersPage } from './pages/staff/StaffOrdersPage'
import { StaffProductsPage } from './pages/staff/StaffProductsPage'
import { resolveStoreUrl } from './lib/store-resolver'
import { setStoreUrl } from './api'

const scrollCache = new Map<string, number>()

function ScrollRestoration() {
  const { pathname, search } = useLocation()
  const key = pathname + search
  const prevKey = useRef(key)

  useEffect(() => {
    scrollCache.set(prevKey.current, window.scrollY)
    prevKey.current = key
    const saved = scrollCache.get(key)
    window.scrollTo(0, saved ?? 0)
  }, [key])

  return null
}

function BackButtonHandler() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { slug } = useParams<{ slug: string }>()
  const base = `/s/${slug}`

  useEffect(() => {
    if (pathname === `${base}/staff/login` || pathname === `${base}/staff/orders` ||
        pathname === `${base}/login` || pathname === `${base}/signup` ||
        pathname === `${base}/forgot-password` || pathname === base || pathname === `${base}/`) return

    window.history.pushState({ page: pathname }, '')

    function handlePopState() {
      if (pathname === base || pathname === `${base}/staff/orders`) {
        return
      } else if (pathname.startsWith(`${base}/staff/`)) {
        window.history.pushState({ page: pathname }, '')
        navigate(`${base}/staff/orders`, { replace: true })
      } else if (pathname.startsWith(`${base}/category/`)) {
        window.history.pushState({ page: pathname }, '')
        navigate(`${base}/?view=categories`, { replace: true })
      } else {
        window.history.pushState({ page: pathname }, '')
        navigate(base, { replace: true })
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [pathname, navigate])

  return null
}

// Resolves slug → store GAS URL before rendering the app
function StoreLoader({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) { setError('No store slug in URL'); return }
    resolveStoreUrl(slug)
      .then(url => { setStoreUrl(url); setReady(true) })
      .catch(() => setError('Store not found'))
  }, [slug])

  if (error) return (
    <div className="min-h-svh flex items-center justify-center text-gray-500 text-sm">{error}</div>
  )
  if (!ready) return (
    <div className="min-h-svh flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  )
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/s/:slug/*" element={
          <StoreLoader>
            <AuthProvider>
              <LangProvider>
                <StoreProvider>
                  <BackButtonHandler />
                  <ScrollRestoration />
                  <StoreRoutes />
                </StoreProvider>
              </LangProvider>
            </AuthProvider>
          </StoreLoader>
        } />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function StoreRoutes() {
  const { slug } = useParams<{ slug: string }>()
  const base = `/s/${slug}`

  return (
    <Routes>
      {/* Auth */}
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignUpPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />

      {/* Customer (protected) */}
      <Route element={<RequireAuth />}>
        <Route path="" element={<CatalogPage />} />
        <Route path="category/:id" element={<CategoryProductsPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="orders" element={<OrdersPage />} />
      </Route>

      {/* Staff */}
      <Route path="staff/login" element={<StaffLoginPage />} />
      <Route element={<RequireStaff />}>
        <Route path="staff/orders" element={<StaffOrdersPage />} />
        <Route path="staff/products" element={<StaffProductsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={
        localStorage.getItem('nda_is_staff') === 'true'
          ? <Navigate to={`${base}/staff/login`} replace />
          : <Navigate to={`${base}/login`} replace />
      } />
    </Routes>
  )
}
