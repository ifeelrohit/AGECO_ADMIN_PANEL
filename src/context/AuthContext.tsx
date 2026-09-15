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
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; label: string; department: string }> = {
  SUPER_ADMIN: {
    email: 'superadmin@ageco.com',
    label: 'Super Administrator',
    department: 'Executive Technical Board',
  },
  ADMIN: {
    email: 'admin@ageco.com',
    label: 'Infrastructure Admin',
    department: 'System & Operations Infrastructure',
  },
  EDITOR: {
    email: 'editor@ageco.com',
    label: 'Technical Editor',
    department: 'Technical Communications & Documentation',
  },
  SALES: {
    email: 'sales@ageco.com',
    label: 'B2B Tenders & Sales Lead',
    department: 'B2B Major Projects & Tenders',
  },
  CONTENT_MANAGER: {
    email: 'content@ageco.com',
    label: 'Digital Content Lead',
    department: 'Brand Marketing & Digital Portals',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify authentication state against backend
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get<User>('/auth/me');
        if (res.success && res.data) {
          setUser(res.data);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.data));
        } else {
          clearStoredAuth();
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to verify session token', err);
        clearStoredAuth();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
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
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      clearStoredAuth();
      setToken(null);
      setUser(null);
    }
  };

  const canAccess = (moduleKey: ModulePermissionKey): boolean => {
    return hasPermission(user?.role, moduleKey);
  };

  const switchDemoRole = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, 'AgecoPassword2026!');
    }
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
        switchDemoRole,
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
