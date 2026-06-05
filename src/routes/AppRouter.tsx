import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import PrivateRoute from './PrivateRoute'
import { Loader2 } from 'lucide-react'

const LandingPage    = lazy(() => import('../pages/Landing/LandingPage'))
const LoginPage     = lazy(() => import('../pages/Login/LoginPage'))
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'))
const IncidentsPage = lazy(() => import('../pages/Incidents/IncidentsPage'))
const ConnectorsPage = lazy(() => import('../pages/Connectors/ConnectorsPage'))
const RunbooksPage = lazy(() => import('../pages/Runbooks/RunbooksPage'))
import ChatPage from '../pages/Chat/ChatPage'

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin" style={{ color: '#3b82f6' }} />
    </div>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"  element={<DashboardPage />} />
              <Route path="/incidents"  element={<IncidentsPage />} />
              <Route path="/connectors" element={<ConnectorsPage />} />
              <Route path="/runbooks"   element={<RunbooksPage />} />
              <Route path="/chat"       element={<ChatPage />} />
              <Route path="/"           element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
