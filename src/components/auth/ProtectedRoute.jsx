// File: src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { normalizeRole } from '../../utils/roles'

export default function ProtectedRoute({ permission, role, allowRoles = [], children }) {
  const { isAuthenticated, user, roles } = useAuth()
  const location = useLocation()

  // 1. التأكد من تسجيل الدخول
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  // تطبيع دور المستخدم الأساسي والأدوار المتاحة لديه
  const userPrimaryRole = normalizeRole(user?.role);
  const normalizedUserRoles = Array.isArray(roles) ? roles.map(normalizeRole) : [userPrimaryRole];

  // 2. إعطاء صلاحية كاملة ومباشرة للـ Owner والـ Super Admin دون أي قيود
  const isSuperUser = 
    ['OWNER', 'STORE_OWNER', 'SUPERADMIN', 'SUPER_ADMIN'].includes(userPrimaryRole) ||
    normalizedUserRoles.some(r => ['OWNER', 'STORE_OWNER', 'SUPERADMIN', 'SUPER_ADMIN'].includes(r));

  if (isSuperUser) {
    return children
  }

  // 3. التحقق من الـ allowRoles المحددة
  if (Array.isArray(allowRoles) && allowRoles.length > 0) {
    const normalizedAllowedRoles = allowRoles.map(normalizeRole);
    const hasAllowedRole = normalizedUserRoles.some(r => normalizedAllowedRoles.includes(r)) ||
                           normalizedAllowedRoles.includes(userPrimaryRole);
    if (!hasAllowedRole) {
      return <Navigate to="/admin/forbidden" replace />
    }
  }

  // 4. التحقق من الـ Role الفردي الممرر
  if (role) {
    const normalizedTargetRole = normalizeRole(role);
    const hasSpecificRole = normalizedUserRoles.includes(normalizedTargetRole) || userPrimaryRole === normalizedTargetRole;
    if (!hasSpecificRole) {
      return <Navigate to="/admin/forbidden" replace />
    }
  }

  // 5. التحقق من الـ Permission (إن وجد نظام صلاحيات مخصص لاحقاً)
  // if (permission && typeof hasPermission === 'function' && !hasPermission(permission)) {
  //   return <Navigate to="/admin/forbidden" replace />
  // }

  return children
}