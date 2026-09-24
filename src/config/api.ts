import { ModulePermissionKey, UserRole } from '../types/index.ts';

// Central API Base URL - configurable via VITE_API_BASE_URL or VITE_API_URL environment variable
export const API_BASE_URL: string =
  ((import.meta as any).env?.VITE_API_BASE_URL as string) ||
  ((import.meta as any).env?.VITE_API_URL as string) ||
  '/api/v1';

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
          message: res.statusText || 'Failed to parse response from server',
        },
      };
    }
  }

  private async executeFetch<T>(
    method: string,
    url: string,
    body?: unknown,
    retries = 1
  ): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      return await this.handleResponse<T>(res);
    } catch (err: any) {
      if (retries > 0) {
        // Brief pause and retry in case server was starting up
        await new Promise((r) => setTimeout(r, 400));
        return this.executeFetch<T>(method, url, body, retries - 1);
      }
      console.warn(`[ApiClient] Network request failed for ${method} ${url}:`, err);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message:
            err instanceof Error
              ? err.message
              : 'Connection to server failed. Please ensure the backend is active.',
        },
      };
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return this.executeFetch<T>('GET', url);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    return this.executeFetch<T>('POST', url, body);
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    return this.executeFetch<T>('PATCH', url, body);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    return this.executeFetch<T>('PUT', url, body);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    return this.executeFetch<T>('DELETE', url);
  }
}

export const api = new ApiClient();
