// src/routes/ModeratorRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ModeratorRoute({ children }) {
  const { role } = useAuth();
  
  // قائمة الأدوار المسموح لها بالدخول
  const allowedRoles = ['moderator', 'Moderator', 'MODERATOR', 'STORE_OWNER', 'Admin', 'Super Admin', 'SuperAdmin'];

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/admin/forbidden" replace />;
  }

  return children;
}