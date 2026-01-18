'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { changePassword } from '../lib/api';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, login, register, logout, isAuthenticated } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setTelegramUsername(user.telegramUsername);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLoginMode) {
        await login({ telegramUsername, password });
      } else {
        await register({ telegramUsername, password });
      }
      onClose();
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setPassword('');
    setError(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }

    if (newPassword.length < 8) {
      setError('Новый пароль должен содержать минимум 8 символов');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess('Пароль успешно изменен');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowChangePassword(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Ошибка при смене пароля');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" 
      onClick={onClose}
    >
      <div
        className="relative bg-graphite-structure border border-ui-border-soft rounded-lg shadow-floating max-w-md w-full p-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-ash-light">
              {isAuthenticated ? 'Личный кабинет' : isLoginMode ? 'Вход' : 'Регистрация'}
            </h2>
            <button
              onClick={onClose}
              className="text-ui-text-dim hover:text-ui-text-muted text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>

          {isAuthenticated ? (
            <div className="space-y-4">
              {!showChangePassword ? (
                <>
                  <div className="bg-obsidian-core border border-ui-border-soft rounded-lg p-4">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-ui-text-dim">Telegram username:</span>
                        <p className="text-lg font-semibold text-ash-light">@{user?.telegramUsername}</p>
                      </div>
                      <div>
                        <span className="text-sm text-ui-text-dim">Роль:</span>
                        <p className="text-lg font-semibold text-ash-light">
                          {user?.role === 'admin' ? 'Администратор' : 'Пользователь'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-ui-text-dim">ID:</span>
                        <p className="text-sm text-ui-text-muted font-mono">{user?.id}</p>
                      </div>
                    </div>
                  </div>
                  {/* Быстрые ссылки */}
                  <div className="border-t border-ui-border-soft pt-4 mt-2">
                    <p className="text-xs text-ui-text-dim mb-2">Ссылки</p>
                    <div className="space-y-2">
                      <Link
                        href="/introduce"
                        onClick={onClose}
                        className="flex items-center gap-2 w-full bg-obsidian-core border border-ui-border-soft py-2 px-4 rounded-lg hover:border-system-focus hover:text-system-focus transition-colors text-ash-light text-sm"
                      >
                        <span>📖</span>
                        <span>Об Архитекторе</span>
                      </Link>
                      <Link
                        href="/architecture"
                        onClick={onClose}
                        className="flex items-center gap-2 w-full bg-obsidian-core border border-ui-border-soft py-2 px-4 rounded-lg hover:border-system-focus hover:text-system-focus transition-colors text-ash-light text-sm"
                      >
                        <span>🌳</span>
                        <span>Моё дерево</span>
                      </Link>
                    </div>
                  </div>

                  <div className="border-t border-ui-border-soft pt-4 mt-2">
                    <button
                      onClick={() => setShowChangePassword(true)}
                      className="w-full bg-obsidian-core border border-ui-border-soft text-ui-text-muted py-2 px-4 rounded-lg hover:border-system-focus hover:text-system-focus transition-colors text-sm"
                    >
                      Сменить пароль
                    </button>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-obsidian-core border border-system-critical/50 text-system-critical py-2 px-4 rounded-lg hover:border-system-critical hover:bg-graphite-structure transition-colors text-sm"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {error && (
                    <div className="bg-obsidian-core border border-system-critical/30 text-system-critical px-4 py-3 rounded">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-obsidian-core border border-system-growth/30 text-system-growth px-4 py-3 rounded">
                      {success}
                    </div>
                  )}
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-ash-light mb-1">
                      Текущий пароль
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Введите текущий пароль"
                      required
                      className="w-full px-3 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-system-focus focus:border-system-focus"
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-ash-light mb-1">
                      Новый пароль
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 8 символов"
                      required
                      minLength={8}
                      className="w-full px-3 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-system-focus focus:border-system-focus"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-ash-light mb-1">
                      Подтвердите новый пароль
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повторите новый пароль"
                      required
                      minLength={8}
                      className="w-full px-3 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-system-focus focus:border-system-focus"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePassword(false);
                        setError(null);
                        setSuccess(null);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="flex-1 bg-obsidian-core border border-ui-border-soft text-ui-text-muted py-2 px-4 rounded-lg hover:border-ui-border-strong hover:text-ash-light transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-obsidian-core border border-system-focus text-system-focus py-2 px-4 rounded-lg hover:border-system-focus/70 hover:bg-graphite-structure transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Сохранение...' : 'Изменить пароль'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-obsidian-core border border-system-critical/30 text-system-critical px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="telegramUsername" className="block text-sm font-medium text-ash-light mb-1">
                  Telegram username
                </label>
                <input
                  id="telegramUsername"
                  type="text"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="username"
                  required
                  className="w-full px-3 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-system-focus focus:border-system-focus"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ash-light mb-1">
                  Пароль
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLoginMode ? 'Введите пароль' : 'Минимум 8 символов'}
                  required
                  minLength={isLoginMode ? undefined : 8}
                  className="w-full px-3 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-system-focus focus:border-system-focus"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-obsidian-core border border-system-focus text-system-focus py-2 px-4 rounded-lg hover:border-system-focus/70 hover:bg-graphite-structure transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Загрузка...' : isLoginMode ? 'Войти' : 'Зарегистрироваться'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setError(null);
                  }}
                  className="text-system-focus hover:text-system-focus/80 text-sm transition-colors"
                >
                  {isLoginMode ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                </button>
              </div>
            </form>
          )}
      </div>
    </div>
  );
}

