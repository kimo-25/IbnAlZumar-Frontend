const DEFAULT_DEV_API_URL = 'https://localhost:7223/api'
const DEFAULT_PROD_API_URL = 'https://kamalmohamed-001-site1.jtempurl.com/api'

/** Full API base URL including the `/api` prefix (used by Axios). */
export function getApiBaseUrl() {
  const raw =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? DEFAULT_DEV_API_URL : DEFAULT_PROD_API_URL)
  return raw.replace(/\/$/, '')
}

/** Server origin without `/api` — used for static uploads/images. */
export function getApiOrigin() {
  return getApiBaseUrl().replace(/\/api\/?$/i, '')
}
