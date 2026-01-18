'use client';

import { useState, useEffect } from 'react';
import { getAdminUsers, getUser360, updateUser, User, User360 } from '../../lib/admin-api';
import LoadingSpinner from '../LoadingSpinner';

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User360 | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    loadUsers();
  }, [search, statusFilter, page]);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await getAdminUsers({
        q: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit,
        offset: (page - 1) * limit,
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewUser(userId: string) {
    try {
      const user360 = await getUser360(userId);
      setSelectedUser(user360);
    } catch (error) {
      console.error('Failed to load user 360:', error);
    }
  }

  async function handleUpdateStatus(userId: string, newStatus: string) {
    const reason = prompt('Укажите причину изменения статуса:');
    if (!reason) return;

    try {
      await updateUser(userId, { status: newStatus }, reason);
      await loadUsers();
      const currentUserId = selectedUser?.user?.id;
      if (currentUserId === userId) {
        await handleViewUser(userId);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Ошибка при обновлении пользователя');
    }
  }

  if (selectedUser) {
    // Defensive check: if user property doesn't exist, the API returned user directly
    const displayUser = selectedUser.user || selectedUser;
    // Handle stats - API may return _count or stats
    const stats = selectedUser.stats || {
      entries_count: (selectedUser as any)._count?.entries || 0,
      sessions_count: (selectedUser as any)._count?.sessions || 0,
      quests_active: 0,
      quests_completed: 0,
      abilities_unlocked: 0,
    };
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-ash-light">User 360: @{displayUser.telegramUsername}</h2>
          <button
            onClick={() => setSelectedUser(null)}
            className="px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg hover:border-ui-border-strong transition-colors"
          >
            ← Назад к списку
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
            <h3 className="text-lg font-semibold text-ash-light mb-4">Информация</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-ui-text-muted">ID:</span>
                <span className="ml-2 font-mono text-ash-light">{displayUser.id}</span>
              </div>
              <div>
                <span className="text-ui-text-muted">Username:</span>
                <span className="ml-2 text-ash-light">@{displayUser.telegramUsername}</span>
              </div>
              <div>
                <span className="text-ui-text-muted">Email:</span>
                <span className="ml-2 text-ash-light">{displayUser.email || '-'}</span>
              </div>
              <div>
                <span className="text-ui-text-muted">Статус:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  displayUser.status === 'active' ? 'bg-sage-green/20 text-sage-green' :
                  displayUser.status === 'blocked' ? 'bg-tension-red/20 text-tension-red' :
                  'bg-ui-border-soft text-ui-text-muted'
                }`}>
                  {displayUser.status}
                </span>
              </div>
              <div>
                <span className="text-ui-text-muted">Создан:</span>
                <span className="ml-2 text-ash-light">
                  {new Date(displayUser.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
            <h3 className="text-lg font-semibold text-ash-light mb-4">Статистика</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-strategic-blue">{stats.entries_count}</div>
                <div className="text-sm text-ui-text-muted">Записей</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-sage-green">{stats.sessions_count}</div>
                <div className="text-sm text-ui-text-muted">Сессий</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-sage-green">{stats.quests_active}</div>
                <div className="text-sm text-ui-text-muted">Активных квестов</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-system-warning">{stats.quests_completed}</div>
                <div className="text-sm text-ui-text-muted">Завершено квестов</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ash-light mb-4">Действия</h3>
          <div className="flex gap-4">
            <button
              onClick={() => handleUpdateStatus(displayUser.id, 'active')}
              className="px-4 py-2 bg-sage-green/20 text-sage-green rounded-lg hover:bg-sage-green/30 transition-colors"
            >
              Активировать
            </button>
            <button
              onClick={() => handleUpdateStatus(displayUser.id, 'blocked')}
              className="px-4 py-2 bg-tension-red/20 text-tension-red rounded-lg hover:bg-tension-red/30 transition-colors"
            >
              Заблокировать
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-ash-light">Пользователи</h2>
        <div className="text-sm text-ui-text-muted">Всего: {total}</div>
      </div>

      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4 mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Поиск по username или email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-system-focus"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-system-focus"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="blocked">Заблокированные</option>
            <option value="deleted">Удаленные</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Загрузка пользователей..." />
      ) : (
        <>
          <div className="bg-graphite-structure border border-ui-border-soft rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-obsidian-core">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Создан</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-border-soft">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-obsidian-core">
                    <td className="px-6 py-4">
                      <div className="font-medium text-ash-light">@{user.telegramUsername}</div>
                      <div className="text-xs text-ui-text-dim font-mono">{user.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ui-text-muted">{user.email || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.status === 'active' ? 'bg-sage-green/20 text-sage-green' :
                        user.status === 'blocked' ? 'bg-tension-red/20 text-tension-red' :
                        'bg-ui-border-soft text-ui-text-muted'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-ui-text-muted">
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewUser(user.id)}
                        className="text-strategic-blue hover:text-strategic-blue/80 text-sm"
                      >
                        Просмотр
                      </button>
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
