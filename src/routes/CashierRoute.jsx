import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeRole, ROLES, getRoleHomePath } from "../utils/roles";

export default function CashierRoute({ children }) {
  const { role, isAuthenticated } = useAuth();
  const normalizedRole = normalizeRole(role);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (normalizedRole !== ROLES.CASHIER) {
    // مسجل دخول لكن مش كاشير: نوديه لمساره الصح، مش نطلع منه كأنه مش عامل لوجن
    return <Navigate to={getRoleHomePath(normalizedRole)} replace />;
  }

  return children;
}