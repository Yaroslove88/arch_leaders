'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { changePassword } from '../lib/api';
import { Modal, Button, Input, Field } from '@leadership-architect/ui';

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

  const title = isAuthenticated 
    ? 'Личный кабинет' 
    : isLoginMode 
      ? 'Вход' 
      : 'Регистрация';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
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
                    className="flex items-center gap-2 w-full bg-obsidian-core border border-ui-border-soft py-2 px-4 rounded-lg hover:border-strategic-blue hover:text-strategic-blue transition-colors text-ash-light text-sm"
                  >
                    <span>📖</span>
                    <span>Об Архитекторе</span>
                  </Link>
                  <Link
                    href="/architecture"
                    onClick={onClose}
                    className="flex items-center gap-2 w-full bg-obsidian-core border border-ui-border-soft py-2 px-4 rounded-lg hover:border-strategic-blue hover:text-strategic-blue transition-colors text-ash-light text-sm"
                  >
                    <span>🌳</span>
                    <span>Моё дерево</span>
                  </Link>
                </div>
              </div>

              <div className="border-t border-ui-border-soft pt-4 mt-2">
                <Button
                  variant="secondary"
                  block
                  onClick={() => setShowChangePassword(true)}
                >
                  Сменить пароль
                </Button>
              </div>
              <Button
                variant="critical"
                block
                onClick={handleLogout}
              >
                Выйти
              </Button>
            </>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {error && (
                <div className="bg-obsidian-core border border-tension-red/30 text-tension-red px-4 py-3 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-obsidian-core border border-sage-green/30 text-sage-green px-4 py-3 rounded">
                  {success}
                </div>
              )}
              <Field label="Текущий пароль" htmlFor="currentPassword" required>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                  required
                />
              </Field>
              <Field label="Новый пароль" htmlFor="newPassword" required>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  required
                  minLength={8}
                />
              </Field>
              <Field label="Подтвердите новый пароль" htmlFor="confirmPassword" required>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  required
                  minLength={8}
                />
              </Field>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  block
                  onClick={() => {
                    setShowChangePassword(false);
                    setError(null);
                    setSuccess(null);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  block
                  loading={isLoading}
                >
                  Изменить пароль
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-obsidian-core border border-tension-red/30 text-tension-red px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Field label="Telegram username" htmlFor="telegramUsername" required>
            <Input
              id="telegramUsername"
              type="text"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
              placeholder="username"
              required
            />
          </Field>

          <Field label="Пароль" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLoginMode ? 'Введите пароль' : 'Минимум 8 символов'}
              required
              minLength={isLoginMode ? undefined : 8}
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            block
            loading={isLoading}
          >
            {isLoginMode ? 'Войти' : 'Зарегистрироваться'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError(null);
              }}
              className="text-strategic-blue hover:text-strategic-blue/80 text-sm transition-colors"
            >
              {isLoginMode ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
