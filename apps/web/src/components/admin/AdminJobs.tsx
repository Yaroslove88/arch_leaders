'use client';

import { useState, useEffect } from 'react';
import { getJobs, Job } from '../../lib/admin-api';
import LoadingSpinner from '../LoadingSpinner';

export function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    loadJobs();
  }, [statusFilter, typeFilter, page]);

  async function loadJobs() {
    setLoading(true);
    try {
      const data = await getJobs({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        job_type: typeFilter !== 'all' ? typeFilter : undefined,
        limit,
        offset: (page - 1) * limit,
      });
      setJobs(data.jobs);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-sage-green/20 text-sage-green';
      case 'failed':
        return 'bg-tension-red/20 text-tension-red';
      case 'running':
        return 'bg-sage-green/20 text-sage-green';
      case 'pending':
        return 'bg-catalyst-gold/20 text-catalyst-gold';
      default:
        return 'bg-ui-border-soft text-ui-text-muted';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-ash-light">Задачи и система</h2>
        <div className="text-sm text-ui-text-muted">Всего: {total}</div>
      </div>

      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-strategic-blue"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидают</option>
            <option value="running">Выполняются</option>
            <option value="succeeded">Успешно</option>
            <option value="failed">Ошибки</option>
            <option value="cancelled">Отменены</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-strategic-blue"
          >
            <option value="all">Все типы</option>
            <option value="analyze_entry">Анализ записи</option>
            <option value="recompute_user">Пересчет пользователя</option>
            <option value="regenerate_quests">Регенерация квестов</option>
            <option value="backfill">Backfill</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Загрузка задач..." />
      ) : (
        <>
          <div className="bg-graphite-structure border border-ui-border-soft rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-obsidian-core">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Тип</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Создана</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Завершена</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-border-soft">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-obsidian-core">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-ui-text-dim">{job.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ash-light">{job.job_type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-ui-text-muted">
                      {new Date(job.created_at).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 text-sm text-ui-text-muted">
                      {job.finished_at ? new Date(job.finished_at).toLocaleString('ru-RU') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > limit && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-ui-text-muted">
                Показано {(page - 1) * limit + 1} - {Math.min(page * limit, total)} из {total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-ui-border-strong transition-colors"
                >
                  Назад
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= total}
                  className="px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-ui-border-strong transition-colors"
                >
                  Вперед
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

