import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import axiosInstance from '../api/axiosInstance'
import { clearStoredAuth, getStoredAuth, isAuthExpired, setStoredAuth } from '../utils/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = getStoredAuth()
    return stored && !isAuthExpired(stored) ? stored : null
  })

  const normalizedRoles = useMemo(() => (auth?.roles ?? []).map((role) => String(role).toLowerCase()), [auth])

  const login = useCallback(async (username, password) => {
    const { data } = await axiosInstance.post('/Auth/login', { username, password })
    // حفظ البيانات في localStorage
    setStoredAuth(data)
    setAuth(data)
    return data
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setAuth(null)
  }, [])

  const hasPermission = useCallback((code) => !code || Boolean(auth?.permissions?.includes(code)), [auth])
  
  const hasRole = useCallback(
    (role) => {
      if (!role) return true
      // السماح لـ admin و super admin بالوصول لكل حاجة دائماً
      if (normalizedRoles.includes('admin') || normalizedRoles.includes('superadmin') || normalizedRoles.includes('super admin')) {
        return true
      }
      return normalizedRoles.includes(String(role).toLowerCase())
    },
    [normalizedRoles]
  )

  const isModerator = useMemo(() => normalizedRoles.includes('moderator'), [normalizedRoles])

  const value = useMemo(
    () => ({
      user: auth,
      isAuthenticated: Boolean(auth?.token) && !isAuthExpired(auth),
      login,
      logout,
      hasPermission,
      hasRole,
      isModerator,
    }),
    [auth, login, logout, hasPermission, hasRole, isModerator]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>')
  return ctx
}