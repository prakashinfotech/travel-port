import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserToken } from '@/types'

type OperatorRole = 'FlightOperator' | 'BusOperator' | 'CabOperator'

interface Props {
  children: React.ReactNode
  role?: OperatorRole
}

export function OperatorRoute({ children, role }: Props) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const operatorRoles: UserToken['role'][] = ['FlightOperator', 'BusOperator', 'CabOperator']
  if (!operatorRoles.includes(user!.role)) {
    return <Navigate to="/" replace />
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
