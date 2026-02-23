'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Форма логин/пароль
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  // Обработка логина через login/password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !password) {
      setError('Введите логин и пароль');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
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

  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);
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
            <h2 className="text-2xl font-semibold mb-2 text-ui-text-main">Вход</h2>
            <p className="text-sm text-ui-text-muted mb-6">
              Войдите по логину и паролю.
            </p>

            {/* Форма логин/пароль */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login" className="block text-sm text-ui-text-muted mb-1">
                  Логин
                </label>
                <input
                  id="login"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="login"
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
              {error && (
                <div className="p-3 bg-system-critical/10 border border-system-critical/30 rounded-lg text-sm text-system-critical">
                  {error}
                </div>
              )}
            </form>

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
