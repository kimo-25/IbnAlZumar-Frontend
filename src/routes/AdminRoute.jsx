import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeRole, ROLES, ADMIN_AREA_ROLES } from "../utils/roles";

export default function AdminRoute({ children }) {
  const { role, isAuthenticated } = useAuth();
  const normalizedRole = normalizeRole(role);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (normalizedRole === ROLES.CASHIER) {
    return <Navigate to="/pos" replace />;
  }

  if (normalizedRole === ROLES.MODERATOR) {
    return <Navigate to="/moderator/dashboard" replace />;
  }

  if (!ADMIN_AREA_ROLES.includes(normalizedRole)) {
    return <Navigate to="/admin/forbidden" replace />;
  }

  return children;
}