import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { role } = useAuth();

  if (role === "Cashier") {
    return <Navigate to="/pos" replace />;
  }

  return children;
}