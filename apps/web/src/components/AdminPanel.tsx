'use client';

import { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, deleteUser, UserWithDate } from '../lib/api';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [users, setUsers] = useState<UserWithDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string) => {
    if (!newRole) {
      setError('Выберите роль');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateUserRole(userId, newRole);
      await loadUsers();
      setEditingUserId(null);
      setNewRole('');
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении роли');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeleteUserId(userId);
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserId) return;

    setLoading(true);
    setError(null);
    try {
      await deleteUser(deleteUserId);
      await loadUsers();
      setDeleteUserId(null);
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении пользователя');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div
            className="relative bg-bg-panel border border-ui-border-soft rounded-lg shadow-floating max-w-4xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-ui-text-main">Панель администратора</h2>
            <button
              onClick={onClose}
              className="text-ui-text-dim hover:text-ui-text-muted text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-bg-secondary border border-system-critical/30 text-system-critical px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading && !users.length ? (
            <div className="text-center py-8 text-ui-text-muted">Загрузка...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ui-border-soft">
                <thead className="bg-bg-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase tracking-wider border-b border-ui-border-soft">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase tracking-wider border-b border-ui-border-soft">
                      Роль
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase tracking-wider border-b border-ui-border-soft">
                      Дата регистрации
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase tracking-wider border-b border-ui-border-soft">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-bg-panel divide-y divide-ui-border-soft">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-bg-secondary/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-ui-text-main">@{user.telegramUsername}</div>
                        <div className="text-xs text-ui-text-dim font-mono">{user.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === user.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              className="bg-bg-secondary border border-ui-border-soft rounded px-2 py-1 text-sm text-ui-text-main focus:outline-none focus:ring-2 focus:ring-system-focus focus:ring-offset-2 focus:ring-offset-bg-panel"
                            >
                              <option value="">Выберите роль</option>
                              <option value="user">Пользователь</option>
                              <option value="admin">Администратор</option>
                            </select>
                            <button
                              onClick={() => handleUpdateRole(user.id)}
                              disabled={loading}
                              className="bg-system-focus text-ui-text-main px-3 py-1 rounded text-sm hover:bg-system-focus/80 disabled:opacity-50 transition-colors focus:ring-2 focus:ring-system-focus focus:ring-offset-2 focus:ring-offset-bg-panel"
                            >
                              Сохранить
                            </button>
                            <button
                              onClick={() => {
                                setEditingUserId(null);
                                setNewRole('');
                              }}
                              className="bg-bg-secondary border border-ui-border-soft text-ui-text-muted px-3 py-1 rounded text-sm hover:border-ui-border-strong hover:text-ui-text-main transition-colors focus:ring-2 focus:ring-ui-border-soft focus:ring-offset-2 focus:ring-offset-bg-panel"
                            >
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                              user.role === 'admin' 
                                ? 'bg-bg-secondary border-system-stable text-system-stable' 
                                : 'bg-bg-secondary border-ui-border-soft text-ui-text-muted'
                            }`}>
                              {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingUserId(user.id);
                                setNewRole(user.role);
                              }}
                              className="text-system-focus hover:text-system-focus/80 text-sm transition-colors focus:ring-2 focus:ring-system-focus focus:ring-offset-2 focus:ring-offset-bg-panel rounded px-1"
                            >
                              Изменить
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-text-muted">
                        {user.created_at 
                          ? new Date(user.created_at).toLocaleDateString('ru-RU')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={loading}
                          className="text-system-critical hover:text-system-critical/80 disabled:opacity-50 transition-colors focus:ring-2 focus:ring-system-critical focus:ring-offset-2 focus:ring-offset-bg-panel rounded px-1"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="bg-bg-secondary border border-ui-border-soft text-ui-text-muted py-2 px-4 rounded-lg hover:border-ui-border-strong hover:text-ui-text-main transition-colors focus:ring-2 focus:ring-system-focus focus:ring-offset-2 focus:ring-offset-bg-panel"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10" />
    </div>

    <ConfirmDialog
      isOpen={!!deleteUserId}
      title="Удаление пользователя"
      message="Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить."
      confirmText="Удалить"
      cancelText="Отмена"
      variant="danger"
      onConfirm={confirmDeleteUser}
      onCancel={() => setDeleteUserId(null)}
    />
    </>
  );
}

