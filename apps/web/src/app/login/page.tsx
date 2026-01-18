'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { LoginDto, RegisterDto, register as registerUser } from '../../lib/api';

declare global {
  interface Window {
    Telegram?: {
      Login: {
        auth: (options: {
          bot_id: string;
          request_access?: boolean;
          lang?: string;
          callback?: (user: any) => void;
        }) => void;
      };
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState<LoginDto | RegisterDto>({
    telegramUsername: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [telegramBotId, setTelegramBotId] = useState<string>('');

  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Загружаем Telegram Bot ID из переменных окружения
    const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || '';
    setTelegramBotId(botId);

    // Загружаем Telegram Login Widget скрипт
    if (botId && typeof window !== 'undefined') {
      // Определяем глобальную функцию для обработки OAuth
      (window as any).onTelegramAuth = async (user: any) => {
        try {
          setIsSubmitting(true);
          setError(null);
          
          // Отправляем данные на бэкенд для аутентификации через Telegram OAuth
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/telegram`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              username: user.username,
              photo_url: user.photo_url,
              auth_date: user.auth_date,
              hash: user.hash,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Ошибка входа через Telegram' }));
            throw new Error(errorData.message || 'Ошибка входа через Telegram');
          }

          const data = await response.json();
          
          // Сохраняем токен и пользователя
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', data.access_token);
            localStorage.setItem('auth_user', JSON.stringify(data.user));
          }
          
          // Перенаправляем на дашборд
          router.push('/dashboard');
        } catch (err: any) {
          setError(err.message || 'Ошибка входа через Telegram');
        } finally {
          setIsSubmitting(false);
        }
      };

      // Загружаем скрипт Telegram Widget
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botId);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-userpic', 'true');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.async = true;
      
      const container = document.getElementById('telegram-login-container');
      if (container) {
        container.appendChild(script);
      }

      return () => {
        // Очистка при размонтировании
        const container = document.getElementById('telegram-login-container');
        if (container) {
          container.innerHTML = '';
        }
        delete (window as any).onTelegramAuth;
      };
    }
  }, [router]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(formData as LoginDto);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Неверный логин или пароль');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Валидация
    if (formData.password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.telegramUsername)) {
      setError('Telegram username может содержать только буквы, цифры и подчеркивания');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerUser(formData as RegisterDto);
      
      // Сохраняем токен и пользователя
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', result.access_token);
        localStorage.setItem('auth_user', JSON.stringify(result.user));
      }
      
      // Перенаправляем на дашборд
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Показываем загрузку, пока проверяем аутентификацию
  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian-core flex items-center justify-center">
        <div className="text-ui-text-muted">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-core flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 leading-tight">
              <span className="text-strategic-blue">Архитектор лидерства</span>
            </h1>
            <p className="text-base text-ui-text-muted">
              Ориентиры для управления
            </p>
          </div>

          {/* Главный value proposition */}
          <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6 mb-6">
            <p className="text-lg text-ash-light text-center leading-relaxed mb-6">
              Опиши ситуацию — система покажет, какие способности ты уже проявляешь, и предложит эксперимент для роста
            </p>

            {/* Telegram OAuth кнопка или форма пароля */}
            {!showPasswordForm ? (
              <>
                {telegramBotId ? (
                  <div className="flex justify-center mb-4">
                    <div id="telegram-login-container"></div>
                  </div>
                ) : (
                  <div className="mb-4 p-4 bg-obsidian-core border border-ui-border-soft rounded text-sm text-ui-text-muted text-center">
                    Telegram OAuth не настроен
                  </div>
                )}

                {/* Разделитель */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-ui-border-soft"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-graphite-structure text-ui-text-dim">или</span>
                  </div>
                </div>

                {/* Кнопки переключения на форму пароля */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setShowPasswordForm(true);
                      setIsRegisterMode(false);
                    }}
                    className="w-full py-2.5 px-4 border border-ui-border-soft rounded-lg hover:bg-obsidian-core transition-colors text-ash-light text-sm"
                  >
                    Войти по логину и паролю
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(true);
                      setIsRegisterMode(true);
                    }}
                    className="w-full py-2.5 px-4 bg-strategic-blue hover:bg-strategic-blue/80 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Зарегистрироваться
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={isRegisterMode ? handleRegister : handlePasswordLogin} className="space-y-4">
                <div className="text-center mb-2">
                  <h3 className="text-lg font-semibold text-ash-light">
                    {isRegisterMode ? 'Регистрация' : 'Вход'}
                  </h3>
                </div>
                <div>
                  <label htmlFor="telegramUsername" className="block text-sm font-medium text-ash-light mb-1">
                    Telegram username (без @)
                  </label>
                  <input
                    id="telegramUsername"
                    type="text"
                    value={formData.telegramUsername}
                    onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value })}
                    className="w-full px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-transparent"
                    placeholder="username"
                    required
                  />
                  {isRegisterMode && (
                    <p className="text-xs text-ui-text-muted mt-1">
                      Только буквы, цифры и подчеркивания
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-ash-light mb-1">
                    Пароль
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                  {isRegisterMode && (
                    <p className="text-xs text-ui-text-muted mt-1">
                      Минимум 8 символов
                    </p>
                  )}
                </div>
                {isRegisterMode && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-ash-light mb-1">
                      Подтвердите пароль
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                )}
                {error && (
                  <div className="p-3 bg-tension-red/10 border border-tension-red/30 rounded-lg text-sm text-tension-red">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-strategic-blue hover:bg-strategic-blue/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (isRegisterMode ? 'Регистрация...' : 'Вход...') : (isRegisterMode ? 'Зарегистрироваться' : 'Войти')}
                </button>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(!isRegisterMode);
                      setError(null);
                      setConfirmPassword('');
                    }}
                    className="w-full text-sm text-strategic-blue hover:text-strategic-blue/80 transition-colors"
                  >
                    {isRegisterMode ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setIsRegisterMode(false);
                      setError(null);
                      setConfirmPassword('');
                    }}
                    className="w-full text-sm text-ui-text-muted hover:text-ash-light transition-colors"
                  >
                    Вернуться к Telegram входу
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Ссылка на introduce */}
          <div className="text-center mb-8">
            <Link 
              href="/introduce" 
              className="text-sm text-ui-text-muted hover:text-strategic-blue transition-colors inline-flex items-center gap-1"
            >
              <span>Как это работает?</span>
              <span>→</span>
            </Link>
          </div>

          {/* Мини-иконки элементов системы */}
          <div className="border-t border-ui-border-soft pt-6">
            <p className="text-xs text-ui-text-dim text-center mb-4">Элементы системы</p>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl mb-1">🌳</div>
                <p className="text-xs text-ui-text-muted">Дерево<br/>способностей</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">⚔️</div>
                <p className="text-xs text-ui-text-muted">Квесты<br/>из жизни</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">📊</div>
                <p className="text-xs text-ui-text-muted">Кейсы<br/>симуляции</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6 text-center">
        <p className="text-xs text-ui-text-dim">
          Личные данные не публикуются. Все рекомендации — гипотезы.
        </p>
      </div>
    </div>
  );
}
