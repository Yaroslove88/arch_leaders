'use client';

import { useState, useEffect } from 'react';
import { 
  getAdminUsers, 
  getJobs, 
  getDailyStats, 
  getTopActiveUsers,
  DailyStats,
  UserActivityStats 
} from '../../lib/admin-api';
import LoadingSpinner from '../LoadingSpinner';

interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
}

export function AdminAnalytics() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topUsers, setTopUsers] = useState<UserActivityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 14 | 30>(7);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const [usersData, jobsData, daily, topUsersData] = await Promise.all([
        getAdminUsers({ limit: 1000 }),
        getJobs({ limit: 1000 }),
        getDailyStats(selectedPeriod).catch(() => []),
        getTopActiveUsers(10).catch(() => []),
      ]);

      // Calculate overview from real data
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const activeUsers = usersData.users.filter(u => {
        if (!u.last_seen_at) return false;
        return new Date(u.last_seen_at) >= weekAgo;
      }).length;

      const completedJobs = jobsData.jobs.filter(j => j.status === 'succeeded').length;
      const failedJobs = jobsData.jobs.filter(j => j.status === 'failed').length;
      const pendingJobs = jobsData.jobs.filter(j => j.status === 'pending' || j.status === 'running').length;

      setOverview({
        totalUsers: usersData.total,
        activeUsers,
        totalJobs: jobsData.total,
        completedJobs,
        failedJobs,
        pendingJobs,
      });

      setDailyStats(daily);
      setTopUsers(topUsersData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner text="Загрузка аналитики..." />;
  }

  // Calculate derived metrics
  const maxDailyValue = Math.max(
    ...dailyStats.map(d => Math.max(d.entries_count, d.sessions_succeeded, d.quests_completed)),
    1
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-ash-light">Аналитика продукта</h2>
        <div className="flex gap-2">
          {([7, 14, 30] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                selectedPeriod === period
                  ? 'bg-strategic-blue text-white'
                  : 'bg-obsidian-core border border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong'
              }`}
            >
              {period} дней
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4">
            <h3 className="text-sm font-medium text-ui-text-muted mb-1">Всего пользователей</h3>
            <p className="text-2xl font-bold text-strategic-blue">{overview.totalUsers}</p>
            <p className="text-xs text-ui-text-dim mt-1">
              Активных за неделю: {overview.activeUsers}
            </p>
          </div>

          <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4">
            <h3 className="text-sm font-medium text-ui-text-muted mb-1">Успешность задач</h3>
            <p className="text-2xl font-bold text-sage-green">
              {overview.totalJobs > 0 
                ? Math.round((overview.completedJobs / overview.totalJobs) * 100) 
                : 0}%
            </p>
            <p className="text-xs text-ui-text-dim mt-1">
              {overview.completedJobs} из {overview.totalJobs} завершено
            </p>
          </div>

          <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4">
            <h3 className="text-sm font-medium text-ui-text-muted mb-1">Ошибки задач</h3>
            <p className="text-2xl font-bold text-tension-red">{overview.failedJobs}</p>
            <p className="text-xs text-ui-text-dim mt-1">
              В очереди: {overview.pendingJobs}
            </p>
          </div>

          <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4">
            <h3 className="text-sm font-medium text-ui-text-muted mb-1">Retention</h3>
            <p className="text-2xl font-bold text-sage-green">
              {overview.totalUsers > 0 
                ? Math.round((overview.activeUsers / overview.totalUsers) * 100) 
                : 0}%
            </p>
            <p className="text-xs text-ui-text-dim mt-1">
              Активны за последнюю неделю
            </p>
          </div>
        </div>
      )}

      {/* Activity Chart */}
      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-ash-light mb-4">Активность по дням</h3>
        
        {dailyStats.length > 0 ? (
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-strategic-blue"></div>
                <span className="text-ui-text-muted">Записи</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-sage-green"></div>
                <span className="text-ui-text-muted">Сессии</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-sage-green"></div>
                <span className="text-ui-text-muted">Квесты</span>
              </div>
            </div>

            {/* Simple Bar Chart */}
            <div className="flex items-end gap-1 h-40">
              {dailyStats.slice(-selectedPeriod).map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5 items-end h-32">
                    <div 
                      className="flex-1 bg-strategic-blue rounded-t transition-all"
                      style={{ height: `${(day.entries_count / maxDailyValue) * 100}%`, minHeight: day.entries_count > 0 ? '4px' : '0' }}
                      title={`Записи: ${day.entries_count}`}
                    />
                    <div 
                      className="flex-1 bg-sage-green rounded-t transition-all"
                      style={{ height: `${(day.sessions_succeeded / maxDailyValue) * 100}%`, minHeight: day.sessions_succeeded > 0 ? '4px' : '0' }}
                      title={`Сессии: ${day.sessions_succeeded}`}
                    />
                    <div 
                      className="flex-1 bg-sage-green rounded-t transition-all"
                      style={{ height: `${(day.quests_completed / maxDailyValue) * 100}%`, minHeight: day.quests_completed > 0 ? '4px' : '0' }}
                      title={`Квесты: ${day.quests_completed}`}
                    />
                  </div>
                  <span className="text-[10px] text-ui-text-dim">
                    {new Date(day.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-ui-text-muted">
            <p>Нет данных за выбранный период</p>
            <p className="text-xs mt-2">Данные появятся после добавления API endpoint /admin/v1/analytics/daily</p>
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Active Users */}
        <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ash-light mb-4">Самые активные пользователи</h3>
          
          {topUsers.length > 0 ? (
            <div className="space-y-3">
              {topUsers.map((user, idx) => (
                <div key={user.user_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-obsidian-core text-xs font-semibold text-ui-text-muted">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-ash-light">@{user.telegramUsername}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-strategic-blue">{user.entries_30d}</span>
                    <span className="text-xs text-ui-text-muted ml-1">записей</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-ui-text-muted text-sm">
              Нет данных о топ пользователях
            </div>
          )}
        </div>

        {/* Metrics Description */}
        <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ash-light mb-4">Доступные метрики</h3>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium text-ash-light">Пользователи</h4>
              <ul className="mt-1 space-y-1 text-ui-text-muted">
                <li>• Регистрации по дням</li>
                <li>• DAU / WAU / MAU</li>
                <li>• Retention по когортам</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-ash-light">Контент</h4>
              <ul className="mt-1 space-y-1 text-ui-text-muted">
                <li>• Записи по типам и источникам</li>
                <li>• Успешность анализа сессий</li>
                <li>• Среднее время обработки</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-ash-light">Квесты</h4>
              <ul className="mt-1 space-y-1 text-ui-text-muted">
                <li>• Процент завершения</li>
                <li>• Популярные типы</li>
                <li>• Среднее время выполнения</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
