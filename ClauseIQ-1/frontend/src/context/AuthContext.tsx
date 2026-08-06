import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restore session from localStorage on application load
  useEffect(() => {
    const savedToken = localStorage.getItem('clauseiq_token');
    const savedUser = localStorage.getItem('clauseiq_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('clauseiq_token', access_token);
      localStorage.setItem('clauseiq_user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
    } catch (err: any) {
      if (!err.response) {
        throw new Error('Cannot reach the server. Start the backend with: npm run dev:backend');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await api.post('/auth/register', { email: normalizedEmail, password, full_name: fullName });
      // Log in immediately after successful register
      await login(normalizedEmail, password);
    } catch (err: any) {
      if (!err.response) {
        throw new Error('Cannot reach the server. Start the backend with: npm run dev:backend');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('clauseiq_token');
    localStorage.removeItem('clauseiq_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
