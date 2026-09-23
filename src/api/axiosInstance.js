// File: src/api/axiosInstance.js
import axios from 'axios'
import { getStoredAuth, clearStoredAuth, isAuthExpired } from '../utils/auth'
import { getApiBaseUrl } from '../utils/imageHelper'
import { secureAuthStorage } from '../utils/secureStorage'

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 20000,
})

let isRedirectingToLogin = false

function isPublicAuthRequest(url = '') {
  const normalizedUrl = String(url).toLowerCase()
  return ['/auth/login', '/auth/google', '/auth/register', '/auth/refresh'].some((path) =>
    normalizedUrl.includes(path),
  )
}

function clearSessionAndRedirect() {
  clearStoredAuth()
  secureAuthStorage.clear()

  if (typeof window === 'undefined' || isRedirectingToLogin) return

  const currentPath = window.location.pathname
  const isAdminArea = currentPath.includes('/admin')
  const isLoginPage = currentPath.includes('/admin/login')

  if (isAdminArea && !isLoginPage) {
    isRedirectingToLogin = true
    const loginUrl = `${import.meta.env.BASE_URL}admin/login`
    window.location.replace(loginUrl)
  }
}

axiosInstance.interceptors.request.use(
  (config) => {
    // اقرأ الرابط عند كل طلب حتى لا تبقى نسخة قديمة في الذاكرة بعد تحديث البيئة.
    config.baseURL = getApiBaseUrl()

    const encryptedAuth = secureAuthStorage.get()
    const legacyAuth = getStoredAuth()
    const authData = encryptedAuth || legacyAuth
    const token = authData?.token

    if (token && !isAuthExpired(authData)) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    } else if (authData && !isPublicAuthRequest(config.url)) {
      clearSessionAndRedirect()
    }

    return config
  },
  (requestError) => Promise.reject(requestError),
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const statusCode = error.response?.status ?? 0
    const apiError = error.response?.data
    const requestUrl = error.config?.url || ''
    const normalized = {
      statusCode,
      message: apiError?.message || error.message || 'Something went wrong. Please try again.',
      errors: apiError?.errors ?? null,
      traceId: apiError?.traceId ?? null,
    }

    // لا تعاود الطلب ولا تعيد التوجيه إلا مرة واحدة، ولا تعتبر endpoint تسجيل الدخول
    // جلسة محمية لتجنب حلقات 401 أو إعادة تحميل لا نهائية.
    if (statusCode === 401 && !isPublicAuthRequest(requestUrl) && !error.config?._authHandled) {
      if (error.config) error.config._authHandled = true
      clearSessionAndRedirect()
    }

    return Promise.reject(normalized)
  },
)

export default axiosInstance
export { clearSessionAndRedirect }
