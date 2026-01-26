import React, { useEffect, useState } from "react";
import { AuthContext } from "./authContext";
import { meApi, loginApi, registerApi } from "../api/auth.api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshMe() {
    try {
      const data = await meApi();
      setUser(data.user ?? data);
    } catch {
      setUser(null);
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
  }, []);

  async function login(email, password) {
    const data = await loginApi(email, password);
    localStorage.setItem("token", data.token);
    await refreshMe();
  }

  async function register(payload) {
    const data = await registerApi(payload);
    localStorage.setItem("token", data.token);
    await refreshMe();
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  const value = { user, isLoading, login, register, logout, refreshMe };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
