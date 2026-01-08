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

const tabs = [
  { id: 'overview', label: 'Обзор', icon: '📊' },
  { id: 'users', label: 'Пользователи', icon: '👥' },
  { id: 'analytics', label: 'Аналитика', icon: '📈' },
  { id: 'content', label: 'Контент', icon: '📝' },
  { id: 'ai', label: 'AI & Pipeline', icon: '🤖' },
  { id: 'jobs', label: 'Задачи', icon: '⚙️' },
  { id: 'audit', label: 'Аудит', icon: '🔒' },
];

export default function AdminPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, authLoading, router]);

  if (authLoading) {
    return <LoadingSpinner fullScreen text="Загрузка..." />;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-canvas">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-bg-panel border-r border-ui-border-soft min-h-screen">
          <div className="p-6 border-b border-ui-border-soft">
            <h1 className="text-xl font-bold text-ui-text-main">Админ-панель</h1>
            <p className="text-sm text-ui-text-muted mt-1">Leadership Architect</p>
          </div>
          <nav className="p-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-bg-secondary border border-system-focus text-system-focus'
                    : 'text-ui-text-muted hover:bg-bg-secondary hover:text-ui-text-main'
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

