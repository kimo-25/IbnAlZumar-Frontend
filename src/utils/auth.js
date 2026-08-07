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
    localStorage.removeItem(AUTH_KEY)
  } catch (e) {
    console.error('Failed to clear auth', e)
  }
}

export function isAuthExpired(authData) {
  if (!authData || !authData.token) return true
  
  // لو فيه تاريخ انتهاء بنتحقق منه، لو مفيش بنفترض التوكن سليم طالما موجود
  if (authData.expiresAtUtc) {
    return new Date(authData.expiresAtUtc).getTime() <= Date.now()
  }
  return false
}