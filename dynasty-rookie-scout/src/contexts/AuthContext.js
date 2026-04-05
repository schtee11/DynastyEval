import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchMe, login as apiLogin, register as apiRegister, updateProfile as apiUpdateProfile } from '../services/apiClient';

const AuthContext = createContext(null);

const TOKEN_KEY = 'drs_auth_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check for existing token
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user: userData } = await fetchMe();
        setUser(userData);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: userData, token } = await apiLogin(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (email, username, password) => {
    const { user: userData, token } = await apiRegister(email, username, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
    return userData;
  }, []);

  const updateProfile = useCallback(async (data) => {
    const { user: updatedUser } = await apiUpdateProfile(data);
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
