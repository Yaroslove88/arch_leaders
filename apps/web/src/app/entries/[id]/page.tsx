'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEntry, analyzeEntry, getSessions, getQuests, getSemanticTree } from '@/lib/api';
import { Entry, Session } from '@/lib/api';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { useQuery } from '@tanstack/react-query';

export default function EntryPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const entryId = params.id as string;
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Получаем связанную сессию
  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', 'by-entry', entryId],
    queryFn: () => getSessions(),
    enabled: !!entryId,
  });

  // Получаем квесты для поиска связанных
  const { data: questsData } = useQuery({
    queryKey: ['quests'],
    queryFn: () => getQuests(),
    enabled: !!entryId,
  });

  // Получаем дерево для мини-карты
  const { data: tree } = useQuery({
    queryKey: ['tree', 'semantic'],
    queryFn: getSemanticTree,
    enabled: !!entryId,
  });

  const session = useMemo(() => {
    if (!sessionsData?.sessions) return null;
    return sessionsData.sessions.find((s: Session) => s.entry_id === entryId) || null;
  }, [sessionsData, entryId]);

  // Находим связанные квесты (по узлам из сессии)
  const relatedQuests = useMemo(() => {
    if (!session || !questsData?.quests) return [];
    const affectedNodeIds = session.ability_signals_json?.map((signal: any) => signal.node_id).filter(Boolean) || [];
    return questsData.quests.filter((quest: any) => 
      quest.linked_nodes?.some((nodeId: string) => affectedNodeIds.includes(nodeId))
    );
  }, [session, questsData]);

  // Находим затронутые узлы и ветки
  // Пробуем несколько способов извлечения node_id из ability_signals_json
  const affectedNodes = useMemo(() => {
    if (!session || !tree?.nodes) return [];
    
    // Собираем все возможные node_id из разных полей
    const nodeIds: string[] = [];
    
    // Способ 1: прямое поле node_id
    if (session.ability_signals_json) {
      session.ability_signals_json.forEach((signal: any) => {
        if (signal.node_id) nodeIds.push(signal.node_id);
        if (signal.nodeId) nodeIds.push(signal.nodeId);
        if (signal.ability_node_id) nodeIds.push(signal.ability_node_id);
      });
    }
    
    // Способ 2: из focus_json
    if (session.focus_json) {
      session.focus_json.forEach((focus: any) => {
        if (focus.node_id) nodeIds.push(focus.node_id);
        if (focus.nodeId) nodeIds.push(focus.nodeId);
        if (focus.ability_node_id) nodeIds.push(focus.ability_node_id);
      });
    }
    
    // Убираем дубликаты
    const uniqueNodeIds = [...new Set(nodeIds)];
    
    if (uniqueNodeIds.length === 0) return [];
    
    return tree.nodes.filter((node: any) => uniqueNodeIds.includes(node.node_id));
  }, [session, tree]);

  const affectedBranches = useMemo(() => {
    if (!affectedNodes.length || !tree?.branches) return [];
    const branchIds = new Set(affectedNodes.map((node: any) => node.branch_id).filter(Boolean));
    return tree.branches.filter((branch: any) => branchIds.has(branch.branch_id));
  }, [affectedNodes, tree]);

  useEffect(() => {
    loadEntry();
  }, [entryId]);

  async function loadEntry() {
    setLoading(true);
    try {
      const data = await getEntry(entryId);
      setEntry(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!entry) return;
    setAnalyzing(true);
    try {
      await analyzeEntry(entry.id);
      // Перенаправляем на страницу анализов
      router.push(`/sessions?entry=${entry.id}`);
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

  if (!entry) {
    return (
      <main className="min-h-screen bg-bg-main p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-system-critical">Запись не найдена</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-main p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/entries" className="text-system-focus hover:text-system-focus/80 mb-4 inline-block transition-colors">
            ← Назад к ситуациям
          </Link>
          <h1 className="text-3xl font-bold mb-4 text-ui-text-main">Разбор ситуации</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="px-3 py-1 bg-bg-secondary border border-ui-border-soft text-ui-text-main rounded text-sm">
              {entry.type === 'situation' ? 'Ситуация' : 
               entry.type === 'reflection' ? 'Рефлексия' : 
               entry.type === 'feedback' ? 'Обратная связь' : entry.type}
            </span>
            {session ? (
              <Link
                href={`/sessions/${session.id}`}
                className="px-3 py-1 bg-bg-secondary border border-system-growth text-system-growth rounded text-sm hover:bg-bg-hover hover:border-system-growth/80 transition-colors"
              >
                ✓ Проанализировано
              </Link>
            ) : (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-4 py-2 bg-system-focus text-ui-text-main rounded hover:bg-system-focus/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-system-focus focus:ring-offset-2 focus:ring-offset-bg-main"
              >
                {analyzing ? 'Анализ...' : 'Проанализировать'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основной контент */}
          <div className="lg:col-span-2 space-y-6">
            {/* Текст ситуации */}
            <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6">
              <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Описание ситуации</h2>
              <p className="text-ui-text-main whitespace-pre-wrap">{entry.text}</p>
            </section>

            {/* Результаты анализа */}
            {session && (
              <>
                {/* Сводка */}
                {session.summary && (
                  <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6">
                    <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Сводка анализа</h2>
                    <p className="text-ui-text-main whitespace-pre-wrap">{session.summary}</p>
                  </section>
                )}

                {/* Паттерны */}
                {session.patterns && session.patterns.length > 0 && (
                  <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6">
                    <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Паттерны</h2>
                    <ul className="space-y-2">
                      {session.patterns.map((pattern, i) => (
                        <li key={i} className="flex items-start gap-2 text-ui-text-main">
                          <span className="text-system-focus mt-1">•</span>
                          <span>{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Что это изменило */}
                {session.insights_json && session.insights_json.length > 0 && (
                  <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6">
                    <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Что это изменило</h2>
                    <div className="space-y-3">
                      {session.insights_json.map((insight: any, i: number) => (
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

                {/* Связанные квесты */}
                {relatedQuests.length > 0 && (
                  <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6">
                    <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Родившиеся квесты</h2>
                    <div className="space-y-3">
                      {relatedQuests.map((quest: any) => (
                        <Link
                          key={quest.id}
                          href={`/quests/${quest.id}`}
                          className="block border-l-4 border-system-focus pl-4 py-3 bg-bg-secondary rounded hover:bg-bg-panel transition-colors"
                        >
                          <h3 className="font-semibold text-ui-text-main mb-1">{quest.title}</h3>
                          <p className="text-sm text-ui-text-muted line-clamp-2">{quest.description}</p>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Мини-карта архитектуры */}
            {session && (
              <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Затронутая архитектура</h2>
                
                {affectedNodes.length === 0 && affectedBranches.length === 0 ? (
                  <div className="text-sm text-ui-text-muted">
                    <p>Архитектурные связи будут отображены после анализа ситуации.</p>
                    {session.ability_signals_json && session.ability_signals_json.length > 0 && (
                      <p className="mt-2 text-xs">
                        Обнаружено {session.ability_signals_json.length} сигналов способностей, но связи с узлами не установлены.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                
                {/* Затронутые ветки */}
                {affectedBranches.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-ui-text-muted mb-2">Ветки:</h3>
                    <div className="space-y-2">
                      {affectedBranches.map((branch: any) => (
                        <Link
                          key={branch.branch_id}
                          href={`/tree?branch=${branch.branch_id}`}
                          className="block px-3 py-2 bg-bg-secondary border border-system-focus/30 rounded hover:border-system-focus transition-colors text-sm text-ui-text-main"
                        >
                          {branch.name || branch.branch_id}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Затронутые узлы */}
                {affectedNodes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-ui-text-muted mb-2">Узлы ({affectedNodes.length}):</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {affectedNodes.map((node: any) => (
                        <Link
                          key={node.node_id}
                          href={`/tree?node=${node.node_id}`}
                          className="block px-3 py-2 bg-bg-secondary border border-system-stable/30 rounded hover:border-system-stable transition-colors text-sm text-ui-text-main"
                        >
                          <div className="font-medium">{node.name || node.node_id}</div>
                          <div className="text-xs text-ui-text-muted mt-1">
                            {node.state === 'integrated' ? 'Интегрировано' :
                             node.state === 'unlocked' ? 'Разблокировано' :
                             node.state === 'available' ? 'Доступно' : node.state}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                  </>
                )}
              </section>
            )}

            {/* Метаданные */}
            <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6">
              <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Информация</h2>
              <div className="space-y-3 text-sm">
                {entry.participants && entry.participants.length > 0 && (
                  <div>
                    <span className="font-medium text-ui-text-main">Участники:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {entry.participants.map((participant, i) => (
                        <span key={i} className="px-2 py-1 bg-bg-secondary border border-system-focus/30 text-system-focus rounded text-xs">
                          {participant}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {entry.tags && entry.tags.length > 0 && (
                  <div>
                    <span className="font-medium text-ui-text-main">Теги:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {entry.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-bg-secondary border border-ui-border-soft text-ui-text-main rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-3 border-t border-ui-border-soft space-y-1 text-ui-text-muted">
                  <div>
                    <span className="font-semibold text-ui-text-main">Создано:</span>{' '}
                    {new Date(entry.created_at).toLocaleString('ru-RU')}
                  </div>
                  <div>
                    <span className="font-semibold text-ui-text-main">Обновлено:</span>{' '}
                    {new Date(entry.updated_at).toLocaleString('ru-RU')}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
