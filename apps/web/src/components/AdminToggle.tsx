'use client';

import { useState, useEffect } from 'react';
import { isAdmin, toggleAdminMode } from '@/lib/admin';
import { useAuth } from '@/hooks/useAuth';

export function AdminToggle() {
  const [adminMode, setAdminMode] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setAdminMode(isAdmin());
  }, []);

  // Скрываем переключатель, если пользователь не админ
  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleToggle = () => {
    const newMode = toggleAdminMode();
    setAdminMode(newMode);
    // Перезагружаем страницу для применения изменений
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleToggle}
        className={`px-3 py-2 rounded-lg shadow-floating text-xs font-semibold transition-colors border ${
          adminMode
            ? 'bg-system-stable border-system-stable text-ui-text-main hover:bg-system-stable/80'
            : 'bg-bg-secondary border-ui-border-soft text-ui-text-muted hover:bg-bg-hover hover:text-ui-text-main'
        }`}
        title={adminMode ? 'Выключить режим админа' : 'Включить режим админа'}
      >
        {adminMode ? '🔓 ADMIN' : '🔒 USER'}
      </button>
    </div>
  );
}

