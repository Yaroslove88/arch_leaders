'use client';

import { useEffect, useState } from 'react';
import { getAdminUsers, getJobs } from '../../lib/admin-api';
import LoadingSpinner from '../LoadingSpinner';

export function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalJobs: 0,
    pendingJobs: 0,
    failedJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [usersData, jobsData] = await Promise.all([
        getAdminUsers({ limit: 1 }),
        getJobs({ limit: 100 }),
      ]);

      const activeJobs = jobsData.jobs.filter(j => j.status === 'pending' || j.status === 'running');
      const failed = jobsData.jobs.filter(j => j.status === 'failed');

      setStats({
        totalUsers: usersData.total,
        activeUsers: usersData.users.filter(u => u.status === 'active').length,
        totalJobs: jobsData.total,
        pendingJobs: activeJobs.length,
        failedJobs: failed.length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner text="Загрузка статистики..." />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-ui-text-main mb-6">Обзор системы</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ui-text-main mb-2">Всего пользователей</h3>
          <p className="text-3xl font-bold text-system-focus">{stats.totalUsers}</p>
          <p className="text-sm text-ui-text-muted mt-2">Зарегистрировано</p>
        </div>
        
        <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ui-text-main mb-2">Активных</h3>
          <p className="text-3xl font-bold text-system-growth">{stats.activeUsers}</p>
          <p className="text-sm text-ui-text-muted mt-2">Пользователей</p>
        </div>
        
        <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ui-text-main mb-2">Задач в очереди</h3>
          <p className="text-3xl font-bold text-system-stable">{stats.pendingJobs}</p>
          <p className="text-sm text-ui-text-muted mt-2">Ожидают выполнения</p>
        </div>
        
        <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ui-text-main mb-2">Ошибок</h3>
          <p className="text-3xl font-bold text-system-critical">{stats.failedJobs}</p>
          <p className="text-sm text-ui-text-muted mt-2">Неудачных задач</p>
        </div>
      </div>

      <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
        <h3 className="text-lg font-semibold text-ui-text-main mb-4">Быстрые действия</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-ui-border-soft rounded-lg hover:border-system-focus hover:bg-bg-secondary transition-colors text-left">
            <div className="font-semibold text-ui-text-main">Просмотр пользователей</div>
            <div className="text-sm text-ui-text-muted mt-1">Управление пользователями системы</div>
          </button>
          <button className="p-4 border border-ui-border-soft rounded-lg hover:border-system-focus hover:bg-bg-secondary transition-colors text-left">
            <div className="font-semibold text-ui-text-main">Очередь задач</div>
            <div className="text-sm text-ui-text-muted mt-1">Мониторинг и управление задачами</div>
          </button>
          <button className="p-4 border border-ui-border-soft rounded-lg hover:border-system-focus hover:bg-bg-secondary transition-colors text-left">
            <div className="font-semibold text-ui-text-main">Лог аудита</div>
            <div className="text-sm text-ui-text-muted mt-1">История действий администраторов</div>
          </button>
        </div>
      </div>
    </div>
  );
}
