// src/context/AuthContext.jsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext();

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log("TOKEN =", token);

    if (!token) {
      setUser(null);
      return;
    }

    const payload = parseJwt(token);

    console.log("JWT Payload:", payload);
    
    console.log(
      "Extracted Role:",
      payload?.role ||
      payload?.Role ||
      payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
    );

    setUser({
      id: payload?.sub || payload?.nameid,

      name:
        payload?.unique_name ||
        payload?.name,

      role:
        payload?.role ||
        payload?.Role ||
        payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
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