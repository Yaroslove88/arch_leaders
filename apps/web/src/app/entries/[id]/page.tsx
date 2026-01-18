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

  // Находим квесты, рождённые из этой сессии
  const bornQuests = useMemo(() => {
    if (!session || !questsData?.quests) return [];
    // Только квесты, которые созданы из этой сессии
    return questsData.quests.filter((quest: any) => 
      quest.session_id === session.id
    );
  }, [session, questsData]);
  
  // Рекомендуемые квесты (по узлам из сессии, но не рождённые здесь и не завершённые)
  const recommendedQuests = useMemo(() => {
    if (!session || !questsData?.quests) return [];
    const affectedNodeIds = session.ability_signals_json?.map((signal: any) => signal.node_id).filter(Boolean) || [];
    const bornQuestIds = bornQuests.map(q => q.id);
    return questsData.quests.filter((quest: any) => 
      !bornQuestIds.includes(quest.id) &&
      quest.status !== 'done' && // Исключаем завершённые
      quest.linked_nodes?.some((nodeId: string) => affectedNodeIds.includes(nodeId))
    ).slice(0, 3);
  }, [session, questsData, bornQuests]);

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
      <main className="min-h-screen bg-obsidian-core p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-ui-text-muted">Загрузка...</div>
        </div>
      </main>
    );
  }

  if (!entry) {
    return (
      <main className="min-h-screen bg-obsidian-core p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-tension-red">Запись не найдена</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-obsidian-core p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Навигация */}
        <Link href="/traces" className="text-sm text-strategic-blue hover:underline mb-4 inline-block">
          ← К журналу
        </Link>

        {/* Заголовок */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">📝</span>
            <h1 className="text-xl font-bold text-ash-light">Ситуация</h1>
            <span className="text-sm text-ui-text-muted">
              {new Date(entry.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <span className="text-xs px-2 py-1 bg-sage-green/20 text-sage-green rounded">
                ✓ Проанализировано
              </span>
            ) : (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-4 py-2 bg-strategic-blue text-white rounded-lg text-sm font-medium hover:bg-strategic-blue/90 disabled:opacity-50 transition-colors"
              >
                {analyzing ? 'Анализ...' : 'Проанализировать'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основной контент */}
          <div className="lg:col-span-2 space-y-4">
            {/* Текст ситуации */}
            <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-5">
              <div className="bg-obsidian-core rounded-lg p-4 border-l-4 border-strategic-blue">
                <p className="text-ash-light leading-relaxed whitespace-pre-wrap">
                  "{entry.text}"
                </p>
              </div>
            </section>

            {/* Результаты анализа */}
            {session && (
              <>
                {/* Что увидела система */}
                <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🔍</span>
                    <h2 className="text-base font-semibold text-ash-light">Что увидела система</h2>
                  </div>
                  
                  {/* Паттерны */}
                  {session.patterns && session.patterns.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-ui-text-muted mb-2">Паттерны:</p>
                      <div className="space-y-2">
                        {session.patterns.slice(0, 3).map((pattern, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-ash-light">
                            <span className="text-strategic-blue">•</span>
                            <span>{pattern}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Сводка как инсайт */}
                  {session.summary && (
                    <div className="bg-obsidian-core border-l-4 border-sage-green rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-2">
                        <span>💡</span>
                        <div>
                          <p className="text-xs text-ui-text-muted mb-1">Инсайт</p>
                          <p className="text-sm text-ash-light font-medium">{session.summary}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Что это изменило */}
                {session.insights_json && session.insights_json.length > 0 && (
                  <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">✨</span>
                      <h2 className="text-base font-semibold text-ash-light">Что это изменило</h2>
                    </div>
                    <div className="space-y-3">
                      {session.insights_json.map((insight: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-obsidian-core rounded-lg">
                          <span className="w-2 h-2 rounded-full bg-sage-green mt-1.5 flex-shrink-0" />
                          <div>
                            {insight.title && (
                              <p className="text-sm font-medium text-ash-light mb-0.5">{insight.title}</p>
                            )}
                            <p className="text-sm text-ui-text-muted">{insight.description || insight.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Родившиеся квесты - только те, что созданы из этой сессии */}
                {bornQuests.length > 0 && (
                  <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">⚔️</span>
                      <h2 className="text-base font-semibold text-ash-light">Родившиеся квесты</h2>
                    </div>
                    <div className="space-y-2">
                      {bornQuests.map((quest: any) => (
                        <Link
                          key={quest.id}
                          href={`/quests/${quest.id}`}
                          className="block p-3 bg-obsidian-core rounded-lg hover:bg-obsidian-core transition-colors border-l-2 border-strategic-blue"
                        >
                          <h3 className="text-sm font-medium text-ash-light mb-1">{quest.title}</h3>
                          <p className="text-xs text-ui-text-muted line-clamp-1">{quest.description}</p>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
                
                {/* Рекомендуемые квесты - связанные по узлам */}
                {bornQuests.length === 0 && recommendedQuests.length > 0 && (
                  <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">💡</span>
                      <h2 className="text-base font-semibold text-ash-light">Рекомендуемые квесты</h2>
                    </div>
                    <p className="text-xs text-ui-text-muted mb-3">По затронутым способностям</p>
                    <div className="space-y-2">
                      {recommendedQuests.map((quest: any) => (
                        <Link
                          key={quest.id}
                          href={`/quests/${quest.id}`}
                          className="block p-3 bg-obsidian-core rounded-lg hover:bg-obsidian-core transition-colors"
                        >
                          <h3 className="text-sm font-medium text-ash-light mb-1">{quest.title}</h3>
                          <p className="text-xs text-ui-text-muted line-clamp-1">{quest.description}</p>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          {/* Боковая панель - Архитектура */}
          <div className="space-y-4">
            {/* Затронутая архитектура */}
            <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-5 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🌳</span>
                <h2 className="text-base font-semibold text-ash-light">Архитектура</h2>
              </div>
              
              {!session ? (
                <p className="text-sm text-ui-text-muted">
                  Архитектурные связи появятся после анализа
                </p>
              ) : affectedNodes.length === 0 && affectedBranches.length === 0 ? (
                <p className="text-sm text-ui-text-muted">
                  Связи с узлами не установлены
                </p>
              ) : (
                <>
                  {/* Ветки */}
                  {affectedBranches.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-ash-light opacity-50 mb-2">Затронутые ветки</p>
                      <div className="space-y-1">
                        {affectedBranches.map((branch: any) => (
                          <Link
                            key={branch.branch_id}
                            href={`/architecture?branch=${branch.branch_id}`}
                            className="flex items-center gap-2 px-3 py-2 bg-obsidian-core rounded-lg text-sm text-ash-light hover:bg-obsidian-core transition-colors"
                          >
                            <span className="text-strategic-blue">├─</span>
                            {branch.name || branch.branch_id}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Узлы */}
                  {affectedNodes.length > 0 && (
                    <div>
                      <p className="text-xs text-ash-light opacity-50 mb-2">Затронутые узлы</p>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {affectedNodes.map((node: any) => (
                          <Link
                            key={node.node_id}
                            href={`/architecture?node=${node.node_id}`}
                            className="flex items-center gap-2 px-3 py-2 bg-obsidian-core rounded-lg text-sm hover:bg-obsidian-core transition-colors"
                          >
                            <span className="text-sage-green">└─</span>
                            <span className="text-ash-light">{node.name || node.node_id}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Рекомендация - показывается всегда, если есть квесты, независимо от наличия узлов/веток */}
              {session && (bornQuests.length > 0 || recommendedQuests.length > 0) && (
                <div className="mt-4 pt-4 border-t border-ui-border-soft">
                  <p className="text-xs text-ash-light opacity-50 mb-2">🎯 Рекомендация</p>
                  <Link
                    href={`/quests/${(bornQuests[0] || recommendedQuests[0]).id}`}
                    className="block p-2 bg-strategic-blue/10 border border-strategic-blue/30 rounded-lg text-sm text-strategic-blue hover:bg-strategic-blue/20 transition-colors"
                  >
                    {(bornQuests[0] || recommendedQuests[0]).title} →
                  </Link>
                </div>
              )}
            </section>

            {/* Метаданные (компактно) */}
            {(entry.participants?.length || entry.tags?.length) && (
              <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-5">
                <p className="text-xs text-ash-light opacity-50 mb-3">Метаданные</p>
                <div className="space-y-2">
                  {entry.participants && entry.participants.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.participants.map((participant, i) => (
                        <span key={i} className="px-2 py-0.5 bg-obsidian-core text-xs text-ui-text-muted rounded">
                          @{participant}
                        </span>
                      ))}
                    </div>
                  )}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-obsidian-core text-xs text-ui-text-muted rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
