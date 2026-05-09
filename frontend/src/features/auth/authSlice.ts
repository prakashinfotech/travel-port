import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import type { AuthResponse, LoginRequest, RegisterRequest, UserToken } from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7001'

interface AuthState {
  user: UserToken | null
  accessToken: string | null
  refreshToken: string | null
  loading: boolean
  error: string | null
}

const loadFromStorage = (): Pick<AuthState, 'user' | 'accessToken' | 'refreshToken'> => {
  try {
    return {
      user: JSON.parse(localStorage.getItem('tp_user') ?? 'null'),
      accessToken: localStorage.getItem('tp_access') ?? null,
      refreshToken: localStorage.getItem('tp_refresh') ?? null,
    }
  } catch {
    return { user: null, accessToken: null, refreshToken: null }
  }
}

const initialState: AuthState = {
  ...loadFromStorage(),
  loading: false,
  error: null,
}

// ── Thunks ────────────────────────────────────────────────────────────────────
export const register = createAsyncThunk<AuthResponse, RegisterRequest>(
  'auth/register',
  async (body, { rejectWithValue }) => {
    try {
      const { data } = await axios.post<{ data: AuthResponse }>(
        `${BASE_URL}/api/v1/auth/register`,
        body
      )
      return data.data
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.message ?? 'Registration failed')
      }
      return rejectWithValue('Registration failed')
    }
  }
)

export const login = createAsyncThunk<AuthResponse, LoginRequest>(
  'auth/login',
  async (body, { rejectWithValue }) => {
    try {
      const { data } = await axios.post<{ data: AuthResponse }>(
        `${BASE_URL}/api/v1/auth/login`,
        body
      )
      return data.data
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.message ?? 'Login failed')
      }
      return rejectWithValue('Login failed')
    }
  }
)

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      localStorage.setItem('tp_access', action.payload.accessToken)
      localStorage.setItem('tp_refresh', action.payload.refreshToken)
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.error = null
      localStorage.removeItem('tp_user')
      localStorage.removeItem('tp_access')
      localStorage.removeItem('tp_refresh')
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    const onPending = (state: AuthState) => {
      state.loading = true
      state.error = null
    }
    const onFulfilled = (state: AuthState, action: PayloadAction<AuthResponse>) => {
      state.loading = false
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      localStorage.setItem('tp_user', JSON.stringify(action.payload.user))
      localStorage.setItem('tp_access', action.payload.accessToken)
      localStorage.setItem('tp_refresh', action.payload.refreshToken)
    }
    const onRejected = (state: AuthState, action: PayloadAction<unknown>) => {
      state.loading = false
      state.error = (action.payload as string) ?? 'An error occurred'
    }

    builder
      .addCase(register.pending, onPending)
      .addCase(register.fulfilled, onFulfilled)
      .addCase(register.rejected, onRejected)
      .addCase(login.pending, onPending)
      .addCase(login.fulfilled, onFulfilled)
      .addCase(login.rejected, onRejected)
  },
})

export const { setTokens, logout, clearError } = authSlice.actions
export default authSlice.reducer
