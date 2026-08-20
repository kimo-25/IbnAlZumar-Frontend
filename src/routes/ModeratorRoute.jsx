console.log("user", user);
console.log("role", role);
console.log("roles", roles);
console.log("hasRole", hasRole);
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeRole, ROLES, MODERATOR_AREA_ROLES } from "../utils/roles";

export default function ModeratorRoute({ children }) {
  const { role, isAuthenticated } = useAuth();
  const normalizedRole = normalizeRole(role);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (normalizedRole === ROLES.CASHIER) {
    return <Navigate to="/pos" replace />;
  }

  if (!MODERATOR_AREA_ROLES.includes(normalizedRole)) {
    return <Navigate to="/admin/forbidden" replace />;
  }

  return children;
}