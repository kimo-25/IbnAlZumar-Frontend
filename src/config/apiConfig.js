const DEFAULT_DEV_API_URL = 'https://localhost:7223/api'
const DEFAULT_PROD_API_URL = 'https://ibnalzumar-api-bub8fyaceheggxec.southafricanorth-01.azurewebsites.net/api'

/** Full API base URL including the `/api` prefix (used by Axios). */
export function getApiBaseUrl() {
  const raw =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? DEFAULT_DEV_API_URL : DEFAULT_PROD_API_URL)

  // تنظيف أي سلاش في النهاية
  let cleanUrl = raw.trim().replace(/\/+$/, '')

  // التأكد من وجود /api في نهاية الرابط الأساسي
  if (!cleanUrl.toLowerCase().endsWith('/api')) {
    cleanUrl = `${cleanUrl}/api`
  }

  return cleanUrl
}

/** Server origin without `/api` — used for static uploads/images. */
export function getApiOrigin() {
  return getApiBaseUrl().replace(/\/api\/?$/i, '')
}