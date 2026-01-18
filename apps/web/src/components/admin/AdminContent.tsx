'use client';

import { useState } from 'react';
import { getUserEntries, getUserSessions, getUserQuests, Entry, Session, Quest } from '../../lib/admin-api';

export function AdminContent() {
  const [activeSection, setActiveSection] = useState<'entries' | 'sessions' | 'quests'>('entries');
  const [userId, setUserId] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    if (!userId) return;
    
    setLoading(true);
    try {
      if (activeSection === 'entries') {
        const data = await getUserEntries(userId, { limit: 50 });
        setEntries(data.entries);
      } else if (activeSection === 'sessions') {
        const data = await getUserSessions(userId, { limit: 50 });
        setSessions(data.sessions);
      } else if (activeSection === 'quests') {
        const data = await getUserQuests(userId, { limit: 50 });
        setQuests(data.quests);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-ash-light mb-6">Контент и геймплей</h2>

      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6 mb-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="ID пользователя..."
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="flex-1 px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-strategic-blue"
          />
          <button
            onClick={loadData}
            disabled={!userId || loading}
            className="px-6 py-2 bg-strategic-blue text-white rounded-lg hover:bg-strategic-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Загрузить
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveSection('entries')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeSection === 'entries'
                ? 'bg-obsidian-core border border-strategic-blue text-strategic-blue'
                : 'bg-obsidian-core border border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong'
            }`}
          >
            Записи
          </button>
          <button
            onClick={() => setActiveSection('sessions')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeSection === 'sessions'
                ? 'bg-obsidian-core border border-strategic-blue text-strategic-blue'
                : 'bg-obsidian-core border border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong'
            }`}
          >
            Сессии
          </button>
          <button
            onClick={() => setActiveSection('quests')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeSection === 'quests'
                ? 'bg-obsidian-core border border-strategic-blue text-strategic-blue'
                : 'bg-obsidian-core border border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong'
            }`}
          >
            Квесты
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-ui-text-muted">Загрузка...</div>
      ) : (
        <>
          {activeSection === 'entries' && (
            <div className="bg-graphite-structure border border-ui-border-soft rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-obsidian-core">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Тип</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Источник</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Создана</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-border-soft">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-obsidian-core">
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-ui-text-dim">{entry.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-ash-light">{entry.type}</td>
                      <td className="px-6 py-4 text-sm text-ash-light">{entry.source}</td>
                      <td className="px-6 py-4 text-sm text-ui-text-muted">
                        {new Date(entry.created_at).toLocaleDateString('ru-RU')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'sessions' && (
            <div className="bg-graphite-structure border border-ui-border-soft rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-obsidian-core">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Статус</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Создана</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Завершена</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-border-soft">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-obsidian-core">
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-ui-text-dim">{session.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-ash-light">{session.status}</td>
                      <td className="px-6 py-4 text-sm text-ui-text-muted">
                        {new Date(session.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 text-sm text-ui-text-muted">
                        {session.completed_at ? new Date(session.completed_at).toLocaleDateString('ru-RU') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'quests' && (
            <div className="bg-graphite-structure border border-ui-border-soft rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-obsidian-core">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Название</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Тип</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Статус</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Создан</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-border-soft">
                  {quests.map((quest) => (
                    <tr key={quest.id} className="hover:bg-obsidian-core">
                      <td className="px-6 py-4 text-sm text-ash-light">{quest.title}</td>
                      <td className="px-6 py-4 text-sm text-ash-light">{quest.type}</td>
                      <td className="px-6 py-4 text-sm text-ash-light">{quest.status}</td>
                      <td className="px-6 py-4 text-sm text-ui-text-muted">
                        {new Date(quest.created_at).toLocaleDateString('ru-RU')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
