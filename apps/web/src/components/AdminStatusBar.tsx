'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isUserAdmin, isAdminDebugMode, toggleAdminDebugMode } from '@/lib/admin';
import { useAuth } from '@/hooks/useAuth';

export function AdminStatusBar() {
  const { user } = useAuth();
  const router = useRouter();
  const [debugMode, setDebugMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isUserAdmin(user)) {
      setDebugMode(isAdminDebugMode(user));
    }
  }, [user]);

  // Don't show if not admin
  if (!isUserAdmin(user)) {
    return null;
  }

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed top-20 left-4 z-40 px-2 py-1 rounded shadow-floating text-xs font-semibold transition-colors bg-graphite-structure border border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong"
        title="Показать статус-бар админа"
      >
        🔧
      </button>
    );
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-obsidian-core/95 backdrop-blur-sm border-b border-ui-border-soft">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
        {/* Left: Status Info */}
        <div className="flex items-center gap-4">
          <span className="font-semibold text-sage-green">ADMIN MODE</span>
          <span className="text-ui-text-muted">
            Вы вошли как администратор (@{user?.telegramUsername})
          </span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Debug Mode Toggle */}
          <button
            onClick={() => {
              const newMode = toggleAdminDebugMode(user);
              setDebugMode(newMode);
              window.location.reload(); // Reload to apply changes
            }}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              debugMode 
                ? 'bg-catalyst-gold/20 text-catalyst-gold' 
                : 'bg-graphite-structure border border-ui-border-soft text-ui-text-muted'
            }`}
            title={debugMode ? 'Debug панели включены' : 'Debug панели выключены'}
          >
            {debugMode ? '🔓 Debug ON' : '🔒 Debug OFF'}
          </button>

          {/* Quick Links */}
          <button
            onClick={() => router.push('/admin-legacy')}
            className="px-2 py-1 bg-graphite-structure border border-ui-border-soft rounded hover:border-ui-border-strong transition-colors"
          >
            Админка
          </button>
          
          <button
            onClick={() => router.push('/debug')}
            className="px-2 py-1 bg-graphite-structure border border-ui-border-soft rounded hover:border-ui-border-strong transition-colors"
          >
            Debug
          </button>

          {/* Collapse */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-ui-text-dim hover:text-ui-text-muted transition-colors"
            title="Свернуть"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
