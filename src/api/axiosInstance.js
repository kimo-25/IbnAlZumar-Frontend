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

// Attach the JWT to every outgoing request using secureAuthStorage
axiosInstance.interceptors.request.use((config) => {
  const authData = secureAuthStorage.get()
  const token = authData?.token || localStorage.getItem("token")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    const auth = getStoredAuth()
    if (auth && isAuthExpired(auth)) {
      clearStoredAuth()
      secureAuthStorage.clear()
    }
  }
  return config
})

// Interceptor لمعالجة الأخطاء وعدم الطرد الفوري إلا في حالة انتهاء التوكن فعلياً
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

    const auth = getStoredAuth()
    const secureAuth = secureAuthStorage.get()
    const currentToken = secureAuth?.token || auth?.token

    if (normalized.statusCode === 401 && (!currentToken || isAuthExpired(auth))) {
      clearStoredAuth()
      secureAuthStorage.clear()
      if (window.location.pathname.includes('/admin') && !window.location.pathname.includes('/admin/login')) {
        window.location.assign(import.meta.env.BASE_URL + 'admin/login')
      }
    }

    return Promise.reject(normalized)
  }
)

export default axiosInstance