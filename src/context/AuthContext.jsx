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

function processTokenData(jwtToken) {
  if (!jwtToken) return null;
  const payload = parseJwt(jwtToken);
  if (!payload) return null;

  const rawRoles =
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
    payload.role ??
    payload.Role ??
    [];

  const rolesArray = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  const primaryRole = pickPrimaryRole(rolesArray);
  const userName = payload?.unique_name || payload?.name || "";

  return {
    id: payload?.sub || payload?.nameid,
    name: userName,
    fullName: userName,
    roles: rolesArray,
    role: primaryRole,
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const authData = secureAuthStorage.get();
    return authData?.token || null;
  });

  const [user, setUser] = useState(() => processTokenData(token));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    const userData = processTokenData(token);
    setUser(userData);
  }, [token]);

  const hasRole = (targetRole) => {
    if (!user) return false;
    const normalizedTarget = normalizeRole(targetRole);
    const normalizedPrimary = normalizeRole(user.role);
    
    if (normalizedPrimary === normalizedTarget) return true;

    return (user.roles || []).map(normalizeRole).includes(normalizedTarget);
  };

  const hasPermission = () => {
    if (!user) return false;
    return true;
  };

  // حفظ التوكن وتحديث حالة الـ State فوراُ قبل التوجيه
  const login = (jwtToken) => {
    secureAuthStorage.set({ token: jwtToken });
    const userData = processTokenData(jwtToken);
    setUser(userData);
    setToken(jwtToken);
    return userData;
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
        isAuthenticated: !!token && !!user,
        isLoading,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);