import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { User, AuthResponse, ApiResponse } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  apiFetch: (path: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const tokenRef = useRef<string | null>(null);

  // Sync token ref for fetch closures
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Unified HTTP Client with automatic access token injection & silent refresh
  const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (tokenRef.current && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${tokenRef.current}`);
    }

    let response = await fetch(path, { ...options, headers });

    // Handle token expiration: intercept 401 and attempt token rotation
    if (
      response.status === 401 &&
      !path.includes('/auth/refresh') &&
      !path.includes('/auth/login') &&
      !path.includes('/auth/signup')
    ) {
      try {
        const refreshResponse = await fetch('/api/v1/auth/refresh', { method: 'POST' });
        if (refreshResponse.ok) {
          const resBody: ApiResponse<AuthResponse> = await refreshResponse.json();
          const newToken = resBody.data.accessToken;
          const newUser = resBody.data.user;

          setToken(newToken);
          setUser(newUser);
          tokenRef.current = newToken;

          // Retry the original request with the new access token
          headers.set('Authorization', `Bearer ${newToken}`);
          response = await fetch(path, { ...options, headers });
        } else {
          // Silent refresh failed -> clear authentication context
          setToken(null);
          setUser(null);
          tokenRef.current = null;
        }
      } catch (err) {
        console.error('Session validation failed during silent refresh:', err);
        setToken(null);
        setUser(null);
        tokenRef.current = null;
      }
    }

    return response;
  };

  // Perform silent refresh on mount to check if user has active refresh cookie
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/v1/auth/refresh', { method: 'POST' });
        if (res.ok) {
          const resBody: ApiResponse<AuthResponse> = await res.json();
          setToken(resBody.data.accessToken);
          setUser(resBody.data.user);
        }
      } catch (error) {
        console.warn('Authentication status check omitted (no active session).', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const resBody: ApiResponse<AuthResponse> = await res.json();
    if (!res.ok) {
      throw new Error(resBody.message || 'Login failed');
    }

    setToken(resBody.data.accessToken);
    setUser(resBody.data.user);
  };

  const register = async (email: string, password: string) => {
    const res = await fetch('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const resBody: ApiResponse<AuthResponse> = await res.json();
    if (!res.ok) {
      throw new Error(resBody.message || 'Registration failed');
    }

    setToken(resBody.data.accessToken);
    setUser(resBody.data.user);
  };

  const logout = async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed', error);
    } finally {
      setToken(null);
      setUser(null);
      tokenRef.current = null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
