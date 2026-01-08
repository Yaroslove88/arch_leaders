'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuests } from '../../hooks/useQuests';
import { useSessions } from '../../hooks/useSessions';
import { useEntries } from '../../hooks/useEntries';
import { getSemanticTree, getCurrentBuild, getToken } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AddEntryModal } from '../../components/AddEntryModal';

interface NodeChange {
  nodeId: string;
  nodeName: string;
  changeType: 'available' | 'integrated' | 'lost_relevance';
  timestamp: string;
}

function DashboardContent() {
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [recentChanges, setRecentChanges] = useState<NodeChange[]>([]);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  // Получаем токен только на клиенте после монтирования
  useEffect(() => {
    // Убеждаемся, что код выполняется только на клиенте
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      setMounted(true);
      const currentToken = getToken();
      setToken(currentToken);
      
      // Загружаем сохраненные изменения из localStorage
      const savedChanges = localStorage.getItem('node_changes');
      if (savedChanges) {
        try {
          const parsed = JSON.parse(savedChanges);
          if (Array.isArray(parsed)) {
            setRecentChanges(parsed);
          }
        } catch (parseError) {
          console.error('Failed to parse saved changes', parseError);
        }
      }
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    }
  }, []);

  const { data: questsData, isLoading: questsLoading, error: questsError } = useQuests('active');
  const { data: sessionsData, isLoading: sessionsLoading, error: sessionsError } = useSessions({ status: 'done' });
  const { data: entriesData } = useEntries({ limit: 10 });
  const { data: tree, isLoading: treeLoading } = useQuery({
    queryKey: ['tree', 'semantic'],
    queryFn: getSemanticTree,
    enabled: !!token && mounted,
    retry: false,
  });
  const { data: currentBuilds, isLoading: buildsLoading } = useQuery({
    queryKey: ['builds', 'current'],
    queryFn: getCurrentBuild,
    enabled: !!token && mounted,
    retry: false,
  });

  // Все вычисления должны быть до условного возврата, чтобы хуки вызывались в одном порядке
  // Показываем пустые данные вместо ошибки для неавторизованных пользователей
  const quests = questsData?.quests || [];
  const activeQuests = useMemo(() => 
    quests.filter((q: any) => q.status === 'active').slice(0, 5),
    [quests]
  );
  const sessions = useMemo(() => 
    sessionsData?.sessions?.slice(0, 5) || [],
    [sessionsData]
  );
  const recentEntries = useMemo(() => 
    entriesData?.entries?.slice(0, 3) || [],
    [entriesData]
  );

  const unlockedNodes = useMemo(() => 
    tree?.nodes?.filter((n: any) => 
      n.state === 'unlocked' || n.state === 'integrated'
    ).length || 0,
    [tree]
  );
  const totalNodes = useMemo(() => 
    tree?.nodes?.length || 0,
    [tree]
  );

  const activeBuilds = useMemo(() => 
    Array.isArray(currentBuilds) ? currentBuilds.filter((b: any) => b.is_active) : [],
    [currentBuilds]
  );

  // Фокус недели - приоритетный активный квест или последняя ситуация
  const weekFocus = useMemo(() => {
    if (activeQuests.length > 0) {
      // Берем первый активный квест как фокус недели
      return {
        type: 'quest' as const,
        data: activeQuests[0],
      };
    } else if (recentEntries.length > 0) {
      return {
        type: 'entry' as const,
        data: recentEntries[0],
      };
    }
    return null;
  }, [activeQuests, recentEntries]);

  // Отслеживание изменений узлов
  useEffect(() => {
    if (!tree?.nodes || !mounted || typeof window === 'undefined') return;

    try {
      const savedNodeStates = localStorage.getItem('node_states');
      const previousStates = savedNodeStates ? JSON.parse(savedNodeStates) : {};
      const currentStates: Record<string, string> = {};
      const newChanges: NodeChange[] = [];

      tree.nodes.forEach((node: any) => {
        currentStates[node.node_id] = node.state;
        const previousState = previousStates[node.node_id];

        if (previousState && previousState !== node.state) {
          // Узел изменил состояние
          if (node.state === 'available' && previousState === 'locked') {
            newChanges.push({
              nodeId: node.node_id,
              nodeName: node.name || node.node_id,
              changeType: 'available',
              timestamp: new Date().toISOString(),
            });
          } else if (node.state === 'integrated' && previousState !== 'integrated') {
            newChanges.push({
              nodeId: node.node_id,
              nodeName: node.name || node.node_id,
              changeType: 'integrated',
              timestamp: new Date().toISOString(),
            });
          } else if (node.state === 'locked' && (previousState === 'available' || previousState === 'unlocked')) {
            newChanges.push({
              nodeId: node.node_id,
              nodeName: node.name || node.node_id,
              changeType: 'lost_relevance',
              timestamp: new Date().toISOString(),
            });
          }
        }
      });

      // Сохраняем текущие состояния
      localStorage.setItem('node_states', JSON.stringify(currentStates));

      // Обновляем список изменений (сохраняем последние 20)
      if (newChanges.length > 0) {
        setRecentChanges((prev) => {
          const allChanges = [...newChanges, ...prev].slice(0, 20);
          localStorage.setItem('node_changes', JSON.stringify(allChanges));
          return allChanges;
        });
      }
    } catch (error) {
      console.error('Error processing node changes:', error);
    }
  }, [tree, mounted]);

  // Показываем загрузку, если еще не смонтирован или идет загрузка данных
  const isLoading = !mounted || questsLoading || sessionsLoading || treeLoading || buildsLoading;

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка данных..." />;
  }

  // Последние изменения (последние 5)
  const latestChanges = recentChanges.slice(0, 5);

  return (
    <main className="min-h-screen bg-bg-main p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-ui-text-main" id="page-title">Обзор</h1>

        {/* Фокус недели */}
        {weekFocus && (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-8 bg-panel-gradient" aria-labelledby="week-focus-heading">
            <h2 id="week-focus-heading" className="text-xl font-bold mb-4 text-ui-text-main flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Фокус недели
            </h2>
            {weekFocus.type === 'quest' ? (
              <div className="border-l-4 border-system-focus pl-4 py-2 bg-bg-secondary rounded">
                <h3 className="font-semibold text-ui-text-main mb-1">{weekFocus.data.title}</h3>
                <p className="text-sm text-ui-text-muted mb-2">{weekFocus.data.description}</p>
                <Link 
                  href={`/quests/${weekFocus.data.id}`}
                  className="text-sm text-system-focus hover:text-system-focus/80 hover:underline"
                >
                  Перейти к квесту →
                </Link>
              </div>
            ) : (
              <div className="border-l-4 border-system-growth pl-4 py-2 bg-bg-secondary rounded">
                <h3 className="font-semibold text-ui-text-main mb-1">Последняя ситуация</h3>
                <p className="text-sm text-ui-text-muted mb-2 line-clamp-2">{weekFocus.data.text}</p>
                <Link 
                  href={`/entries/${weekFocus.data.id}`}
                  className="text-sm text-system-focus hover:text-system-focus/80 hover:underline"
                >
                  Открыть ситуацию →
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Последние изменения */}
        {latestChanges.length > 0 && (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-8 bg-panel-gradient" aria-labelledby="changes-heading">
            <h2 id="changes-heading" className="text-xl font-bold mb-4 text-ui-text-main flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Последние изменения
            </h2>
            <div className="space-y-3">
              {latestChanges.map((change, index) => (
                <div 
                  key={`${change.nodeId}-${index}`}
                  className={`border-l-4 pl-4 py-2 bg-bg-secondary rounded ${
                    change.changeType === 'available' ? 'border-system-warning' :
                    change.changeType === 'integrated' ? 'border-system-growth' :
                    'border-ui-border-soft'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-ui-text-main">
                        {change.changeType === 'available' && '✅ Стало доступно: '}
                        {change.changeType === 'integrated' && '🔗 Интегрируется: '}
                        {change.changeType === 'lost_relevance' && '⚠️ Потеряло актуальность: '}
                        <span className="font-semibold">{change.nodeName}</span>
                      </p>
                      <p className="text-xs text-ui-text-muted mt-1">
                        {new Date(change.timestamp).toLocaleDateString('ru-RU', { 
                          day: 'numeric', 
                          month: 'long', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <Link 
                      href={`/tree?node=${change.nodeId}`}
                      className="text-xs text-system-focus hover:text-system-focus/80 hover:underline ml-4"
                    >
                      Открыть →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Статистика */}
        <section aria-labelledby="stats-heading" className="mb-8">
          <h2 id="stats-heading" className="sr-only">Статистика</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6">
            <h3 className="text-lg font-semibold mb-2 text-ui-text-main">Активные квесты</h3>
            <p className="text-3xl font-bold text-system-focus">{activeQuests.length}</p>
          </div>
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6">
            <h3 className="text-lg font-semibold mb-2 text-ui-text-main">Проанализировано</h3>
            <p className="text-3xl font-bold text-system-growth">{sessions.length}</p>
          </div>
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6">
            <h3 className="text-lg font-semibold mb-2 text-ui-text-main">Разблокировано узлов</h3>
            <p className="text-3xl font-bold text-system-stable">{unlockedNodes} / {totalNodes}</p>
          </div>
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6">
            <h3 className="text-lg font-semibold mb-2 text-ui-text-main">Активные билды</h3>
            <p className="text-3xl font-bold text-system-warning">{activeBuilds.length}</p>
            {activeBuilds.length > 0 && (
              <Link href="/builds" className="text-xs text-system-focus hover:text-system-focus/80 hover:underline mt-2 block transition-colors">
                Посмотреть →
              </Link>
            )}
          </div>
          </div>
        </section>

        {/* Активные билды */}
        {activeBuilds.length > 0 && (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-8 bg-panel-gradient" aria-labelledby="builds-heading">
            <div className="flex justify-between items-center mb-4">
              <h2 id="builds-heading" className="text-2xl font-bold text-ui-text-main">Активные билды</h2>
              <Link href="/builds" className="text-system-focus hover:text-system-focus/80 hover:underline">
                Все билды →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBuilds.map((build: any) => (
                <div
                  key={build.build_id}
                  className="border-l-4 p-4 rounded bg-bg-secondary border-ui-border-soft"
                  style={{ borderLeftColor: build.color || '#3A6F8F' }}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{build.icon}</span>
                    <h3 className="font-semibold text-ui-text-main">{build.name}</h3>
                  </div>
                  <p className="text-sm text-ui-text-muted mb-2">{build.fantasy}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-ui-text-muted">Активация: {build.activation_percentage}%</span>
                    <div className="w-24 bg-bg-secondary rounded-full h-1.5 border border-ui-border-soft">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${build.activation_percentage}%`,
                          backgroundColor: build.color || '#3A6F8F',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Активные квесты */}
        {activeQuests.length > 0 && (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-8 bg-panel-gradient" aria-labelledby="quests-heading">
            <div className="flex justify-between items-center mb-4">
              <h2 id="quests-heading" className="text-2xl font-bold text-ui-text-main">Активные квесты</h2>
              <Link href="/quests" className="text-system-focus hover:text-system-focus/80 hover:underline">
                Все квесты →
              </Link>
            </div>
            <div className="space-y-4">
              {activeQuests.map((quest: any) => (
                <Link
                  key={quest.id}
                  href={`/quests/${quest.id}`}
                  className="block border-l-4 border-system-focus pl-4 py-2 bg-bg-secondary rounded hover:bg-bg-panel transition-colors"
                >
                  <h3 className="font-semibold text-ui-text-main">{quest.title}</h3>
                  <p className="text-sm text-ui-text-muted">{quest.description}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="text-xs bg-bg-panel border border-system-focus/30 text-system-focus px-2 py-1 rounded">
                      {quest.type === 'micro' ? 'Микро' : 
                       quest.type === 'weekly' ? 'Еженедельный' : 
                       quest.type === 'story' ? 'История' : 
                       quest.type === 'in-person' ? 'Очный' : quest.type}
                    </span>
                    {quest.linked_nodes?.length > 0 && (
                      <span className="text-xs bg-bg-panel border border-system-stable/30 text-system-stable px-2 py-1 rounded">
                        {quest.linked_nodes.length} способностей
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Последние анализы */}
        <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-8 bg-panel-gradient" aria-labelledby="sessions-heading">
          <div className="flex justify-between items-center mb-4">
            <h2 id="sessions-heading" className="text-2xl font-bold text-ui-text-main">Последние анализы</h2>
            <Link href="/sessions" className="text-system-focus hover:text-system-focus/80 hover:underline">
              Все анализы →
            </Link>
          </div>
          {sessions.length === 0 ? (
            <p className="text-ui-text-muted">Нет проанализированных ситуаций</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="block border-l-4 border-system-growth pl-4 py-2 hover:bg-bg-secondary rounded transition-colors"
                >
                  <h3 className="font-semibold text-ui-text-main">Анализ ситуации</h3>
                  <p className="text-sm text-ui-text-muted line-clamp-2">{session.summary}</p>
                  {session.themes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {session.themes.slice(0, 3).map((theme, i) => (
                        <span key={i} className="text-xs bg-bg-panel border border-system-growth/30 text-system-growth px-2 py-1 rounded">
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Быстрый вход в ситуацию */}
        <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient" aria-labelledby="quick-entry-heading">
          <h2 id="quick-entry-heading" className="text-xl font-bold mb-4 text-ui-text-main flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Быстрый вход в ситуацию
          </h2>
          <button
            onClick={() => setIsEntryModalOpen(true)}
            className="w-full p-6 border-2 border-dashed border-ui-border-soft rounded-lg hover:border-system-focus hover:bg-bg-secondary text-center transition-colors group"
          >
            <span className="text-4xl mb-3 block group-hover:scale-110 transition-transform">➕</span>
            <span className="font-semibold text-lg text-ui-text-main block mb-2">Добавить ситуацию</span>
            <span className="text-sm text-ui-text-muted">Опишите ситуацию, которую хотите проанализировать</span>
          </button>
        </section>

        {/* Модальное окно добавления ситуации */}
        <AddEntryModal isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)} />
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

