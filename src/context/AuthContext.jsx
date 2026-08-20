// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { pickPrimaryRole } from "../utils/roles";

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

    setUser({
      id: payload?.sub || payload?.nameid,
      name: payload?.unique_name || payload?.name,
      roles: rolesArray, // كل الأدوار زي ما وصلت من التوكن
      role: primaryRole, // الدور الموحّد الفعّال — ده اللي بتستخدمه كل الـ Route Guards
    });
  }, [token]);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);