'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AdminOverview } from '../../components/admin/AdminOverview';
import { AdminUsers } from '../../components/admin/AdminUsers';
import { AdminAnalytics } from '../../components/admin/AdminAnalytics';
import { AdminContent } from '../../components/admin/AdminContent';
import { AdminAI } from '../../components/admin/AdminAI';
import { AdminJobs } from '../../components/admin/AdminJobs';
import { AdminAudit } from '../../components/admin/AdminAudit';
import { adminLogin, getAdminMe } from '../../lib/admin-api';

// #region agent log
fetch('http://127.0.0.1:7243/ingest/c0326067-9caf-4823-b221-37edfa52cbb2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin/page.tsx:26',message:'OLD_ADMIN_LOADED',data:{route:'/admin',component:'AdminPage'},timestamp:Date.now(),sessionId:'debug-session',runId:'route-check',hypothesisId:'A'})}).catch(()=>{});
// #endregion

const tabs = [
  { id: 'overview', label: 'Обзор', icon: '📊' },
  { id: 'users', label: 'Пользователи', icon: '👥' },
  { id: 'analytics', label: 'Аналитика', icon: '📈' },
  { id: 'content', label: 'Контент', icon: '📝' },
  { id: 'ai', label: 'AI & Pipeline', icon: '🤖' },
  { id: 'jobs', label: 'Задачи', icon: '⚙️' },
  { id: 'audit', label: 'Аудит', icon: '🔒' },
];

const ADMIN_TOKEN_STORAGE_KEY = 'admin_token';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [adminAuthLoading, setAdminAuthLoading] = useState(true);
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [adminLoginForm, setAdminLoginForm] = useState({ telegramUsername: '', password: '' });
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [adminLoginSubmitting, setAdminLoginSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, authLoading, router]);

  useEffect(() => {
    let cancelled = false;

    async function checkAdminAuth() {
      try {
        setAdminAuthLoading(true);
        setAdminLoginError(null);

        const token = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) : null;
        if (!token) {
          if (!cancelled) setIsAdminAuthed(false);
          return;
        }

        await getAdminMe();
        if (!cancelled) setIsAdminAuthed(true);
      } catch {
        // Токен есть, но невалиден — сбрасываем, чтобы не ловить циклы 401
        if (typeof window !== 'undefined') {
          localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        }
        if (!cancelled) setIsAdminAuthed(false);
      } finally {
        if (!cancelled) setAdminAuthLoading(false);
      }
    }

    checkAdminAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdminPanelLogin(e: React.FormEvent) {
    e.preventDefault();
    setAdminLoginError(null);
    setAdminLoginSubmitting(true);

    try {
      const res = await adminLogin(adminLoginForm.telegramUsername, adminLoginForm.password);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, res.access_token);
      }
      setIsAdminAuthed(true);
    } catch (err: any) {
      setAdminLoginError(err?.message || 'Не удалось войти в админку');
      setIsAdminAuthed(false);
    } finally {
      setAdminLoginSubmitting(false);
    }
  }

  if (authLoading) {
    return <LoadingSpinner fullScreen text="Загрузка..." />;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  if (adminAuthLoading) {
    return <LoadingSpinner fullScreen text="Проверка доступа к админке..." />;
  }

  if (!isAdminAuthed) {
    return (
      <div className="min-h-screen bg-bg-canvas flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-bg-panel border border-ui-border-soft rounded-lg p-6">
          <h1 className="text-xl font-bold text-ui-text-main mb-2">Админ-панель</h1>
          <p className="text-sm text-ui-text-muted mb-6">
            Для доступа нужен отдельный админ-токен (таблица <span className="font-mono">admin_users</span>).
          </p>

          <form onSubmit={handleAdminPanelLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ui-text-main mb-1">Telegram username (без @)</label>
              <input
                type="text"
                value={adminLoginForm.telegramUsername}
                onChange={(e) => setAdminLoginForm({ ...adminLoginForm, telegramUsername: e.target.value })}
                className="w-full px-4 py-2 bg-bg-secondary border border-ui-border-soft rounded-lg text-ui-text-main placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-system-focus focus:border-transparent"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ui-text-main mb-1">Пароль</label>
              <input
                type="password"
                value={adminLoginForm.password}
                onChange={(e) => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                className="w-full px-4 py-2 bg-bg-secondary border border-ui-border-soft rounded-lg text-ui-text-main placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-system-focus focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {adminLoginError && (
              <div className="p-3 bg-system-critical/10 border border-system-critical/30 rounded-lg text-sm text-system-critical">
                {adminLoginError}
              </div>
            )}

            <button
              type="submit"
              disabled={adminLoginSubmitting}
              className="w-full py-2 px-4 bg-system-focus hover:bg-system-focus/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adminLoginSubmitting ? 'Вход...' : 'Войти в админку'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-canvas">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-graphite-structure border-r border-ui-border-soft min-h-screen">
          <div className="p-6 border-b border-ui-border-soft">
            <h1 className="text-xl font-bold text-ash-light">Админ-панель</h1>
            <p className="text-sm text-ui-text-muted mt-1">Leadership Architect</p>
          </div>
          <nav className="p-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-obsidian-core border border-strategic-blue text-strategic-blue'
                    : 'text-ui-text-muted hover:bg-obsidian-core hover:text-ash-light'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'overview' && <AdminOverview />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'analytics' && <AdminAnalytics />}
          {activeTab === 'content' && <AdminContent />}
          {activeTab === 'ai' && <AdminAI />}
          {activeTab === 'jobs' && <AdminJobs />}
          {activeTab === 'audit' && <AdminAudit />}
        </main>
      </div>
    </div>
  );
}

