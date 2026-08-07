// File: src/api/axiosInstance.js
import axios from 'axios'
import { getStoredAuth, clearStoredAuth, isAuthExpired } from '../utils/auth'

const axiosInstance = axios.create({
  baseURL: 'https://ibn-al-zumar-backend-production-f3dc.up.railway.app',
  headers: { 'Content-Type': 'application/json' },
})

// Attach the JWT to every outgoing request
axiosInstance.interceptors.request.use((config) => {
  const auth = getStoredAuth()
  if (auth?.token && !isAuthExpired(auth)) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${auth.token}`
  } else if (auth && isAuthExpired(auth)) {
    clearStoredAuth()
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

    // نطرد للـ Login فقط لو الـ Token غير موجود أو منتهي فعلياً (مش بسبب 401 عادي من السيرفر)
    const auth = getStoredAuth()
    if (normalized.statusCode === 401 && (!auth?.token || isAuthExpired(auth))) {
      clearStoredAuth()
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login')
      }
    }

    return Promise.reject(normalized)
  }
)

export default axiosInstance