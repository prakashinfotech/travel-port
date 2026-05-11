import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { store } from '@/store'
import { setTokens, logout } from '@/features/auth/authSlice'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// Attach access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = store.getState().auth.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Refresh token on 401 — single in-flight refresh to avoid race conditions
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token!)
  )
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    const refreshToken = store.getState().auth.refreshToken
    if (!refreshToken) {
      store.dispatch(logout())
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
        `${BASE_URL}/api/v1/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      )
      const { accessToken, refreshToken: newRefresh } = data.data
      store.dispatch(setTokens({ accessToken, refreshToken: newRefresh }))
      processQueue(null, accessToken)
      original.headers.Authorization = `Bearer ${accessToken}`
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError)
      store.dispatch(logout())
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
