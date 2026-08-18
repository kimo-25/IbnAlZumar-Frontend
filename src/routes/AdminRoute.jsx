import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { role } = useAuth();
  const normalizedRole = role ? String(role).trim().toUpperCase() : "";

  // إذا كان كاشير وحاول الدخول للوحة التحكم، وجهه لنقاط البيع
  if (normalizedRole === "CASHIER") {
    return <Navigate to="/pos" replace />;
  }

  const allowedAdminRoles = ["ADMIN", "SUPER ADMIN", "SUPERADMIN", "STORE_OWNER", "OWNER", "ONLINE_MANAGER"];

  if (!allowedAdminRoles.includes(normalizedRole)) {
    return <Navigate to="/admin/forbidden" replace />;
  }

  return children;
}