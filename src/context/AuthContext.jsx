// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { pickPrimaryRole, normalizeRole } from "../utils/roles";
import { secureAuthStorage } from "../utils/secureStorage";

const AuthContext = createContext();

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // قراءة التوكن المشفر عند بداية تحميل التطبيق
  const [token, setToken] = useState(() => {
    const authData = secureAuthStorage.get();
    return authData?.token || null;
  });
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
      fullName: userName,
      roles: rolesArray,
      role: primaryRole,
    });
  }, [token]);

  const hasRole = (targetRole) => {
    if (!user) return false;
    const normalizedTarget = normalizeRole(targetRole);
    const normalizedPrimary = normalizeRole(user.role);
    
    if (normalizedPrimary === normalizedTarget) return true;

    return (user.roles || []).map(normalizeRole).includes(normalizedTarget);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    return true;
  };

  // حفظ التوكن بأسلوب مشفّر آمن للـ Offline POS
  const login = (jwtToken) => {
    secureAuthStorage.set({ token: jwtToken });
    setToken(jwtToken);
  };

  // مسح البيانات المشفّرة
  const logout = () => {
    secureAuthStorage.clear();
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