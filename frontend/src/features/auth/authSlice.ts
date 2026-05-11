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
  registerSuccess: boolean
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
  registerSuccess: false,
}

// ── Thunks ────────────────────────────────────────────────────────────────────
// Register returns no tokens — backend sends 201 + success message only
export const register = createAsyncThunk<void, RegisterRequest>(
  'auth/register',
  async (body, { rejectWithValue }) => {
    try {
      await axios.post(`${BASE_URL}/api/v1/auth/register`, body)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message ?? err.response?.data?.errors?.[0] ?? 'Registration failed'
        return rejectWithValue(msg)
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
      state.registerSuccess = false
      localStorage.removeItem('tp_user')
      localStorage.removeItem('tp_access')
      localStorage.removeItem('tp_refresh')
    },
    clearError(state) {
      state.error = null
    },
    clearRegisterSuccess(state) {
      state.registerSuccess = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
        state.registerSuccess = false
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false
        state.registerSuccess = true
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) ?? 'Registration failed'
      })
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        localStorage.setItem('tp_user', JSON.stringify(action.payload.user))
        localStorage.setItem('tp_access', action.payload.accessToken)
        localStorage.setItem('tp_refresh', action.payload.refreshToken)
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) ?? 'Login failed'
      })
  },
})

export const { setTokens, logout, clearError, clearRegisterSuccess } = authSlice.actions
export default authSlice.reducer
