import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CustomerRoute({ children }) {
  const { role } = useAuth();
  const normalizedRole = role ? String(role).trim().toUpperCase() : "";

  // إذا كان المستخدم كاشير، امنعه من دخول المتجر ووجهه لنظام نقاط البيع
  if (normalizedRole === "CASHIER") {
    return <Navigate to="/pos" replace />;
  }

  return children;
}