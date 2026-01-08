'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSession, analyzeEntry } from '@/lib/api';
import { Session } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const sessionId = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  async function loadSession() {
    setLoading(true);
    try {
      const data = await getSession(sessionId);
      setSession(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!session) return;
    setAnalyzing(true);
    try {
      await analyzeEntry(session.entry_id);
      loadSession();
    } catch (error) {
      toast.showToast('Ошибка при анализе', 'error');
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-main p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-ui-text-muted">Загрузка...</div>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-bg-main p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-system-critical">Анализ не найден</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-main p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/sessions" className="text-system-focus hover:text-system-focus/80 mb-4 inline-block transition-colors">
            ← Назад к анализам
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-ui-text-main">Результаты анализа</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <span
              className={`px-3 py-1 rounded text-sm border ${
                session.status === 'done'
                  ? 'bg-bg-secondary border-system-growth text-system-growth'
                  : session.status === 'analyzing'
                  ? 'bg-bg-secondary border-system-warning text-system-warning'
                  : 'bg-bg-secondary border-ui-border-soft text-ui-text-muted'
              }`}
            >
              {session.status === 'done' ? 'Завершён' : 
               session.status === 'analyzing' ? 'Анализируется' : 
               session.status === 'pending' ? 'Ожидает' : session.status}
            </span>
            {session.status !== 'done' && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-4 py-2 bg-system-focus text-ui-text-main rounded hover:bg-system-focus/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-system-focus focus:ring-offset-2 focus:ring-offset-bg-main"
              >
                {analyzing ? 'Анализ...' : 'Запустить анализ'}
              </button>
            )}
          </div>
        </div>

        {/* Сводка */}
        <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Сводка</h2>
          <p className="text-ui-text-main whitespace-pre-wrap">{session.summary}</p>
        </section>

        {/* Темы */}
        {session.themes.length > 0 && (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Темы</h2>
            <div className="flex flex-wrap gap-2">
              {session.themes.map((theme, i) => (
                <span key={i} className="px-3 py-1 bg-bg-secondary border border-system-focus text-system-focus rounded">
                  {theme}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Паттерны */}
        {session.patterns.length > 0 && (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Паттерны</h2>
            <ul className="list-disc list-inside space-y-1">
              {session.patterns.map((pattern, i) => (
                <li key={i} className="text-ui-text-main">{pattern}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Напряжения */}
        {session.tensions.length > 0 && (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Напряжения</h2>
            <ul className="list-disc list-inside space-y-1">
              {session.tensions.map((tension, i) => (
                <li key={i} className="text-ui-text-main">{tension}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Способности */}
        {session.ability_signals_json && (session.ability_signals_json as any[]).length > 0 && (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Проявленные способности</h2>
            <div className="space-y-3">
              {(session.ability_signals_json as any[]).map((signal, i) => (
                <div key={i} className="border-l-4 border-system-focus pl-4 py-2 bg-bg-secondary/30 rounded-r">
                  <div className="text-sm text-ui-text-main">{signal.signal}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Инсайты */}
        {session.insights_json && (session.insights_json as any[]).length > 0 && (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6">
            <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Инсайты</h2>
            <div className="space-y-4">
              {(session.insights_json as any[]).map((insight, i) => (
                <div key={i} className="border-l-4 border-system-growth pl-4 py-2 bg-bg-secondary/30 rounded-r">
                  {insight.title && (
                    <div className="font-semibold mb-1 text-ui-text-main">{insight.title}</div>
                  )}
                  <div className="text-ui-text-muted">{insight.description || insight.text}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

