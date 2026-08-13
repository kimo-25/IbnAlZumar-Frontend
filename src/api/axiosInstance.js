// File: src/api/axiosInstance.js
import axios from 'axios'
import { getStoredAuth, clearStoredAuth, isAuthExpired } from '../utils/auth'
import { getApiBaseUrl } from '../utils/imageHelper'

const axiosInstance = axios.create({
  // تم الربط بالدالة الديناميكية لقراءة رابط Azure من متغيرات البيئة بدلاً من Railway
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // <-- هذا السطر ضروري جداً ليتوافق مع إعدادات الباك إند
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

    // نطرد للـ Login فقط لو الـ Token غير موجود أو منتهي فعلياً
    const auth = getStoredAuth()
    if (normalized.statusCode === 401 && (!auth?.token || isAuthExpired(auth))) {
      clearStoredAuth()
      if (window.location.pathname.includes('/admin') && !window.location.pathname.includes('/admin/login')) {
        window.location.assign(import.meta.env.BASE_URL + 'admin/login')
      }
    }

    return Promise.reject(normalized)
  }
)

export default axiosInstance