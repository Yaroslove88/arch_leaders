'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { LoginDto } from '../../lib/api';

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
  const [formData, setFormData] = useState<LoginDto>({
    telegramUsername: '',
    password: '',
  });
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
      await login(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Неверный логин или пароль');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Показываем загрузку, пока проверяем аутентификацию
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-ui-text-muted">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Заголовок и описание */}
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-3 leading-tight">
              <span className="text-system-focus">Архитектор лидерства</span>
            </h1>
            <p className="text-lg text-ui-text-muted mb-8">
              ориентиры для управления в сложных ситуациях
            </p>
            
            {/* Lead текст */}
            <p className="text-xl text-ui-text-main mb-3 leading-relaxed">
              Система, которая превращает реальные рабочие ситуации в карту развития лидерства.
            </p>
            
            {/* Micro line */}
            <p className="text-xs text-ui-text-dim">
              Это рабочая среда для управленческого мышления.
            </p>
          </div>

          {/* Карточки изменений мышления */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-3xl mx-auto">
            <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6 hover:border-ui-border-strong transition-colors">
              <div className="text-3xl mb-3">🧠</div>
              <h3 className="text-lg font-medium text-ui-text-main mb-2">
                Архитектурное мышление
              </h3>
              <p className="text-sm text-ui-text-muted mb-2 font-medium">
                От задач — к формам
              </p>
              <p className="text-sm text-ui-text-dim leading-relaxed">
                Ты учишься видеть не проблемы, а структуры, которые их порождают.
              </p>
            </div>

            <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6 hover:border-ui-border-strong transition-colors">
              <div className="text-3xl mb-3">🌳</div>
              <h3 className="text-lg font-medium text-ui-text-main mb-2">
                Дерево способностей
              </h3>
              <p className="text-sm text-ui-text-muted mb-2 font-medium">
                Карта твоего способа управления
              </p>
              <p className="text-sm text-ui-text-dim leading-relaxed">
                Не навыки. Не уровни. А архитектура того, как ты влияешь.
              </p>
            </div>

            <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6 hover:border-ui-border-strong transition-colors">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-medium text-ui-text-main mb-2">
                Квесты из реальности
              </h3>
              <p className="text-sm text-ui-text-muted mb-2 font-medium">
                Развитие из живого опыта
              </p>
              <p className="text-sm text-ui-text-dim leading-relaxed">
                Система превращает рабочие ситуации в эксперименты над твоим стилем действий.
              </p>
            </div>

            <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6 hover:border-ui-border-strong transition-colors">
              <div className="text-3xl mb-3">🧬</div>
              <h3 className="text-lg font-medium text-ui-text-main mb-2">
                Билды лидерства
              </h3>
              <p className="text-sm text-ui-text-muted mb-2 font-medium">
                Временные идентичности
              </p>
              <p className="text-sm text-ui-text-dim leading-relaxed">
                Ты видишь, в каких ролях живёшь — и учишься свободно входить и выходить из них.
              </p>
            </div>
          </div>

          {/* CTA блок - отдельная панель */}
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-8 max-w-md mx-auto mb-8">
            <h2 className="text-2xl font-semibold mb-2 text-ui-text-main">Начать</h2>
            <p className="text-sm text-ui-text-muted mb-6">
              Быстрый вход через Telegram. Можно начать с одной ситуации.
            </p>

            {/* Telegram OAuth кнопка или форма пароля */}
            {!showPasswordForm ? (
              <>
                {telegramBotId ? (
                  <div className="mb-4">
                    <div id="telegram-login-container"></div>
                  </div>
                ) : (
                  <div className="mb-4 p-4 bg-bg-secondary border border-ui-border-soft rounded text-sm text-ui-text-muted">
                    Telegram OAuth не настроен. Укажите NEXT_PUBLIC_TELEGRAM_BOT_ID в переменных окружения.
                  </div>
                )}

                {/* Разделитель */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-ui-border-soft"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-bg-panel text-ui-text-muted">или</span>
                  </div>
                </div>

                {/* Кнопка переключения на форму пароля */}
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full py-2 px-4 border border-ui-border-soft rounded-lg hover:bg-bg-secondary transition-colors text-ui-text-main"
                >
                  Войти через логин и пароль
                </button>
              </>
            ) : (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label htmlFor="telegramUsername" className="block text-sm font-medium text-ui-text-main mb-1">
                    Telegram username (без @)
                  </label>
                  <input
                    id="telegramUsername"
                    type="text"
                    value={formData.telegramUsername}
                    onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value })}
                    className="w-full px-4 py-2 bg-bg-secondary border border-ui-border-soft rounded-lg text-ui-text-main placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-system-focus focus:border-transparent"
                    placeholder="username"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-ui-text-main mb-1">
                    Пароль
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-bg-secondary border border-ui-border-soft rounded-lg text-ui-text-main placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-system-focus focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {error && (
                  <div className="p-3 bg-system-critical/10 border border-system-critical/30 rounded-lg text-sm text-system-critical">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 bg-system-focus hover:bg-system-focus/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Вход...' : 'Войти'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setError(null);
                  }}
                  className="w-full text-sm text-ui-text-muted hover:text-ui-text-main transition-colors"
                >
                  Вернуться к Telegram входу
                </button>
              </form>
            )}

            {/* Лейбл доверия */}
            <p className="text-xs text-ui-text-dim text-center mt-4">
              Личные данные не публикуются.
            </p>
          </div>
        </div>
      </div>

      {/* Footer one-liner */}
      <div className="pb-6 text-center">
        <p className="text-xs text-ui-text-dim">
          Все рекомендации — гипотезы. Решения — за тобой.
        </p>
      </div>
    </div>
  );
}

