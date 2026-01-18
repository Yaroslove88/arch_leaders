'use client';

import { useState, useEffect } from 'react';
import { isUserAdmin, isAdminDebugMode, toggleAdminDebugMode } from '@/lib/admin';
import { useAuth } from '@/hooks/useAuth';

export function AdminToggle() {
  const [debugMode, setDebugMode] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setDebugMode(isAdminDebugMode(user));
  }, [user]);

  // Скрываем переключатель, если пользователь не админ
  if (!isUserAdmin(user)) {
    return null;
  }

  const handleToggle = () => {
    const newMode = toggleAdminDebugMode(user);
    setDebugMode(newMode);
    // Перезагружаем страницу для применения изменений
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleToggle}
        className={`px-3 py-2 rounded-lg shadow-floating text-xs font-semibold transition-colors border ${
          debugMode
            ? 'bg-sage-green border-sage-green text-ash-light hover:bg-sage-green/80'
            : 'bg-obsidian-core border-ui-border-soft text-ui-text-muted hover:bg-bg-hover hover:text-ash-light'
        }`}
        title={debugMode ? 'Выключить режим отладки' : 'Включить режим отладки'}
      >
        {debugMode ? '🔓 DEBUG ON' : '🔒 DEBUG OFF'}
      </button>
    </div>
  );
}
