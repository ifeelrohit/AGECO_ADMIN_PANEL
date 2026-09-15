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
  canAccess: (moduleKey: ModulePermissionKey) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state from persistent client storage without unverified endpoint calls
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      const storedUserJson = localStorage.getItem(AUTH_USER_KEY);
      if (storedUserJson) {
        try {
          const parsedUser = JSON.parse(storedUserJson);
          setUser(parsedUser);
        } catch {
          clearStoredAuth();
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    const handleUnauthorized = () => {
      clearStoredAuth();
      setToken(null);
      setUser(null);
    };

    window.addEventListener('ageco:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('ageco:unauthorized', handleUnauthorized);
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
