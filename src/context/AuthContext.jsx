// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { pickPrimaryRole, normalizeRole } from "../utils/roles";
import { getStoredAuth, clearStoredAuth, isAuthExpired, setStoredAuth } from "../utils/auth";
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
    const encrypted = secureAuthStorage.get();
    const legacy = getStoredAuth();
    const authData = encrypted || legacy;
    if (!authData || isAuthExpired(authData)) {
      secureAuthStorage.clear();
      clearStoredAuth();
      return null;
    }
    return authData.token;
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

  // حفظ التوكن وتحديث حالة الـ State فوراً قبل التوجيه
  const login = (jwtToken) => {
    const payload = parseJwt(jwtToken);
    const authData = {
      token: jwtToken,
      expiresAt: Number.isFinite(payload?.exp) ? payload.exp * 1000 : undefined,
      expiresAtUtc: Number.isFinite(payload?.exp) ? new Date(payload.exp * 1000).toISOString() : undefined,
    };
    
    secureAuthStorage.set(authData);
    if (typeof setStoredAuth === "function") {
      setStoredAuth(authData);
    }
    
    const userData = processTokenData(jwtToken);
    setUser(userData);
    setToken(jwtToken);
    return userData;
  };

  const logout = () => {
    secureAuthStorage.clear();
    clearStoredAuth();
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