// File: src/utils/auth.js
const AUTH_KEY = 'ibn_zumar_auth'

export function getStoredAuth() {
  try {
    const data = localStorage.getItem(AUTH_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function setStoredAuth(authData) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
  } catch (e) {
    console.error('Failed to save auth to localStorage', e)
  }
}

export function clearStoredAuth() {
  try {
    // Remove every auth representation used by previous app versions.
    [AUTH_KEY, 'token', 'user', 'refreshToken'].forEach((key) => localStorage.removeItem(key))
  } catch (e) {
    console.error('Failed to clear auth', e)
  }
}

export function isAuthExpired(authData) {
  if (!authData?.token) return true
  const expiresAt = authData.expiresAt ?? authData.expiresAtUtc
  if (expiresAt) {
    const timestamp = typeof expiresAt === 'number' ? expiresAt : Date.parse(expiresAt)
    return Number.isFinite(timestamp) && timestamp <= Date.now()
  }

  // Decode exp when the API did not persist explicit expiry metadata.
  try {
    const payload = JSON.parse(atob(authData.token.split('.')[1]))
    return Number.isFinite(payload?.exp) && payload.exp * 1000 <= Date.now()
  } catch {
    return false
  }
}

// تحديد وجهة التوجيه بناءً على دور المستخدم بعد تسجيل الدخول أو التسجيل
export function determineDestination(role) {
  const normalized = role ? String(role).trim().toUpperCase() : ""
  if (normalized === "CASHIER") {
    return "/pos"
  }
  if (["STORE_OWNER", "ADMIN", "SUPER ADMIN", "SUPERADMIN"].includes(normalized)) {
    return "/admin/dashboard"
  }
  if (["MODERATOR", "ONLINE_MANAGER"].includes(normalized)) {
    return "/moderator"
  }
  return "/"
}