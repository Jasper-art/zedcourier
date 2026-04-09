import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import ClerkDashboard from './pages/clerk/ClerkDashboard'
import DriverDashboard from './pages/driver/DriverDashboard'
import TrackingPortal from './pages/tracking/TrackingPortal'
import CreateUserTab from './pages/admin/tabs/CreateUserTab'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/create-user" element={<CreateUserTab />} />
      <Route path="/clerk" element={<ClerkDashboard />} />
      <Route path="/driver" element={<DriverDashboard />} />
      <Route path="/track" element={<TrackingPortal />} />
    </Routes>
  )
}

export default App