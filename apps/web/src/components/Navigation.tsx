'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { UserProfileModal } from './UserProfileModal';
import { AdminPanel } from './AdminPanel';
import { useAuth } from '../hooks/useAuth';

export function Navigation() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  const pathname = usePathname();

  // Закрываем мобильное меню при изменении маршрута
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Закрываем мобильное меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('[data-mobile-menu]')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: '/dashboard', label: 'Обзор', requiresAuth: false },
    { href: '/entries', label: 'Ситуации', requiresAuth: true },
    { href: '/experiments', label: 'Эксперименты', requiresAuth: false },
    { href: '/architecture', label: 'Архитектура', requiresAuth: false },
    { href: '/traces', label: 'Следы', requiresAuth: true },
  ].filter(link => isAuthenticated || !link.requiresAuth);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      <nav className="bg-bg-panel border-b border-ui-border-soft shadow-panel" role="navigation" aria-label="Основная навигация">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link 
                href="/dashboard" 
                className="flex items-center px-2 py-2 text-xl font-bold text-ui-text-main"
                aria-label="Архитектор лидерства - Главная"
              >
                Архитектор лидерства
              </Link>
              {/* Desktop Navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? 'text-system-focus border-b-2 border-system-focus'
                        : 'text-ui-text-muted hover:text-system-focus'
                    }`}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-ui-text-main bg-bg-secondary border border-ui-border-soft hover:border-system-focus rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-system-focus"
                  aria-label="Открыть админ-панель"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Админ-панель</span>
                </Link>
              )}
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-ui-text-muted bg-bg-secondary border border-ui-border-soft hover:border-ui-border-strong hover:text-ui-text-main rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-system-focus"
                aria-label={isAuthenticated ? `Профиль пользователя @${user?.telegramUsername}` : 'Открыть личный кабинет'}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {isAuthenticated ? (
                  <span className="hidden sm:inline">@{user?.telegramUsername}</span>
                ) : (
                  <span className="hidden sm:inline">Личный кабинет</span>
                )}
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-ui-text-dim hover:text-ui-text-muted hover:bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-system-focus"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label="Открыть меню"
                data-mobile-menu
              >
                {isMobileMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            className="sm:hidden border-t border-ui-border-soft bg-bg-panel"
            data-mobile-menu
            role="menu"
            aria-label="Мобильное меню"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-bg-secondary text-system-focus border-l-2 border-system-focus'
                      : 'text-ui-text-muted hover:bg-bg-secondary hover:text-system-focus'
                  }`}
                  role="menuitem"
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
      <UserProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />
    </>
  );
}

