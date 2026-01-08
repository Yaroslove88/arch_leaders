'use client';

import { useState, useEffect, useCallback } from 'react';
import { login, register, getToken, setToken, getUser, setUser, removeToken, removeUser, type User, type LoginDto, type RegisterDto } from '../lib/api';

export function useAuth() {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Загружаем пользователя из localStorage при монтировании
    const token = getToken();
    const userData = getUser();
    if (token && userData) {
      setUserState(userData);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = useCallback(async (data: LoginDto) => {
    try {
      const response = await login(data);
      setToken(response.access_token);
      setUser(response.user);
      setUserState(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const handleRegister = useCallback(async (data: RegisterDto) => {
    try {
      const response = await register(data);
      setToken(response.access_token);
      setUser(response.user);
      setUserState(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const handleLogout = useCallback(() => {
    removeToken();
    removeUser();
    setUserState(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
}

