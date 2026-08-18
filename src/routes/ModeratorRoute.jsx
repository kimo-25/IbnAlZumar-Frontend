import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ModeratorRoute({ children }) {
  const { role } = useAuth();
  const normalizedRole = role ? String(role).trim().toUpperCase() : "";

  if (normalizedRole === "CASHIER") {
    return <Navigate to="/pos" replace />;
  }

  const allowedRoles = ["MODERATOR", "ONLINE_MANAGER", "STORE_OWNER", "ADMIN", "SUPER ADMIN", "SUPERADMIN"];

  if (!allowedRoles.includes(normalizedRole)) {
    return <Navigate to="/admin/forbidden" replace />;
  }

  return children;
}