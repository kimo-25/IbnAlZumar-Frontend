// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { pickPrimaryRole, normalizeRole } from "../utils/roles";

const AuthContext = createContext();

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const payload = parseJwt(token);
    if (!payload) {
      setUser(null);
      return;
    }

    // الباك إند بيحط الـ Roles تحت الـ claim القياسي الطويل بتاع ClaimTypes.Role.
    // لو المستخدم عنده أكتر من Role، القيمة بتيجي array مش string، فلازم نتعامل مع الحالتين.
    const rawRoles =
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      payload.role ??
      payload.Role ??
      [];

    const rolesArray = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
    const primaryRole = pickPrimaryRole(rolesArray);

    const userName = payload?.unique_name || payload?.name || "";

    setUser({
      id: payload?.sub || payload?.nameid,
      name: userName,
      fullName: userName, // لدعم أي مكون يستدم fullName بدلاً من name
      roles: rolesArray, // كل الأدوار زي ما وصلت من التوكن
      role: primaryRole, // الدور الموحّد الفعّال — ده اللي بتستخدمه كل الـ Route Guards
    });
  }, [token]);

  // دالة فحص الأدوار المساعدة لكي لا تحدث أخطاء في Sidebar و ProtectedRoute
  const hasRole = (targetRole) => {
    if (!user) return false;
    const normalizedTarget = normalizeRole(targetRole);
    const normalizedPrimary = normalizeRole(user.role);
    
    if (normalizedPrimary === normalizedTarget) return true;

    return (user.roles || []).map(normalizeRole).includes(normalizedTarget);
  };

  // دالة فحص الصلاحيات المؤقتة لمنع أي كراش
  const hasPermission = (permission) => {
    if (!user) return false;
    // يمكن ربطها لاحقاً بصلاحيات التوكن إذا وجدت
    return true;
  };

  const login = (jwtToken) => {
    localStorage.setItem("token", jwtToken);
    setToken(jwtToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: user?.role,
        roles: user?.roles || [],
        login,
        logout,
        isAuthenticated: !!token,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);