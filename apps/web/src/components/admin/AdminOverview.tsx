'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminUsers, getJobs, getAuditLog, Job, AuditLog } from '../../lib/admin-api';
import LoadingSpinner from '../LoadingSpinner';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  pendingJobs: number;
  runningJobs: number;
  failedJobs: number;
  succeededJobs: number;
  recentAuditLogs: AuditLog[];
  failedJobsList: Job[];
}

export function AdminOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadStats(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [usersData, jobsData, auditData] = await Promise.all([
        getAdminUsers({ limit: 1000 }),
        getJobs({ limit: 100 }),
        getAuditLog({ limit: 10 }),
      ]);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const activeUsers = usersData.users.filter(u => {
        if (!u.last_seen_at) return false;
        return new Date(u.last_seen_at) >= weekAgo;
      }).length;

      const pendingJobs = jobsData.jobs.filter(j => j.status === 'pending');
      const runningJobs = jobsData.jobs.filter(j => j.status === 'running');
      const failedJobs = jobsData.jobs.filter(j => j.status === 'failed');
      const succeededJobs = jobsData.jobs.filter(j => j.status === 'succeeded');

      setStats({
        totalUsers: usersData.total,
        activeUsers,
        totalJobs: jobsData.total,
        pendingJobs: pendingJobs.length,
        runningJobs: runningJobs.length,
        failedJobs: failedJobs.length,
        succeededJobs: succeededJobs.length,
        recentAuditLogs: auditData.logs,
        failedJobsList: failedJobs.slice(0, 5),
      });
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      setError(err?.message || 'Ошибка загрузки данных. Убедитесь что API сервер запущен.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return <LoadingSpinner text="Загрузка статистики..." />;
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-tension-red mb-2">Не удалось загрузить данные</p>
        {error && (
          <p className="text-sm text-ui-text-muted mb-4">{error}</p>
        )}
        <div className="text-xs text-ash-light opacity-50 bg-obsidian-core p-4 rounded max-w-md mx-auto text-left">
          <p className="mb-2">Возможные причины:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>API сервер не запущен (перезапустите: <code className="bg-graphite-structure px-1">cd apps/api && pnpm dev</code>)</li>
            <li>Сессия истекла - перелогиньтесь</li>
            <li>Нет прав доступа к админ API</li>
          </ul>
        </div>
        <button
          onClick={() => loadStats()}
          className="mt-4 px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded hover:border-strategic-blue"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  const hasAlerts = stats.failedJobs > 0 || stats.pendingJobs > 10;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-ash-light">Обзор системы</h2>
        <button
          onClick={() => loadStats(true)}
          disabled={refreshing}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            refreshing 
              ? 'bg-obsidian-core text-ash-light opacity-50 cursor-not-allowed' 
              : 'bg-obsidian-core border border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong'
          }`}
        >
          {refreshing ? '⟳ Обновление...' : '⟳ Обновить'}
        </button>
      </div>

      {/* Alerts Section */}
      {hasAlerts && (
        <div className="mb-6 space-y-3">
          {stats.failedJobs > 0 && (
            <div className="bg-tension-red/10 border border-tension-red/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-tension-red">
                    {stats.failedJobs} задач завершились с ошибкой
                  </p>
                  <p className="text-sm text-tension-red/80">
                    Требуется внимание: проверьте вкладку «Задачи»
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/admin-legacy?tab=jobs')}
                className="px-4 py-2 bg-tension-red/20 text-tension-red rounded hover:bg-tension-red/30 transition-colors"
              >
                Посмотреть
              </button>
            </div>
          )}

          {stats.pendingJobs > 10 && (
            <div className="bg-catalyst-gold/10 border border-catalyst-gold/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-semibold text-catalyst-gold">
                    Большая очередь: {stats.pendingJobs} задач ожидают
                  </p>
                  <p className="text-sm text-catalyst-gold/80">
                    Возможно, требуется масштабирование
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4">
          <h3 className="text-sm font-medium text-ui-text-muted mb-1">Пользователи</h3>
          <p className="text-3xl font-bold text-strategic-blue">{stats.totalUsers}</p>
          <p className="text-xs text-ash-light opacity-50 mt-1">
            Активных за неделю: <span className="text-sage-green">{stats.activeUsers}</span>
          </p>
        </div>

        <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4">
          <h3 className="text-sm font-medium text-ui-text-muted mb-1">Задачи в очереди</h3>
          <p className="text-3xl font-bold text-sage-green">
            {stats.pendingJobs + stats.runningJobs}
          </p>
          <p className="text-xs text-ash-light opacity-50 mt-1">
            Выполняется: {stats.runningJobs} | Ожидает: {stats.pendingJobs}
          </p>
        </div>

        <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4">
          <h3 className="text-sm font-medium text-ui-text-muted mb-1">Успешных задач</h3>
          <p className="text-3xl font-bold text-sage-green">{stats.succeededJobs}</p>
          <p className="text-xs text-ash-light opacity-50 mt-1">
            За последние 100 задач
          </p>
        </div>

        <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4">
          <h3 className="text-sm font-medium text-ui-text-muted mb-1">Ошибки</h3>
          <p className={`text-3xl font-bold ${stats.failedJobs > 0 ? 'text-tension-red' : 'text-sage-green'}`}>
            {stats.failedJobs}
          </p>
          <p className="text-xs text-ash-light opacity-50 mt-1">
            {stats.failedJobs > 0 ? 'Требуется внимание' : 'Всё в порядке'}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Audit Activity */}
        <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ash-light mb-4">Последние действия</h3>
          {stats.recentAuditLogs.length > 0 ? (
            <div className="space-y-3">
              {stats.recentAuditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start justify-between py-2 border-b border-ui-border-soft last:border-0">
                  <div>
                    <p className="text-sm text-ash-light">{log.action}</p>
                    <p className="text-xs text-ash-light opacity-50">
                      {log.target_type} • {new Date(log.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  {log.reason && (
                    <span className="text-xs text-ui-text-muted max-w-32 truncate" title={log.reason}>
                      {log.reason}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ui-text-muted">Нет недавних действий</p>
          )}
        </div>

        {/* Failed Jobs */}
        <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ash-light mb-4">Проблемные задачи</h3>
          {stats.failedJobsList.length > 0 ? (
            <div className="space-y-3">
              {stats.failedJobsList.map((job) => (
                <div key={job.id} className="flex items-start justify-between py-2 border-b border-ui-border-soft last:border-0">
                  <div>
                    <p className="text-sm text-ash-light">{job.job_type}</p>
                    <p className="text-xs text-ash-light opacity-50 font-mono">
                      {job.id.slice(0, 8)}...
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-tension-red/20 text-tension-red rounded text-xs">
                    failed
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <span className="text-2xl">✅</span>
              <p className="text-sm text-ui-text-muted mt-2">Нет проблемных задач</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
        <h3 className="text-lg font-semibold text-ash-light mb-4">Быстрые действия</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => {
              const tabs = document.querySelectorAll('button');
              tabs.forEach(tab => {
                if (tab.textContent?.includes('Пользователи')) {
                  tab.click();
                }
              });
            }}
            className="p-4 border border-ui-border-soft rounded-lg hover:border-strategic-blue hover:bg-obsidian-core transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">👥</span>
              <span className="font-semibold text-ash-light">Пользователи</span>
            </div>
            <p className="text-sm text-ui-text-muted">Управление пользователями системы</p>
          </button>

          <button 
            onClick={() => {
              const tabs = document.querySelectorAll('button');
              tabs.forEach(tab => {
                if (tab.textContent?.includes('Задачи')) {
                  tab.click();
                }
              });
            }}
            className="p-4 border border-ui-border-soft rounded-lg hover:border-strategic-blue hover:bg-obsidian-core transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">⚙️</span>
              <span className="font-semibold text-ash-light">Очередь задач</span>
            </div>
            <p className="text-sm text-ui-text-muted">Мониторинг и управление задачами</p>
          </button>

          <button 
            onClick={() => {
              const tabs = document.querySelectorAll('button');
              tabs.forEach(tab => {
                if (tab.textContent?.includes('Аудит')) {
                  tab.click();
                }
              });
            }}
            className="p-4 border border-ui-border-soft rounded-lg hover:border-strategic-blue hover:bg-obsidian-core transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">🔒</span>
              <span className="font-semibold text-ash-light">Лог аудита</span>
            </div>
            <p className="text-sm text-ui-text-muted">История действий администраторов</p>
          </button>
        </div>
      </div>

      {/* System Health */}
      <div className="mt-6 bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
        <h3 className="text-lg font-semibold text-ash-light mb-4">Состояние системы</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${stats.failedJobs === 0 ? 'bg-sage-green' : 'bg-tension-red'}`}></div>
            <p className="text-sm text-ui-text-muted">Jobs</p>
          </div>
          <div className="text-center">
            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${stats.pendingJobs < 50 ? 'bg-sage-green' : 'bg-catalyst-gold'}`}></div>
            <p className="text-sm text-ui-text-muted">Queue</p>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 rounded-full mx-auto mb-2 bg-sage-green"></div>
            <p className="text-sm text-ui-text-muted">API</p>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 rounded-full mx-auto mb-2 bg-sage-green"></div>
            <p className="text-sm text-ui-text-muted">Database</p>
          </div>
        </div>
      </div>
    </div>
  );
}
