import { ModulePermissionKey, UserRole } from '../types/index.ts';

// Central API Base URL - configurable via VITE_API_URL environment variable
export const API_BASE_URL: string =
  ((import.meta as any).env?.VITE_API_URL as string) || '/api/v1';

// Token storage key
export const AUTH_TOKEN_KEY = 'ageco_adp_access_token';
export const AUTH_USER_KEY = 'ageco_adp_user_profile';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to save auth token to localStorage', e);
  }
}

export function clearStoredAuth(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (e) {
    console.error('Failed to clear stored auth', e);
  }
}

// Strictly locked role matrix per Section 8 of requirements
export const ROLE_PERMISSIONS: Record<ModulePermissionKey, readonly UserRole[]> = {
  system_settings: ['SUPER_ADMIN', 'ADMIN'] as const,
  user_management: ['SUPER_ADMIN', 'ADMIN'] as const,
  audit_logs: ['SUPER_ADMIN', 'ADMIN'] as const,
  database_diagnostics: ['SUPER_ADMIN', 'ADMIN'] as const,
  catalogue_management: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'CONTENT_MANAGER'] as const,
  brand_management: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'CONTENT_MANAGER'] as const,
  product_management: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'CONTENT_MANAGER'] as const,
  website_content: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'CONTENT_MANAGER'] as const,
  enquiries: ['SUPER_ADMIN', 'ADMIN', 'SALES'] as const,
  admin_dashboard: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'SALES', 'CONTENT_MANAGER'] as const,
};

export function hasPermission(role: UserRole | undefined, moduleKey: ModulePermissionKey): boolean {
  if (!role) return false;
  const allowed = ROLE_PERMISSIONS[moduleKey];
  return allowed ? (allowed as readonly UserRole[]).includes(role) : false;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  total?: number;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
    if (res.status === 401) {
      // Dispatches an event so AuthContext can handle logout gracefully
      window.dispatchEvent(new CustomEvent('ageco:unauthorized'));
    }

    try {
      const data = await res.json();
      if (!res.ok && !data.error) {
        return {
          success: false,
          error: {
            code: `HTTP_${res.status}`,
            message: data.message || `Request failed with status ${res.status}`,
          },
        };
      }
      return data;
    } catch {
      return {
        success: false,
        error: {
          code: `HTTP_${res.status}`,
          message: res.statusText || 'Failed to parse JSON response',
        },
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(res);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(res);
  }
}

export const api = new ApiClient();
