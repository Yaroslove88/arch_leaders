'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSessions, Session } from '@/lib/api';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      const data = await getSessions({ status: 'done' });
      setSessions(data.sessions);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-core p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-ui-text-muted">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-core p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-ash-light">Анализы ситуаций</h1>

        {sessions.length === 0 ? (
          <div className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-8 text-center text-ui-text-muted">
            Нет проанализированных ситуаций
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="block bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-6 hover:shadow-active transition bg-panel-gradient"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-ash-light">Анализ ситуации</h3>
                  <span className="px-3 py-1 bg-bg-secondary border border-system-growth/30 text-sage-green rounded text-sm">
                    {session.status === 'done' ? 'Завершён' : 
                     session.status === 'analyzing' ? 'Анализируется' : 
                     session.status === 'pending' ? 'Ожидает' : session.status}
                  </span>
                </div>
                <p className="text-ui-text-muted mb-3 line-clamp-2">{session.summary}</p>
                {session.themes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {session.themes.slice(0, 5).map((theme, i) => (
                      <span key={i} className="text-xs bg-bg-secondary border border-strategic-blue/30 text-strategic-blue px-2 py-1 rounded">
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

