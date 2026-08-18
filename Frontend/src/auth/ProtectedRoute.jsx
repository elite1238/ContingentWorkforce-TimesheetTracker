import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute({ children, role }) {
  const { user, isManager, isEmployee } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role === 'MANAGER' && !isManager) return <Navigate to="/my-assignments" replace />
  if (role === 'EMPLOYEE' && !isEmployee) return <Navigate to="/dashboard" replace />
  return children
}
