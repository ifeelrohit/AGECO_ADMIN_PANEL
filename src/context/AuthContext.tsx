import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, ModulePermissionKey } from '../types/index.ts';
import {
  api,
  getStoredToken,
  setStoredToken,
  clearStoredAuth,
  hasPermission,
  AUTH_USER_KEY,
} from '../config/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateCurrentUser: (updatedUser: Partial<User>) => void;
  canAccess: (moduleKey: ModulePermissionKey) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state from persistent client storage or auto-sign in
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = getStoredToken();
      const storedUserJson = localStorage.getItem(AUTH_USER_KEY);

      if (storedToken && storedUserJson) {
        try {
          const parsedUser = JSON.parse(storedUserJson);
          if (isMounted) {
            setUser(parsedUser);
            setIsLoading(false);
          }
          return;
        } catch {
          clearStoredAuth();
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        }
      }

      // If no stored token or invalid session, auto-login with default super admin for frictionless access
      try {
        const res = await api.post<{
          accessToken: string;
          user: User;
        }>('/auth/login', {
          email: 'superadmin@ageco.com',
          password: 'AgecoPassword2026!',
        });

        if (res.success && res.data && isMounted) {
          setStoredToken(res.data.accessToken);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.data.user));
          setToken(res.data.accessToken);
          setUser(res.data.user);
        }
      } catch (err) {
        console.warn('[AuthContext] Auto-sign in fallback skipped:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const handleUnauthorized = () => {
      clearStoredAuth();
      setToken(null);
      setUser(null);
    };

    window.addEventListener('ageco:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('ageco:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post<{
        accessToken: string;
        user: User;
      }>('/auth/login', { email, password });

      if (res.success && res.data) {
        setStoredToken(res.data.accessToken);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.data.user));
        setToken(res.data.accessToken);
        setUser(res.data.user);
        return { success: true };
      } else {
        return {
          success: false,
          error: res.error?.message || 'Invalid credentials or account locked.',
        };
      }
    } catch (e: any) {
      return {
        success: false,
        error: e.message || 'Connection to AGECO backend service failed.',
      };
    }
  };

  const logout = async () => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  };

  const updateCurrentUser = (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedData };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
      return merged;
    });
  };

  const canAccess = (moduleKey: ModulePermissionKey): boolean => {
    return hasPermission(user?.role, moduleKey);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateCurrentUser,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
