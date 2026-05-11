import { useAppSelector, useAppDispatch } from './useAppDispatch'
import { logout, clearError } from '@/features/auth/authSlice'

export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, accessToken, loading, error, registerSuccess } = useAppSelector((s) => s.auth)

  return {
    user,
    isAuthenticated: !!accessToken,
    isAdmin: user?.role === 'Admin',
    loading,
    error,
    registerSuccess,
    logout: () => dispatch(logout()),
    clearError: () => dispatch(clearError()),
  }
}
