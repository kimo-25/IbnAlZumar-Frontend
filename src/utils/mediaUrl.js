// File: src/utils/mediaUrl.js
import { getApiBaseUrl } from './imageHelper'

// Frontend is static-hosted on GitHub Pages and has no relationship to the
// API's domain. If the backend ever returns a relative path like
// "/uploads/maintenance/file.png" instead of a full URL, the browser would
// resolve it against the GitHub Pages origin and 404. This guarantees an
// absolute URL pointing at the API host either way.
function getApiOrigin() {
  const base = getApiBaseUrl() || ''
  try {
    return new URL(base).origin
  } catch {
    // Fallback: strip a trailing /api (or /api/) segment if URL parsing fails.
    return base.replace(/\/api\/?$/i, '')
  }
}

export function toAbsoluteMediaUrl(url) {
  if (!url) return null
  const trimmed = String(url).trim()
  if (!trimmed) return null

  // Already absolute (http/https) or a data URI — nothing to do.
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed
  }

  const origin = getApiOrigin().replace(/\/+$/, '')
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${origin}${path}`
}