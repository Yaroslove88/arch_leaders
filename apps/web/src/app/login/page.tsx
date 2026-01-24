'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { isTelegramWebApp, getTelegramWebApp, initTelegramWebApp } from '../../lib/telegram';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [telegramBotId, setTelegramBotId] = useState<string>('');
  const [showFallbackButton, setShowFallbackButton] = useState(false);
  const [isMiniApp, setIsMiniApp] = useState(false);
  
  // Форма логин/пароль
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Обработка логина через username/password
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Введите логин и пароль');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramUsername: username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка входа' }));
        throw new Error(errorData.message || `Ошибка ${response.status}`);
      }

      const data = await response.json();
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTelegramMiniAppAuth = useCallback(async () => {
    const tg = getTelegramWebApp();
    if (!tg?.initData) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/telegram-webapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData: tg.initData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка входа через Telegram' }));
        throw new Error(errorData.message || 'Ошибка входа через Telegram');
      }

      const data = await response.json();
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ошибка входа через Telegram Mini App');
    } finally {
      setIsSubmitting(false);
    }
  }, [router]);

  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Проверяем, запущены ли мы внутри Telegram Mini App
  useEffect(() => {
    if (isTelegramWebApp()) {
      setIsMiniApp(true);
      initTelegramWebApp();
      
      // Автоматически авторизуем через Mini App
      handleTelegramMiniAppAuth();
    }
  }, [handleTelegramMiniAppAuth]);

  useEffect(() => {
    // Загружаем Telegram Bot ID из переменных окружения
    // В Telegram Login Widget параметр data-telegram-login ожидает username бота (без @).
    // Поддерживаем оба названия env для обратной совместимости.
    const botId =
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID ||
      '';
    
    // Debug: логируем в консоль для проверки (только в development)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[Login] NEXT_PUBLIC_TELEGRAM_BOT_USERNAME:', process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME);
      console.log('[Login] NEXT_PUBLIC_TELEGRAM_BOT_ID:', process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID);
      console.log('[Login] Final botId:', botId);
    }
    
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
      
      script.onerror = () => {
        setError('Не удалось загрузить виджет Telegram. Проверьте подключение к интернету.');
        setShowFallbackButton(true);
      };
      
      const container = document.getElementById('telegram-login-container');
      if (container) {
        container.appendChild(script);
      }
      
      // Fallback: если виджет не загрузился за 3 секунды, показываем кнопку
      const fallbackTimer = setTimeout(() => {
        const container = document.getElementById('telegram-login-container');
        const hasWidget = container?.querySelector('iframe');
        if (!hasWidget) {
          setShowFallbackButton(true);
        }
      }, 3000);
      
      // Проверяем загрузку виджета периодически
      const checkInterval = setInterval(() => {
        const container = document.getElementById('telegram-login-container');
        const hasWidget = container?.querySelector('iframe');
        if (hasWidget) {
          setShowFallbackButton(false);
          clearInterval(checkInterval);
        }
      }, 500);
      
      return () => {
        clearTimeout(fallbackTimer);
        clearInterval(checkInterval);
      };

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

            {/* Telegram OAuth - единственный способ входа */}
            {telegramBotId ? (
              <div className="mb-4">
                {/* Контейнер для Telegram Widget */}
                <div id="telegram-login-container" className="flex justify-center mb-4 min-h-[40px]"></div>
                
                {/* Fallback кнопка, показывается если виджет не загрузился */}
                {showFallbackButton && (
                  <button
                    onClick={() => {
                      // Проверяем, загрузился ли виджет
                      const container = document.getElementById('telegram-login-container');
                      const widgetButton = container?.querySelector('iframe');
                      if (widgetButton) {
                        // Если виджет загрузился, скрываем fallback кнопку
                        setShowFallbackButton(false);
                        // Пытаемся кликнуть на виджет программно (не всегда работает из-за CORS)
                        setError('Виджет загружен. Пожалуйста, используйте кнопку Telegram выше.');
                      } else {
                        // Если виджет не загрузился, предлагаем обновить страницу
                        setError('Виджет Telegram не загрузился. Пожалуйста, обновите страницу (F5 или Cmd+R).');
                      }
                    }}
                    disabled={isSubmitting}
                    className="w-full bg-strategic-blue hover:bg-strategic-blue/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>📱</span>
                    <span>{isSubmitting ? 'Вход...' : 'Войти через Telegram'}</span>
                  </button>
                )}
                
                {error && (
                  <div className="mt-4 p-3 bg-system-critical/10 border border-system-critical/30 rounded-lg text-sm text-system-critical">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <button
                  disabled
                  className="w-full bg-ui-border-soft text-ui-text-muted font-semibold py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>📱</span>
                  <span>Войти через Telegram</span>
                </button>
                <div className="mt-4 p-4 bg-bg-secondary border border-ui-border-soft rounded text-sm text-ui-text-muted">
                  <p className="mb-2">Telegram OAuth не настроен.</p>
                  <p className="text-xs">Укажите NEXT_PUBLIC_TELEGRAM_BOT_USERNAME в Dockerfile или env переменных Timeweb.</p>
                  <p className="text-xs mt-2 font-mono">Текущее значение: {telegramBotId || '(пусто)'}</p>
                </div>
              </div>
            )}

            {/* Разделитель */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-ui-border-soft"></div>
              <span className="px-4 text-xs text-ui-text-dim">или</span>
              <div className="flex-1 border-t border-ui-border-soft"></div>
            </div>

            {/* Форма логин/пароль */}
            {!showLoginForm ? (
              <button
                onClick={() => setShowLoginForm(true)}
                className="w-full text-sm text-ui-text-muted hover:text-ui-text-main transition-colors py-2"
              >
                Войти по логину и паролю →
              </button>
            ) : (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm text-ui-text-muted mb-1">
                    Логин (Telegram username)
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className="w-full px-4 py-3 bg-bg-secondary border border-ui-border-soft rounded-lg text-ui-text-main placeholder-ui-text-dim focus:outline-none focus:border-system-focus"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm text-ui-text-muted mb-1">
                    Пароль
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-bg-secondary border border-ui-border-soft rounded-lg text-ui-text-main placeholder-ui-text-dim focus:outline-none focus:border-system-focus"
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-system-focus hover:bg-system-focus/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Вход...' : 'Войти'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginForm(false)}
                  className="w-full text-sm text-ui-text-dim hover:text-ui-text-muted transition-colors py-2"
                >
                  ← Назад к Telegram
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

