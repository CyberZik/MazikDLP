import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  auth as authApi,
  saveTokens,
  clearTokens,
  saveUser,
  loadUser,
  getRefreshToken,
  setUnauthorizedHandler,
  type CurrentUser,
} from '../lib/api';

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = loadUser();
    if (saved) setUser(saved);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      const rt = getRefreshToken();
      if (rt) await authApi.logout(rt);
    } catch { /* ignore errors on logout */ }
    clearTokens();
    setUser(null);
  }, []);

  // Register a global 401 handler so any API call can trigger logout
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    saveTokens(tokens.access_token, tokens.refresh_token);

    // Decode JWT payload to extract user info (no signature check needed client-side)
    const payload = JSON.parse(atob(tokens.access_token.split('.')[1]));
    const currentUser: CurrentUser = {
      user_id: payload.sub,
      org_id: payload.org_id,
      email,
      name: payload.name || email.split('@')[0],
      role: payload.role,
    };
    saveUser(currentUser);
    setUser(currentUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
