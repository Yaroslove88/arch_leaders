'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useTelegramNavigation } from '@/hooks/useTelegramNavigation';
import { changePassword, deleteAccount } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function ProfilePageContent() {
  const router = useRouter();
  const toast = useToast();
  const { user, logout } = useAuth();
  
  // Telegram BackButton
  useTelegramNavigation('/dashboard', { hapticFeedback: true });
  
  // Password change state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.showToast('Пароли не совпадают', 'error');
      return;
    }

    if (newPassword.length < 8) {
      toast.showToast('Пароль должен содержать минимум 8 символов', 'error');
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword({ currentPassword, newPassword });
      toast.showToast('Пароль успешно изменён', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    } catch (err: any) {
      toast.showToast(err.message || 'Ошибка при смене пароля', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.showToast('Аккаунт удалён', 'success');
      logout();
      router.push('/');
    } catch (err: any) {
      toast.showToast(err.message || 'Ошибка при удалении аккаунта', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-obsidian-core p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/dashboard" 
            className="text-strategic-blue hover:text-strategic-blue/80 text-sm"
          >
            ← На главную
          </Link>
          <h1 className="text-xl font-bold text-ash-light">Профиль</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* User Info */}
        <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-ash-light mb-4">Информация</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-ui-text-dim">Telegram username</span>
              <p className="text-lg font-medium text-ash-light">@{user?.telegramUsername}</p>
            </div>
            <div>
              <span className="text-sm text-ui-text-dim">Роль</span>
              <p className="text-base text-ash-light">
                {user?.role === 'admin' ? '👑 Администратор' : '👤 Пользователь'}
              </p>
            </div>
            <div>
              <span className="text-sm text-ui-text-dim">ID</span>
              <p className="text-xs text-ui-text-muted font-mono">{user?.id}</p>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-ash-light mb-4">Быстрые ссылки</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/introduce"
              className="flex items-center gap-2 bg-obsidian-core border border-ui-border-soft py-3 px-4 rounded-lg hover:border-strategic-blue transition-colors text-ash-light text-sm"
            >
              <span>📖</span>
              <span>Об Архитекторе</span>
            </Link>
            <Link
              href="/tree"
              className="flex items-center gap-2 bg-obsidian-core border border-ui-border-soft py-3 px-4 rounded-lg hover:border-strategic-blue transition-colors text-ash-light text-sm"
            >
              <span>🌳</span>
              <span>Дерево способностей</span>
            </Link>
            <Link
              href="/experiments"
              className="flex items-center gap-2 bg-obsidian-core border border-ui-border-soft py-3 px-4 rounded-lg hover:border-strategic-blue transition-colors text-ash-light text-sm"
            >
              <span>⚔️</span>
              <span>Квесты</span>
            </Link>
            <Link
              href="/traces"
              className="flex items-center gap-2 bg-obsidian-core border border-ui-border-soft py-3 px-4 rounded-lg hover:border-strategic-blue transition-colors text-ash-light text-sm"
            >
              <span>📝</span>
              <span>Журнал</span>
            </Link>
          </div>
        </section>

        {/* Password Change */}
        <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-ash-light mb-4">Безопасность</h2>
          
          {!showChangePassword ? (
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full bg-obsidian-core border border-ui-border-soft text-ash-light py-3 px-4 rounded-lg hover:border-strategic-blue transition-colors text-sm"
            >
              🔐 Сменить пароль
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm text-ui-text-dim mb-1">
                  Текущий пароль
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                  required
                  className="w-full px-3 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm text-ui-text-dim mb-1">
                  Новый пароль
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm text-ui-text-dim mb-1">
                  Подтвердите пароль
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 bg-obsidian-core border border-ui-border-soft text-ui-text-muted py-2 px-4 rounded-lg hover:border-ui-border-strong transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 bg-strategic-blue text-white py-2 px-4 rounded-lg hover:bg-strategic-blue/90 transition-colors disabled:opacity-50"
                >
                  {isChangingPassword ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Logout */}
        <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6 mb-6">
          <button
            onClick={handleLogout}
            className="w-full bg-obsidian-core border border-ui-border-soft text-ash-light py-3 px-4 rounded-lg hover:border-ui-border-strong transition-colors text-sm"
          >
            🚪 Выйти из аккаунта
          </button>
        </section>

        {/* Danger Zone */}
        <section className="bg-graphite-structure border border-tension-red/30 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-tension-red mb-4">⚠️ Опасная зона</h2>
          <p className="text-sm text-ui-text-dim mb-4">
            Удаление аккаунта необратимо. Все ваши данные, включая записи, квесты и прогресс, будут удалены навсегда.
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full bg-obsidian-core border border-tension-red/50 text-tension-red py-3 px-4 rounded-lg hover:border-tension-red hover:bg-tension-red/10 transition-colors text-sm font-medium"
          >
            🗑️ Удалить аккаунт
          </button>
        </section>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Удалить аккаунт?"
        message="Это действие необратимо. Все ваши данные будут удалены навсегда."
        confirmText={isDeleting ? 'Удаление...' : 'Да, удалить'}
        cancelText="Отмена"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
