// src/routes/CustomerRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CustomerRoute({ children }) {
  const { role } = useAuth();

  // لو المستخدم أدمن أو كاشير وحاول يدخل صفحات المتجر المخصصة للعملاء، ممكن توجيهه للداشبورد أو تسيبه حسب رغبتك
  // هنا هنسمح للعملاء العاديين أو الزوار، ولو هو كاشير هنوجهه للـ pos
  if (role === "Cashier") {
    return <Navigate to="/pos" replace />;
  }

  return children;
}