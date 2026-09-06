import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { sessionStore } from '../utils/sessionStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── Verify token on mount ── */
  useEffect(() => {
    const bootstrap = async () => {
      await sessionStore.hydrate();
      const { token: storedToken, user: cachedUser } = await sessionStore.getSession();
      setToken(storedToken);
      setUser(cachedUser);

      if (!storedToken) { setLoading(false); return; }
      try {
        const { data } = await authAPI.getMe();
        setUser(data.user);
        await sessionStore.setUser(data.user);
      } catch (err) {
        // Only clear session on explicit 401 (invalid/expired token).
        // Do NOT clear on network errors (CORS, server down, etc.)
        // so the user stays logged in if the server is temporarily unavailable.
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          setUser(null);
          setToken(null);
          await sessionStore.clearSession();
        }
        // For any other error (network, 500, CORS null) keep the cached user
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []); // run once on mount

  const login = useCallback(async (credentials) => {
    const { data } = await authAPI.login(credentials);
    setToken(data.token);
    setUser(data.user);
    await sessionStore.setSession({ token: data.token, user: data.user });
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    setToken(data.token);
    setUser(data.user);
    await sessionStore.setSession({ token: data.token, user: data.user });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    setUser(null);
    setToken(null);
    await sessionStore.clearSession();
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    return sessionStore.setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
