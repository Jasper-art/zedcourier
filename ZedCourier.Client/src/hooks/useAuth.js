import { useEffect } from 'react'

export function useAuth(requiredRole) {
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (!token || (requiredRole && user.role !== requiredRole)) {
      window.location.href = '/login'
    }
  }, [requiredRole])
}