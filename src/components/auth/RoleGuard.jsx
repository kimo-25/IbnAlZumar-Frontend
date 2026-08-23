// File: src/components/auth/RoleGuard.jsx
// Restricts a route to a given set of roles, reusing your existing getStoredAuth()
// from utils/auth.js. Role-name normalization mirrors determineDestination() in auth.js
// so "Admin" / "ADMIN" / "SUPER ADMIN" etc. all match consistently.
import { Navigate, useLocation } from 'react-router-dom'
import { getStoredAuth, isAuthExpired } from '../../utils/auth'

function normalizeRole(role) {
  return role ? String(role).trim().toUpperCase() : ''
}

/**
 * Reads the current user's role out of stored auth.
 * Adjust the field lookups below (`role`, `user.role`, `roles[0]`) to whichever
 * shape your login response actually stores — this covers the common cases
 * defensively, matching the ?? fallback style already used elsewhere in your app.
 */
function getCurrentUserRole(auth) {
  if (!auth) return ''
  const rawRole =
    auth.role ??
    auth.user?.role ??
    (Array.isArray(auth.roles) ? auth.roles[0] : null) ??
    auth.user?.roles?.[0]
  return normalizeRole(rawRole)
}

/**
 * <RoleGuard allowedRoles={['ADMIN', 'MODERATOR']}>
 *   <AddProduct />
 * </RoleGuard>
 */
export default function RoleGuard({ allowedRoles = [], children }) {
  const location = useLocation()
  const auth = getStoredAuth()

  if (!auth?.token || isAuthExpired(auth)) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  const currentRole = getCurrentUserRole(auth)
  const normalizedAllowed = allowedRoles.map(normalizeRole)

  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(currentRole)) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}