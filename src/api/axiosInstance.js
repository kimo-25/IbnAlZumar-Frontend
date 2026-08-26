// File: src/api/axiosInstance.js
import axios from 'axios'
import { getStoredAuth, clearStoredAuth, isAuthExpired } from '../utils/auth'
import { getApiBaseUrl } from '../utils/imageHelper'
import { secureAuthStorage } from '../utils/secureStorage'

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

function clearSessionAndRedirect() {
  clearStoredAuth()
  secureAuthStorage.clear()
  if (typeof window !== 'undefined' && window.location.pathname.includes('/admin') && !window.location.pathname.includes('/admin/login')) {
    window.location.assign(`${import.meta.env.BASE_URL}admin/login`)
  }
}

axiosInstance.interceptors.request.use((config) => {
  const encryptedAuth = secureAuthStorage.get()
  const legacyAuth = getStoredAuth()
  const authData = encryptedAuth || legacyAuth
  const token = authData?.token

  if (token && !isAuthExpired(authData)) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  } else if (authData) {
    clearSessionAndRedirect()
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = error.response?.data
    const normalized = {
      statusCode: error.response?.status ?? 0,
      message: apiError?.message || error.message || 'Something went wrong. Please try again.',
      errors: apiError?.errors ?? null,
      traceId: apiError?.traceId ?? null,
    }

    // A 401 means the server rejected the credential, including revoked tokens.
    // Do not rely only on a client-side expiry timestamp.
    if (normalized.statusCode === 401) clearSessionAndRedirect()
    return Promise.reject(normalized)
  },
)

export default axiosInstance
export { clearSessionAndRedirect }
