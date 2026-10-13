import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
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

const scrollCache = new Map<string, number>()

function ScrollRestoration() {
  const { pathname, search } = useLocation()
  const key = pathname + search
  const prevKey = useRef(key)

  useEffect(() => {
    // Save scroll position of the page we're leaving
    scrollCache.set(prevKey.current, window.scrollY)
    prevKey.current = key

    // Restore scroll position for the page we're entering
    const saved = scrollCache.get(key)
    window.scrollTo(0, saved ?? 0)
  }, [key])

  return null
}

function BackButtonHandler() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname === '/staff/login' || pathname === '/staff/orders' ||
        pathname === '/login' || pathname === '/signup' ||
        pathname === '/forgot-password' || pathname === '/') return

    window.history.pushState({ page: pathname }, '')

    function handlePopState() {
      if (pathname === '/' || pathname === '/staff/orders') {
        return
      } else if (pathname.startsWith('/staff/')) {
        window.history.pushState({ page: pathname }, '')
        navigate('/staff/orders', { replace: true })
      } else if (pathname.startsWith('/category/')) {
        window.history.pushState({ page: pathname }, '')
        navigate('/?view=categories', { replace: true })
      } else {
        window.history.pushState({ page: pathname }, '')
        navigate('/', { replace: true })
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [pathname, navigate])

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <LangProvider>
      <StoreProvider>
        <BrowserRouter>
          <BackButtonHandler />
          <ScrollRestoration />
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Customer (protected) */}
            <Route element={<RequireAuth />}>
              <Route path="/" element={<CatalogPage />} />
              <Route path="/category/:id" element={<CategoryProductsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/orders" element={<OrdersPage />} />
            </Route>

            {/* Staff */}
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route element={<RequireStaff />}>
              <Route path="/staff/orders" element={<StaffOrdersPage />} />
              <Route path="/staff/products" element={<StaffProductsPage />} />
            </Route>

            {/* Root redirect — staff devices go to PIN screen */}
            <Route path="*" element={
              localStorage.getItem('nda_is_staff') === 'true'
                ? <Navigate to="/staff/login" replace />
                : <Navigate to="/login" replace />
            } />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
      </LangProvider>
    </AuthProvider>
  )
}
