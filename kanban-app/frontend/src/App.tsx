import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ConfirmProvider } from './contexts/ConfirmContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectPage from './pages/ProjectPage'
import EdtPage from './pages/EdtPage'
import MembersPage from './pages/MembersPage'
import SummaryPage from './pages/SummaryPage'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">Cargando...</div>
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return null
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/projects/:id" element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />
              <Route path="/projects/:id/edt" element={<ProtectedRoute><EdtPage /></ProtectedRoute>} />
          <Route path="/projects/:id/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
              <Route path="/projects/:id/summary" element={<ProtectedRoute><SummaryPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
