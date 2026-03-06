import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/layout/Layout'
import LoginPage      from './pages/auth/LoginPage'
import DashboardPage  from './pages/dashboard/DashboardPage'
import POSPage        from './pages/pos/POSPage'
import ProductsPage   from './pages/products/ProductsPage'
import SalesPage      from './pages/sales/SalesPage'
import ReportsPage    from './pages/reports/ReportsPage'
import UsersPage      from './pages/users/UsersPage'
import PurchasesPage  from './pages/purchases/PurchasesPage'
import { Spinner } from './components/ui'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!['admin', 'manager'].includes(user?.role)) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { isAuthenticated, fetchMe } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) fetchMe()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="pos"       element={<POSPage />} />
        <Route path="products"  element={<ProductsPage />} />
        <Route path="sales"     element={<SalesPage />} />
        <Route path="reports"   element={<AdminRoute><ReportsPage /></AdminRoute>} />
        <Route path="users"     element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="purchases" element={<AdminRoute><PurchasesPage /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}