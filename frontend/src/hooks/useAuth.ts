import { useAppSelector, useAppDispatch } from './useAppDispatch'
import { logout, clearError } from '@/features/auth/authSlice'

export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, accessToken, loading, error, registerSuccess } = useAppSelector((s) => s.auth)

  return {
    user,
    isAuthenticated: !!accessToken,
    isAdmin: user?.role === 'Admin',
    isHotel: user?.role === 'Hotel',
    isFlightOperator: user?.role === 'FlightOperator',
    isBusOperator: user?.role === 'BusOperator',
    isCabOperator: user?.role === 'CabOperator',
    isOperator: user?.role === 'FlightOperator' || user?.role === 'BusOperator' || user?.role === 'CabOperator',
    loading,
    error,
    registerSuccess,
    logout: () => dispatch(logout()),
    clearError: () => dispatch(clearError()),
  }
}
