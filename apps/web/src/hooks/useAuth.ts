'use client';

import { useState, useEffect, useCallback } from 'react';
import { login, register, getUser, setUser, removeUser, getMe, type User, type LoginDto, type RegisterDto, logout as apiLogout } from '../lib/api';

export function useAuth() {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      // Пытаемся получить свежие данные профиля с сервера
      try {
        const freshUser = await getMe();
        setUser(freshUser);
        setUserState(freshUser);
      } catch (error) {
        // Если запрос не удался, откатываемся к localStorage
        const cached = getUser();
        if (cached) {
          setUserState(cached);
        } else {
          removeUser();
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const handleLogin = useCallback(async (data: LoginDto) => {
    try {
      const response = await login(data);
      // Обновляем профиль свежими данными (онбординг/статус)
      try {
        const freshUser = await getMe();
        setUser(freshUser);
        setUserState(freshUser);
      } catch {
        setUserState(response.user);
      }
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const handleRegister = useCallback(async (data: RegisterDto) => {
    try {
      const response = await register(data);
      try {
        const freshUser = await getMe();
        setUser(freshUser);
        setUserState(freshUser);
      } catch {
        setUserState(response.user);
      }
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore
    } finally {
      removeUser();
      setUserState(null);
    }
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
