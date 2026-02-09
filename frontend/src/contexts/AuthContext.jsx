import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { api, setAuthToken } from "@/lib/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "cf_token";

function safeDecode(token) {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    let active = true;

    async function init() {
      setLoading(true);

      if (!token) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const decoded = safeDecode(token);
      if (!decoded?.sub) {
        localStorage.removeItem(TOKEN_KEY);
        if (active) {
          setToken(null);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const me = await api.get("/auth/me");
        if (active) {
          setUser(me.data);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    init();
    return () => {
      active = false;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthed: Boolean(token && user),
      async login(email, password) {
        const res = await api.post("/auth/login", { email, password });
        localStorage.setItem(TOKEN_KEY, res.data.token);
        setToken(res.data.token);
        return res.data;
      },
      async register(name, email, password, confirmPassword) {
        const res = await api.post("/auth/register", {
          name,
          email,
          password,
          confirm_password: confirmPassword,
        });
        localStorage.setItem(TOKEN_KEY, res.data.token);
        setToken(res.data.token);
        return res.data;
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      },
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
