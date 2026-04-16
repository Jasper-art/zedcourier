import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import ClerkDashboard from './pages/clerk/ClerkDashboard'
import DriverDashboard from './pages/driver/DriverDashboard'
import TrackingPortal from './pages/tracking/TrackingPortal'
import { getUser, getToken } from './api'

// ─────────────────────────────────────────────
// ProtectedRoute
// Redirects to /login if no token.
// Redirects to correct dashboard if role doesn't
// match the route (e.g. a Clerk hitting /dashboard).
// ─────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const token = getToken()
  const user  = getUser()

  // Not logged in → login
  if (!token || !user?.role) {
    return <Navigate to="/login" replace />
  }

  // Wrong role → send to their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirects = {
      Admin:  '/dashboard',
      Clerk:  '/clerk',
      Driver: '/driver',
    }
    return <Navigate to={redirects[user.role] ?? '/login'} replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"      element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/track" element={<TrackingPortal />} />

      {/* Admin only */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Clerk only */}
      <Route path="/clerk" element={
        <ProtectedRoute allowedRoles={['Clerk']}>
          <ClerkDashboard />
        </ProtectedRoute>
      } />

      {/* Driver only */}
      <Route path="/driver" element={
        <ProtectedRoute allowedRoles={['Driver']}>
          <DriverDashboard />
        </ProtectedRoute>
      } />

      {/* Catch-all → login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App