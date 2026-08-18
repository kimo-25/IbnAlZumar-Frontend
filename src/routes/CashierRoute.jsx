import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CashierRoute({ children }) {
  const { role } = useAuth();

  const normalizedRole = role ? String(role).trim().toUpperCase() : "";

  if (normalizedRole !== "CASHIER") {
    return <Navigate to="/login" replace />;
  }

  return children;
}