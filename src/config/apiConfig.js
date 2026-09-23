const DEFAULT_DEV_API_URL = 'https://localhost:7223/api'
const DEFAULT_PROD_API_URL = 'https://ibnal-ibnalzumar-api-ddf9h3cdafc6bxat.francecentral-01.azurewebsites.net/api'

function normalizeApiBaseUrl(value) {
  const fallback = import.meta.env.DEV ? DEFAULT_DEV_API_URL : DEFAULT_PROD_API_URL
  const withoutTrailingSlashes = String(value || fallback).trim().replace(/\/+$/, '')
  return `${withoutTrailingSlashes.replace(/(?:\/api)+$/i, '')}/api`
}

/** Full API base URL including the `/api` prefix (used by Axios). */
export function getApiBaseUrl() {
  return normalizeApiBaseUrl(import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)
}

/** Server origin without `/api` — used for static uploads/images. */
export function getApiOrigin() {
  return getApiBaseUrl().replace(/\/api\/?$/i, '')
}
