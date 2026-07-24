import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ailos_token');
    if (token) {
      api.setToken(token);
      api.get('/dashboard')
        .then(data => setUser(data.user))
        .catch(() => { api.setToken(null); localStorage.removeItem('ailos_token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (account, password) => {
    const result = await api.post('/auth/password', { account, password });
    api.setToken(result.tokens.accessToken);
    setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (data) => {
    const result = await api.post('/auth/register', data);
    api.setToken(result.tokens.accessToken);
    setUser(result.user);
    return result;
  }, []);

  const sendCode = useCallback(async (phone) => {
    return api.post('/auth/send-code', { phone });
  }, []);

  const phoneLogin = useCallback(async (phone, code) => {
    const result = await api.post('/auth/phone', { phone, code });
    api.setToken(result.tokens.accessToken);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    api.setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, sendCode, phoneLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}