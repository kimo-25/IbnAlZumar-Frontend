import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeRole, ROLES, STAFF_ROLES, getRoleHomePath } from "../utils/roles";

export default function CustomerRoute({ children }) {
  const { role } = useAuth();
  const location = useLocation();
  const normalizedRole = normalizeRole(role);

  // الكاشير ممنوع تمامًا من واجهة المتجر، أينما حاول يدخل
  if (normalizedRole === ROLES.CASHIER) {
    return <Navigate to="/pos" replace />;
  }

  // عند زيارة الصفحة الرئيسية "/" بالذات (مش أي صفحة تانية بالمتجر زي المنتجات مثلًا)،
  // الموظفين (أدمن/مشرف/مدير أونلاين) يتوجهوا للوحتهم بدل واجهة المتجر.
  // لو حابين يتصفحوا المتجر بنفسهم بعد كده، يقدروا يدخلوا صفحات المتجر التانية عادي.
  if (STAFF_ROLES.includes(normalizedRole) && location.pathname === "/") {
    return <Navigate to={getRoleHomePath(normalizedRole)} replace />;
  }

  return children;
}