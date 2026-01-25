'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';

/**
 * Layout для всех кастомных разделов админки
 * Проверяет авторизацию и роль пользователя
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка..." />;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-obsidian-core">
      {/* Admin Header */}
      <header className="bg-graphite-structure border-b border-ui-border-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo & Navigation */}
            <div className="flex items-center gap-6">
              <Link 
                href="/admin/overview" 
                className="text-lg font-bold text-ash-light hover:text-strategic-blue transition-colors"
              >
                🛠️ Admin
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link 
                  href="/admin/overview" 
                  className="text-sm text-ui-text-muted hover:text-ash-light transition-colors"
                >
                  Обзор
                </Link>
                <Link 
                  href="/admin/users-management" 
                  className="text-sm text-ui-text-muted hover:text-ash-light transition-colors"
                >
                  Пользователи
                </Link>
                <Link 
                  href="/admin/jobs" 
                  className="text-sm text-ui-text-muted hover:text-ash-light transition-colors"
                >
                  Задачи
                </Link>
                <Link 
                  href="/admin/ai-pipeline" 
                  className="text-sm text-ui-text-muted hover:text-ash-light transition-colors"
                >
                  AI Pipeline
                </Link>
                <Link 
                  href="/admin/settings" 
                  className="text-sm text-ui-text-muted hover:text-ash-light transition-colors"
                >
                  Настройки
                </Link>
              </nav>
            </div>

            {/* Right: User info & Logout */}
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-ui-text-muted hover:text-ash-light transition-colors"
              >
                ← К приложению
              </Link>
              <span className="text-sm text-ui-text-dim">
                👑 {user?.telegramUsername}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm bg-obsidian-core border border-ui-border-soft text-ui-text-muted rounded-lg hover:border-tension-red hover:text-tension-red transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
