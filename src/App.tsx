import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RequireAuth, RequireStaff } from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
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

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Customer (protected) */}
            <Route element={<RequireAuth />}>
              <Route path="/" element={<CatalogPage />} />
              <Route path="/category/:name" element={<CategoryProductsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/orders" element={<OrdersPage />} />
            </Route>

            {/* Staff */}
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route element={<RequireStaff />}>
              <Route path="/staff/orders" element={<StaffOrdersPage />} />
              <Route path="/staff/products" element={<StaffProductsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  )
}
