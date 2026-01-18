'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isUserAdmin } from '@/lib/admin';
import { useRouter } from 'next/navigation';

interface SystemCheck {
  name: string;
  status: 'ok' | 'warning' | 'error' | 'loading';
  message: string;
  latency?: number;
}

interface EnvironmentInfo {
  apiUrl: string;
  nodeEnv: string;
  buildTime: string;
}

export default function DebugPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (!authLoading && isAuthenticated && !isUserAdmin(user)) {
      router.push('/dashboard');
      return;
    }

    if (isAuthenticated && isUserAdmin(user)) {
      runDiagnostics();
      loadLocalStorage();
    }
  }, [authLoading, isAuthenticated, user, router]);

  function loadLocalStorage() {
    if (typeof window === 'undefined') return;
    
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          // Truncate long values
          data[key] = value.length > 100 ? value.slice(0, 100) + '...' : value;
        }
      }
    }
    setLocalStorageData(data);
  }

  async function runDiagnostics() {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    setEnvInfo({
      apiUrl,
      nodeEnv: process.env.NODE_ENV || 'unknown',
      buildTime: new Date().toISOString(),
    });

    const newChecks: SystemCheck[] = [];

    // Check API health
    try {
      const start = Date.now();
      const response = await fetch(`${apiUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      const latency = Date.now() - start;
      
      if (response.ok) {
        newChecks.push({
          name: 'API Server',
          status: latency > 1000 ? 'warning' : 'ok',
          message: `Доступен (${latency}ms)`,
          latency,
        });
      } else {
        newChecks.push({
          name: 'API Server',
          status: 'error',
          message: `HTTP ${response.status}`,
        });
      }
    } catch (error: any) {
      newChecks.push({
        name: 'API Server',
        status: 'error',
        message: error.message || 'Недоступен',
      });
    }

    // Check auth endpoint
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const start = Date.now();
        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(5000),
        });
        const latency = Date.now() - start;

        if (response.ok) {
          newChecks.push({
            name: 'Аутентификация',
            status: 'ok',
            message: `Токен валиден (${latency}ms)`,
            latency,
          });
        } else if (response.status === 401) {
          newChecks.push({
            name: 'Аутентификация',
            status: 'warning',
            message: 'Токен истёк или недействителен',
          });
        } else {
          newChecks.push({
            name: 'Аутентификация',
            status: 'error',
            message: `HTTP ${response.status}`,
          });
        }
      } else {
        newChecks.push({
          name: 'Аутентификация',
          status: 'warning',
          message: 'Нет токена в localStorage',
        });
      }
    } catch (error: any) {
      newChecks.push({
        name: 'Аутентификация',
        status: 'error',
        message: error.message || 'Ошибка проверки',
      });
    }

    // Check tree endpoint
    try {
      const token = localStorage.getItem('auth_token');
      const start = Date.now();
      const response = await fetch(`${apiUrl}/tree`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(5000),
      });
      const latency = Date.now() - start;

      if (response.ok) {
        const data = await response.json();
        const nodeCount = data.nodes?.length || 0;
        newChecks.push({
          name: 'Дерево способностей',
          status: nodeCount > 0 ? 'ok' : 'warning',
          message: `${nodeCount} узлов (${latency}ms)`,
          latency,
        });
      } else {
        newChecks.push({
          name: 'Дерево способностей',
          status: 'error',
          message: `HTTP ${response.status}`,
        });
      }
    } catch (error: any) {
      newChecks.push({
        name: 'Дерево способностей',
        status: 'error',
        message: error.message || 'Ошибка загрузки',
      });
    }

    // Check quests endpoint
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const start = Date.now();
        const response = await fetch(`${apiUrl}/quests`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(5000),
        });
        const latency = Date.now() - start;

        if (response.ok) {
          const data = await response.json();
          const questCount = data.quests?.length || 0;
          newChecks.push({
            name: 'Квесты',
            status: 'ok',
            message: `${questCount} квестов (${latency}ms)`,
            latency,
          });
        } else {
          newChecks.push({
            name: 'Квесты',
            status: 'error',
            message: `HTTP ${response.status}`,
          });
        }
      } else {
        newChecks.push({
          name: 'Квесты',
          status: 'warning',
          message: 'Требуется авторизация',
        });
      }
    } catch (error: any) {
      newChecks.push({
        name: 'Квесты',
        status: 'error',
        message: error.message || 'Ошибка загрузки',
      });
    }

    setChecks(newChecks);
    setLoading(false);
  }

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'ok': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'loading': return '⏳';
    }
  };

  const getStatusColor = (status: SystemCheck['status']) => {
    switch (status) {
      case 'ok': return 'text-system-growth';
      case 'warning': return 'text-system-warning';
      case 'error': return 'text-system-critical';
      case 'loading': return 'text-ui-text-muted';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-obsidian-core p-8 flex items-center justify-center">
        <div className="text-ui-text-muted">Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated || !isUserAdmin(user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-obsidian-core p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ui-text-main">🔧 System Debug</h1>
            <p className="text-ui-text-muted mt-1">Диагностика и отладка системы</p>
          </div>
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-colors ${
              loading 
                ? 'bg-obsidian-core text-ash-light opacity-50 cursor-not-allowed'
                : 'bg-system-focus text-white hover:bg-system-focus/80'
            }`}
          >
            {loading ? 'Проверка...' : 'Перезапустить'}
          </button>
        </div>

        {/* System Checks */}
        <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-ui-text-main mb-4">Проверка компонентов</h2>
          <div className="space-y-3">
            {checks.map((check, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between py-3 border-b border-ui-border-soft last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getStatusIcon(check.status)}</span>
                  <span className="font-medium text-ui-text-main">{check.name}</span>
                </div>
                <span className={`text-sm ${getStatusColor(check.status)}`}>
                  {check.message}
                </span>
              </div>
            ))}
            {checks.length === 0 && !loading && (
              <p className="text-ui-text-muted text-center py-4">
                Нажмите "Перезапустить" для запуска диагностики
              </p>
            )}
          </div>
        </div>

        {/* Environment Info */}
        {envInfo && (
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-ui-text-main mb-4">Окружение</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-ui-text-muted">API URL:</span>
                <span className="ml-2 font-mono text-ui-text-main">{envInfo.apiUrl}</span>
              </div>
              <div>
                <span className="text-ui-text-muted">Node Env:</span>
                <span className="ml-2 font-mono text-ui-text-main">{envInfo.nodeEnv}</span>
              </div>
              <div>
                <span className="text-ui-text-muted">Браузер:</span>
                <span className="ml-2 font-mono text-ui-text-main text-xs">
                  {typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-ui-text-muted">Время:</span>
                <span className="ml-2 font-mono text-ui-text-main">
                  {new Date().toLocaleString('ru-RU')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Current User */}
        {user && (
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-ui-text-main mb-4">Текущий пользователь</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-ui-text-muted">ID:</span>
                <span className="ml-2 font-mono text-ui-text-main">{user.id}</span>
              </div>
              <div>
                <span className="text-ui-text-muted">Username:</span>
                <span className="ml-2 text-ui-text-main">@{user.telegramUsername}</span>
              </div>
              <div>
                <span className="text-ui-text-muted">Role:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  user.role === 'admin' 
                    ? 'bg-system-stable/20 text-system-stable' 
                    : 'bg-ui-border-soft text-ui-text-muted'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* LocalStorage */}
        <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ui-text-main">LocalStorage</h2>
            <button
              onClick={() => {
                if (confirm('Очистить localStorage? Это разлогинит вас.')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="px-3 py-1 text-xs bg-system-critical/20 text-system-critical rounded hover:bg-system-critical/30 transition-colors"
            >
              Очистить
            </button>
          </div>
          <div className="space-y-2 text-xs font-mono">
            {Object.entries(localStorageData).map(([key, value]) => (
              <div key={key} className="flex gap-2 py-1 border-b border-ui-border-soft last:border-0">
                <span className="text-system-focus min-w-32">{key}:</span>
                <span className="text-ui-text-muted break-all">{value}</span>
              </div>
            ))}
            {Object.keys(localStorageData).length === 0 && (
              <p className="text-ui-text-muted">LocalStorage пуст</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
          <h2 className="text-lg font-semibold text-ui-text-main mb-4">Быстрые действия</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                console.log('User:', user);
                console.log('LocalStorage:', localStorageData);
                console.log('Checks:', checks);
                alert('Данные выведены в консоль (F12)');
              }}
              className="px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg hover:border-ui-border-strong transition-colors text-sm"
            >
              📋 Log to Console
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('admin_debug_disabled');
                localStorage.removeItem('admin_view_all_disabled');
                alert('Admin режимы сброшены');
              }}
              className="px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg hover:border-ui-border-strong transition-colors text-sm"
            >
              🔄 Reset Admin Modes
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-system-focus text-white rounded-lg hover:bg-system-focus/80 transition-colors text-sm"
            >
              🏠 К админ-панели
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
