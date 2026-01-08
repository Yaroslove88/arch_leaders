'use client';

import { useState, useEffect } from 'react';
import { getAuditLog, AuditLog } from '../../lib/admin-api';
import LoadingSpinner from '../LoadingSpinner';

export function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    loadAuditLog();
  }, [actionFilter, targetTypeFilter, page]);

  async function loadAuditLog() {
    setLoading(true);
    try {
      const data = await getAuditLog({
        action: actionFilter !== 'all' ? actionFilter : undefined,
        target_type: targetTypeFilter !== 'all' ? targetTypeFilter : undefined,
        limit,
        offset: (page - 1) * limit,
      });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load audit log:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-ui-text-main">Аудит и безопасность</h2>
        <div className="text-sm text-ui-text-muted">Всего записей: {total}</div>
      </div>

      <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-bg-secondary border border-ui-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-system-focus"
          >
            <option value="all">Все действия</option>
            <option value="view_full_entry">Просмотр полного контента</option>
            <option value="update_user_status">Изменение статуса пользователя</option>
            <option value="rerun_analysis">Перезапуск анализа</option>
            <option value="override_quest">Переопределение квеста</option>
            <option value="activate_config">Активация конфигурации</option>
          </select>
          <select
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-bg-secondary border border-ui-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-system-focus"
          >
            <option value="all">Все типы</option>
            <option value="user">Пользователь</option>
            <option value="entry">Запись</option>
            <option value="session">Сессия</option>
            <option value="quest">Квест</option>
            <option value="config">Конфигурация</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Загрузка логов..." />
      ) : (
        <>
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Время</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Действие</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Тип</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">ID цели</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Причина</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-border-soft">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-bg-secondary">
                    <td className="px-6 py-4 text-sm text-ui-text-muted">
                      {new Date(log.created_at).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 text-sm text-ui-text-main">{log.action}</td>
                    <td className="px-6 py-4 text-sm text-ui-text-main">{log.target_type}</td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-ui-text-dim">{log.target_id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ui-text-muted max-w-xs truncate">
                      {log.reason || '-'}
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
                  className="px-4 py-2 bg-bg-secondary border border-ui-border-soft rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-ui-border-strong transition-colors"
                >
                  Назад
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= total}
                  className="px-4 py-2 bg-bg-secondary border border-ui-border-soft rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-ui-border-strong transition-colors"
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

