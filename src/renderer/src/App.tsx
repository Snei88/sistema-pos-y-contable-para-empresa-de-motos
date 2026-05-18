import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/auth.store'
import LoginPage from './pages/auth/LoginPage'
import MainLayout from './components/shared/MainLayout'
import DashboardPage from './pages/dashboard/DashboardPage'
import InventoryPage from './pages/inventory/InventoryPage'
import ClientsPage from './pages/clients/ClientsPage'
import CashPage from './pages/cash/CashPage'
import PosPage from './pages/pos/PosPage'
import PurchasesPage from './pages/purchases/PurchasesPage'
import WorkshopPage from './pages/workshop/WorkshopPage'
import MechanicsPage from './pages/mechanics/MechanicsPage'
import CreditsPage from './pages/credits/CreditsPage'
import AccountingPage from './pages/accounting/AccountingPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'
import { AppDialogProvider } from './components/shared/AppDialogProvider'

function AppRoutes() {
  const { user, loadSession, isLoading } = useAuthStore()
  const location = useLocation()

  useEffect(() => { loadSession() }, [])

  // Mientras carga la sesión, no renderizar nada (evita flash de login)
  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Cargando...
      </div>
    )
  }

  // Sin sesión: solo puede ver login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Con sesión: redirigir login → dashboard
  if (location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="cash" element={<CashPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="workshop" element={<WorkshopPage />} />
        <Route path="mechanics" element={<MechanicsPage />} />
        <Route path="credits" element={<CreditsPage />} />
        <Route path="accounting" element={<AccountingPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppDialogProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppDialogProvider>
  )
}
