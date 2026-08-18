import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CashierRoute({ children }) {
  const { role } = useAuth();

  if (role !== "Cashier") {
    return <Navigate to="/" replace />;
  }

  return children;
}