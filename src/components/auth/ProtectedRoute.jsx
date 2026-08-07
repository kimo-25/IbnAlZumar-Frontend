// File: src/components/auth/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ permission, role, allowRoles = [] }) {
  const { isAuthenticated, hasPermission, hasRole, user } = useAuth()
  const location = useLocation()

  // 1. التأكد من تسجيل الدخول
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  // 2. إعطاء صلاحية كاملة ومباشرة للـ Owner والـ Super Admin دون أي قيود
  const isSuperUser = 
    (typeof hasRole === 'function' && (hasRole('Owner') || hasRole('SuperAdmin'))) || 
    user?.role === 'Owner' || 
    user?.role === 'SuperAdmin'

  if (isSuperUser) {
    return <Outlet />
  }

  // 3. التحقق من الـ allowRoles المحددة
  const hasAllowedRole = Array.isArray(allowRoles) && allowRoles.some((candidateRole) => 
    typeof hasRole === 'function' && hasRole(candidateRole)
  )
  if (hasAllowedRole) {
    return <Outlet />
  }

  // 4. التحقق من الـ Permission
  if (permission && typeof hasPermission === 'function' && !hasPermission(permission)) {
    return <Navigate to="/admin/forbidden" replace />
  }

  // 5. التحقق من الـ Role
  if (role && typeof hasRole === 'function' && !hasRole(role)) {
    return <Navigate to="/admin/forbidden" replace />
  }

  return <Outlet />
}