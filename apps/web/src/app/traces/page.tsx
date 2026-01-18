'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getEvidence, Evidence, getQuests, getSemanticTree, getCurrentBuild, getEntries, getSessions } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../components/LoadingSpinner';

type TracesView = 'map' | 'journal' | 'connections';

// Связки
function ConnectionsView({ evidences, quests, entries, sessions, activeBuilds, tree }: any) {
  const router = useRouter();
  
  // Функция перевода названий узлов
  const translateNodeName = (name: string): string => {
    if (name === 'REDE Model') return 'REDE Модель';
    if (name.includes('REDE Model')) return name.replace('REDE Model', 'REDE Модель');
    if (name === 'Deliberately Developmental Organization' || name === 'DDO') {
      return 'Организация как тренажёр';
    }
    if (name.includes('Deliberately Developmental Organization')) {
      return name.replace('Deliberately Developmental Organization', 'Организация как тренажёр');
    }
    if (name === 'Vertical Development') return 'Вертикальное развитие';
    if (name.includes('Vertical Development')) return name.replace('Vertical Development', 'Вертикальное развитие');
    if (name === 'Shared Leadership') return 'Распределённое лидерство';
    if (name.includes('Shared Leadership')) return name.replace('Shared Leadership', 'Распределённое лидерство');
    if (name === 'Feedforward') return 'Обратная связь в будущее';
    if (name.includes('Feedforward')) return name.replace('Feedforward', 'Обратная связь в будущее');
    if (name === 'Window Gazer vs Mirror Holder') return 'Смотрящий в окно vs Держащий зеркало';
    if (name.includes('Window Gazer vs Mirror Holder')) {
      return name.replace('Window Gazer vs Mirror Holder', 'Смотрящий в окно vs Держащий зеркало');
    }
    return name;
  };
  // Создаем карту сессий по entry_id
  const sessionsByEntryId = new Map(
    sessions.map((session: any) => [session.entry_id, session]),
  );
  return (
    <div className="space-y-8">
      {/* Связки с квестами */}
      <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
        <h2 className="text-xl font-bold mb-4 text-ui-text-main">Связки с квестами</h2>
        {evidences.filter((e: Evidence) => e.quest_id).length === 0 ? (
          <p className="text-ui-text-muted">Нет следов, связанных с квестами</p>
        ) : (
          <div className="space-y-4">
            {quests.map((quest: any) => {
              const questEvidences = evidences.filter((e: Evidence) => e.quest_id === quest.id);
              if (questEvidences.length === 0) return null;
              return (
                <Link
                  key={quest.id}
                  href={`/quests/${quest.id}`}
                  className="block bg-bg-secondary border border-ui-border-soft rounded-lg p-4 hover:border-system-focus transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-ui-text-main">{quest.title}</h3>
                      <p className="text-sm text-ui-text-muted mt-1">{quest.description}</p>
                    </div>
                    <span className="text-sm text-ui-text-muted">{questEvidences.length} следов</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Связки с узлами */}
      <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
        <h2 className="text-xl font-bold mb-4 text-ui-text-main">Связки с узлами</h2>
        {evidences.filter((e: Evidence) => e.ability_node_id).length === 0 ? (
          <p className="text-ui-text-muted">Нет следов, связанных с узлами</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(new Set(evidences.map((e: Evidence) => e.ability_node_id).filter(Boolean)))
              .filter((nodeId: string) => nodeId !== 'unknown')
              .map((nodeId: string) => {
                const nodeEvidences = evidences.filter((e: Evidence) => e.ability_node_id === nodeId);
                const node = tree?.nodes?.find((n: any) => n.node_id === nodeId);
                const branch = node?.branch_id 
                  ? tree?.branches?.find((b: any) => b.branch_id === node.branch_id)
                  : null;
                
                const handleClick = (e: React.MouseEvent) => {
                  e.preventDefault();
                  const params = new URLSearchParams();
                  params.set('tab', 'tree');
                  if (branch?.branch_id) {
                    params.set('branch', branch.branch_id);
                  }
                  params.set('node', nodeId);
                  router.push(`/architecture?${params.toString()}`);
                };
                
                return (
                  <button
                    key={nodeId}
                    onClick={handleClick}
                    className="bg-bg-secondary border border-ui-border-soft rounded-lg p-4 hover:border-system-focus transition-colors text-left w-full"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-ui-text-main">{translateNodeName(node?.name || nodeId)}</h3>
                      <span className="text-sm text-ui-text-muted">{nodeEvidences.length}</span>
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </section>

      {/* Связки с ситуациями */}
      <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
        <h2 className="text-xl font-bold mb-4 text-ui-text-main">Связки с ситуациями</h2>
        {evidences.filter((e: Evidence) => e.session_id).length === 0 ? (
          <p className="text-ui-text-muted">Нет следов, связанных с ситуациями</p>
        ) : (
          <div className="space-y-4">
            {entries.map((entry: any) => {
              const session = sessionsByEntryId.get(entry.id);
              if (!session) return null;
              const entryEvidences = evidences.filter((e: Evidence) => e.session_id === session.id);
              if (entryEvidences.length === 0) return null;
              return (
                <Link
                  key={entry.id}
                  href={`/entries/${entry.id}`}
                  className="block bg-bg-secondary border border-ui-border-soft rounded-lg p-4 hover:border-system-focus transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-ui-text-main">Ситуация</h3>
                    <span className="text-sm text-ui-text-muted">{entryEvidences.length} следов</span>
                  </div>
                  <p className="text-sm text-ui-text-muted line-clamp-2">{entry.text}</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Связки с билдами */}
      <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
        <h2 className="text-xl font-bold mb-4 text-ui-text-main">Связки с билдами</h2>
        {activeBuilds.length === 0 ? (
          <p className="text-ui-text-muted">Нет активных билдов</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBuilds.map((build: any) => {
              // Находим следы, связанные с узлами билда
              const buildNodeIds = build.related_nodes || [];
              const buildEvidences = evidences.filter((e: Evidence) => 
                e.ability_node_id && buildNodeIds.includes(e.ability_node_id)
              );
              return (
                <Link
                  key={build.build_id}
                  href={`/builds`}
                  className="bg-bg-secondary border border-ui-border-soft rounded-lg p-4 hover:border-system-focus transition-colors border-l-4"
                  style={{ borderLeftColor: build.color || '#3A6F8F' }}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{build.icon}</span>
                    <h3 className="font-semibold text-ui-text-main">{build.name}</h3>
                  </div>
                  <p className="text-sm text-ui-text-muted">{buildEvidences.length} следов</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function TracesPage() {
  const [activeView, setActiveView] = useState<TracesView>('map');
  const [groupBy, setGroupBy] = useState<'ability' | 'time' | 'context'>('ability');

  const { data: evidenceData, isLoading: evidenceLoading } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => getEvidence(),
  });

  const { data: questsData } = useQuery({
    queryKey: ['quests'],
    queryFn: () => getQuests(),
  });

  const { data: tree } = useQuery({
    queryKey: ['tree', 'semantic'],
    queryFn: getSemanticTree,
  });

  const { data: entriesData } = useQuery({
    queryKey: ['entries'],
    queryFn: () => getEntries(),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => getSessions(),
  });

  const { data: currentBuilds } = useQuery({
    queryKey: ['builds', 'current'],
    queryFn: getCurrentBuild,
  });

  const isLoading = evidenceLoading;
  const evidences = evidenceData?.evidences || [];
  const quests = questsData?.quests || [];
  const entries = entriesData?.entries || [];
  const activeBuilds = Array.isArray(currentBuilds) ? currentBuilds.filter((b: any) => b.is_active) : [];

  // Группировка по способностям
  const byAbility = useMemo(() => {
    const grouped: Record<string, Evidence[]> = {};
    evidences.forEach((evidence) => {
      const nodeId = evidence.ability_node_id || 'unknown';
      if (!grouped[nodeId]) {
        grouped[nodeId] = [];
      }
      grouped[nodeId].push(evidence);
    });
    return grouped;
  }, [evidences]);

  // Группировка по времени (последние 30 дней, 7 дней, сегодня)
  const byTime = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    return {
      today: evidences.filter((e) => new Date(e.created_at) >= today),
      week: evidences.filter((e) => {
        const date = new Date(e.created_at);
        return date >= weekAgo && date < today;
      }),
      month: evidences.filter((e) => {
        const date = new Date(e.created_at);
        return date >= monthAgo && date < weekAgo;
      }),
      older: evidences.filter((e) => new Date(e.created_at) < monthAgo),
    };
  }, [evidences]);

  // Группировка по контекстам (теги)
  const byContext = useMemo(() => {
    const grouped: Record<string, Evidence[]> = {};
    evidences.forEach((evidence) => {
      const contexts = evidence.tags || ['без контекста'];
      contexts.forEach((tag) => {
        if (!grouped[tag]) {
          grouped[tag] = [];
        }
        grouped[tag].push(evidence);
      });
    });
    return grouped;
  }, [evidences]);

  // Где применял чаще всего (топ способностей по количеству evidence)
  const mostUsedAbilities = useMemo(() => {
    const counts: Record<string, number> = {};
    evidences.forEach((evidence) => {
      const nodeId = evidence.ability_node_id || 'unknown';
      counts[nodeId] = (counts[nodeId] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nodeId, count]) => ({
        nodeId,
        count,
        node: tree?.nodes?.find((n: any) => n.node_id === nodeId),
      }));
  }, [evidences, tree]);

  // Где нет evidence долго (способности без evidence за последние 30 дней)
  const missingEvidence = useMemo(() => {
    if (!tree?.nodes) return [];
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const nodesWithRecentEvidence = new Set(
      evidences
        .filter((e) => new Date(e.created_at) >= monthAgo && e.ability_node_id)
        .map((e) => e.ability_node_id)
    );

    return tree.nodes
      .filter((node: any) => 
        (node.state === 'active' || node.state === 'unlocked' || node.state === 'integrated') &&
        !nodesWithRecentEvidence.has(node.node_id)
      )
      .slice(0, 10);
  }, [evidences, tree]);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка следов..." />;
  }

  return (
    <main className="min-h-screen bg-bg-main p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-ui-text-main" id="page-title">
            Следы
          </h1>
          <p className="text-ui-text-muted mb-4">
            Всё, что реально происходило
          </p>
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-4 text-sm text-ui-text-muted">
            <p className="mb-2">
              <strong className="text-ui-text-main">Следы</strong> — это записи о реальных проявлениях ваших способностей: ситуации, наблюдения, рефлексии и обратная связь.
            </p>
            <p className="mb-2">
              <strong className="text-ui-text-main">По способностям</strong> — группировка следов по узлам развития (какие способности вы проявляли).
            </p>
            <p className="mb-2">
              <strong className="text-ui-text-main">По времени</strong> — группировка следов по периодам (сегодня, последние 7 дней, 30 дней, ранее).
            </p>
            <p>
              <strong className="text-ui-text-main">По контекстам</strong> — группировка следов по тегам и контекстам применения.
            </p>
          </div>
        </div>

        {/* Переключатель представлений */}
        <div className="mb-6 border-b border-ui-border-soft">
          <nav className="flex gap-4" aria-label="Представления следов">
            <button
              onClick={() => setActiveView('map')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeView === 'map'
                  ? 'border-system-focus text-system-focus'
                  : 'border-transparent text-ui-text-muted hover:text-ui-text-main'
              }`}
            >
              Карта проявлений
            </button>
            <button
              onClick={() => setActiveView('connections')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeView === 'connections'
                  ? 'border-system-focus text-system-focus'
                  : 'border-transparent text-ui-text-muted hover:text-ui-text-main'
              }`}
            >
              Связки
            </button>
            <button
              onClick={() => setActiveView('journal')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeView === 'journal'
                  ? 'border-system-focus text-system-focus'
                  : 'border-transparent text-ui-text-muted hover:text-ui-text-main'
              }`}
            >
              Личный журнал
            </button>
          </nav>
        </div>

        {/* Контент */}
        <div>
          {activeView === 'map' && (
            <MapView
              evidences={evidences}
              byAbility={byAbility}
              byTime={byTime}
              byContext={byContext}
              groupBy={groupBy}
              setGroupBy={setGroupBy}
              mostUsedAbilities={mostUsedAbilities}
              missingEvidence={missingEvidence}
              tree={tree ?? null}
            />
          )}
          {activeView === 'connections' && (
            <ConnectionsView
              evidences={evidences}
              quests={quests}
              entries={entries}
              sessions={sessionsData?.sessions || []}
              activeBuilds={activeBuilds}
              tree={tree ?? null}
            />
          )}
          {activeView === 'journal' && (
            <JournalView evidences={evidences} tree={tree ?? null} />
          )}
        </div>
      </div>
    </main>
  );
}

// Карта проявлений
function MapView({
  evidences,
  byAbility,
  byTime,
  byContext,
  groupBy,
  setGroupBy,
  mostUsedAbilities,
  missingEvidence,
  tree,
}: any) {
  const router = useRouter();
  
  // Функция перевода названий узлов
  const translateNodeName = (name: string): string => {
    // REDE Model -> REDE Модель
    if (name === 'REDE Model') return 'REDE Модель';
    if (name.includes('REDE Model')) return name.replace('REDE Model', 'REDE Модель');
    
    // Deliberately Developmental Organization -> Организация как тренажёр
    if (name === 'Deliberately Developmental Organization' || name === 'DDO') {
      return 'Организация как тренажёр';
    }
    if (name.includes('Deliberately Developmental Organization')) {
      return name.replace('Deliberately Developmental Organization', 'Организация как тренажёр');
    }
    
    // Vertical Development -> Вертикальное развитие
    if (name === 'Vertical Development') return 'Вертикальное развитие';
    if (name.includes('Vertical Development')) return name.replace('Vertical Development', 'Вертикальное развитие');
    
    // Shared Leadership -> Распределённое лидерство
    if (name === 'Shared Leadership') return 'Распределённое лидерство';
    if (name.includes('Shared Leadership')) return name.replace('Shared Leadership', 'Распределённое лидерство');
    
    // Feedforward -> Обратная связь в будущее
    if (name === 'Feedforward') return 'Обратная связь в будущее';
    if (name.includes('Feedforward')) return name.replace('Feedforward', 'Обратная связь в будущее');
    
    // Window Gazer vs Mirror Holder -> Смотрящий в окно vs Держащий зеркало
    if (name === 'Window Gazer vs Mirror Holder') return 'Смотрящий в окно vs Держащий зеркало';
    if (name.includes('Window Gazer vs Mirror Holder')) {
      return name.replace('Window Gazer vs Mirror Holder', 'Смотрящий в окно vs Держащий зеркало');
    }
    
    return name;
  };

  const getNodeName = (nodeId: string) => {
    if (nodeId === 'unknown') return 'Не указано';
    const node = tree?.nodes?.find((n: any) => n.node_id === nodeId);
    const nodeName = node?.name || nodeId;
    return translateNodeName(nodeName);
  };

  return (
    <div className="space-y-8">
      {/* Группировка */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setGroupBy('ability')}
          className={`px-4 py-2 rounded border transition-colors ${
            groupBy === 'ability'
              ? 'bg-bg-secondary border-system-focus text-system-focus'
              : 'bg-bg-panel border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong'
          }`}
        >
          По способностям
        </button>
        <button
          onClick={() => setGroupBy('time')}
          className={`px-4 py-2 rounded border transition-colors ${
            groupBy === 'time'
              ? 'bg-bg-secondary border-system-focus text-system-focus'
              : 'bg-bg-panel border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong'
          }`}
        >
          По времени
        </button>
        <button
          onClick={() => setGroupBy('context')}
          className={`px-4 py-2 rounded border transition-colors ${
            groupBy === 'context'
              ? 'bg-bg-secondary border-system-focus text-system-focus'
              : 'bg-bg-panel border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong'
          }`}
        >
          По контекстам
        </button>
      </div>

      {/* Где применял чаще всего */}
      <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
        <h2 className="text-xl font-bold mb-2 text-ui-text-main">Где я применял способности чаще всего</h2>
        <p className="text-sm text-ui-text-muted mb-4">Топ-5 способностей по количеству зафиксированных проявлений</p>
        {mostUsedAbilities.length === 0 ? (
          <p className="text-ui-text-muted">Недостаточно данных</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mostUsedAbilities
              .filter(({ nodeId }: any) => nodeId !== 'unknown') // Фильтруем "unknown"
              .map(({ nodeId, count, node }: any) => {
                // Находим ветку узла
                const branch = node?.branch_id 
                  ? tree?.branches?.find((b: any) => b.branch_id === node.branch_id)
                  : null;
                
                const handleClick = (e: React.MouseEvent) => {
                  e.preventDefault();
                  const params = new URLSearchParams();
                  params.set('tab', 'tree');
                  if (branch?.branch_id) {
                    params.set('branch', branch.branch_id);
                  }
                  params.set('node', nodeId);
                  router.push(`/architecture?${params.toString()}`);
                };
                
                return (
                  <button
                    key={nodeId}
                    onClick={handleClick}
                    className="bg-bg-secondary border border-ui-border-soft rounded-lg p-4 hover:border-system-focus transition-colors text-left w-full"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-ui-text-main">{getNodeName(nodeId)}</h3>
                      <span className="text-sm text-system-focus font-bold">{count}</span>
                    </div>
                    <p className="text-xs text-ui-text-muted">{count} проявлений</p>
                  </button>
                );
              })}
          </div>
        )}
      </section>

      {/* Где нет evidence долго */}
      <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
        <h2 className="text-xl font-bold mb-4 text-ui-text-main">Где нет следов долго</h2>
        <p className="text-sm text-ui-text-muted mb-4">Активные способности без проявлений за последние 30 дней</p>
        {missingEvidence.length === 0 ? (
          <p className="text-ui-text-muted">Все активные способности имеют недавние следы</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {missingEvidence.map((node: any) => {
              // Находим ветку узла
              const branch = tree?.branches?.find((b: any) => b.branch_id === node.branch_id);
              
              const handleClick = (e: React.MouseEvent) => {
                e.preventDefault();
                // Переходим на страницу архитектуры с предвыбором ветки и узла
                const params = new URLSearchParams();
                if (branch?.branch_id) {
                  params.set('branch', branch.branch_id);
                }
                params.set('node', node.node_id);
                router.push(`/architecture?tab=tree&${params.toString()}`);
              };
              
              return (
                <button
                  key={node.node_id}
                  onClick={handleClick}
                  className="bg-bg-secondary border border-system-warning/30 rounded-lg p-4 hover:border-system-warning transition-colors text-left w-full"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-ui-text-main">{translateNodeName(node.name || node.node_id)}</h3>
                    <span className="text-xs text-system-warning">⚠️</span>
                  </div>
                  <p className="text-xs text-ui-text-muted">Нет следов за последние 30 дней</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Карта проявлений по выбранной группировке */}
      <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
        <h2 className="text-xl font-bold mb-4 text-ui-text-main">
          {groupBy === 'ability' ? 'По способностям' : 
           groupBy === 'time' ? 'По времени' : 
           'По контекстам'}
        </h2>
        
        {groupBy === 'ability' && (
          <div className="space-y-4">
            {Object.entries(byAbility)
              .filter(([nodeId]) => nodeId !== 'unknown') // Фильтруем "unknown"
              .map(([nodeId, evidenceList]: [string, any]) => {
                const node = tree?.nodes?.find((n: any) => n.node_id === nodeId);
                const branch = node?.branch_id 
                  ? tree?.branches?.find((b: any) => b.branch_id === node.branch_id)
                  : null;
                
                const handleClick = (e: React.MouseEvent) => {
                  e.preventDefault();
                  const params = new URLSearchParams();
                  params.set('tab', 'tree');
                  if (branch?.branch_id) {
                    params.set('branch', branch.branch_id);
                  }
                  params.set('node', nodeId);
                  router.push(`/architecture?${params.toString()}`);
                };
                
                return (
                  <div key={nodeId} className="bg-bg-secondary border border-ui-border-soft rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <button
                        onClick={handleClick}
                        className="font-semibold text-ui-text-main hover:text-system-focus text-left"
                      >
                        {getNodeName(nodeId)}
                      </button>
                      <span className="text-sm text-ui-text-muted">{evidenceList.length} следов</span>
                    </div>
                    <div className="space-y-2 mt-3">
                      {evidenceList.slice(0, 3).map((evidence: Evidence) => (
                        <div key={evidence.id} className="text-sm text-ui-text-muted border-l-2 border-ui-border-soft pl-3">
                          {evidence.text}
                        </div>
                      ))}
                      {evidenceList.length > 3 && (
                        <p className="text-xs text-ui-text-muted">+{evidenceList.length - 3} ещё</p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {groupBy === 'time' && (
          <div className="space-y-4">
            {byTime.today.length > 0 && (
              <TimeGroup title="Сегодня" evidences={byTime.today} />
            )}
            {byTime.week.length > 0 && (
              <TimeGroup title="Последние 7 дней" evidences={byTime.week} />
            )}
            {byTime.month.length > 0 && (
              <TimeGroup title="Последние 30 дней" evidences={byTime.month} />
            )}
            {byTime.older.length > 0 && (
              <TimeGroup title="Ранее" evidences={byTime.older} />
            )}
          </div>
        )}

        {groupBy === 'context' && (
          <div className="space-y-4">
            {Object.entries(byContext).map(([context, evidenceList]: [string, any]) => (
              <div key={context} className="bg-bg-secondary border border-ui-border-soft rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-ui-text-main">{context}</h3>
                  <span className="text-sm text-ui-text-muted">{evidenceList.length} следов</span>
                </div>
                <div className="space-y-2 mt-3">
                  {evidenceList.slice(0, 3).map((evidence: Evidence) => (
                    <div key={evidence.id} className="text-sm text-ui-text-muted border-l-2 border-ui-border-soft pl-3">
                      {evidence.text}
                    </div>
                  ))}
                  {evidenceList.length > 3 && (
                    <p className="text-xs text-ui-text-muted">+{evidenceList.length - 3} ещё</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TimeGroup({ title, evidences }: { title: string; evidences: Evidence[] }) {
  return (
    <div className="bg-bg-secondary border border-ui-border-soft rounded-lg p-4">
      <h3 className="font-semibold text-ui-text-main mb-2">{title} ({evidences.length})</h3>
      <div className="space-y-2 mt-3">
        {evidences.slice(0, 5).map((evidence) => (
          <div key={evidence.id} className="text-sm text-ui-text-muted border-l-2 border-ui-border-soft pl-3">
            {evidence.text}
          </div>
        ))}
        {evidences.length > 5 && (
          <p className="text-xs text-ui-text-muted">+{evidences.length - 5} ещё</p>
        )}
      </div>
    </div>
  );
}

// Личный журнал
function JournalView({ evidences }: { evidences: Evidence[] }) {
  if (evidences.length === 0) {
    return (
      <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
        <p className="text-ui-text-muted">Журнал пуст</p>
      </div>
    );
  }

  // Сортируем по дате (новые сначала)
  const sortedEvidences = [...evidences].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedEvidences.map((evidence) => (
        <div key={evidence.id} className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs bg-bg-secondary border border-system-focus/30 text-system-focus px-2 py-1 rounded">
              {evidence.type === 'situation' ? 'Ситуация' : 
               evidence.type === 'observation' ? 'Наблюдение' : 
               evidence.type === 'reflection' ? 'Рефлексия' : 
               evidence.type === 'feedback' ? 'Обратная связь' : evidence.type}
            </span>
            <span className="text-xs text-ui-text-dim">
              {new Date(evidence.created_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <p className="text-ui-text-main mb-3">{evidence.text}</p>
          <div className="flex gap-2 flex-wrap">
            {evidence.quest_id && (
              <Link
                href={`/quests/${evidence.quest_id}`}
                className="text-xs text-system-focus hover:underline"
              >
                Квест →
              </Link>
            )}
            {evidence.ability_node_id && evidence.ability_node_id !== 'unknown' && (
              <button
                onClick={() => {
                  const node = tree?.nodes?.find((n: any) => n.node_id === evidence.ability_node_id);
                  const branch = node?.branch_id 
                    ? tree?.branches?.find((b: any) => b.branch_id === node.branch_id)
                    : null;
                  const params = new URLSearchParams();
                  params.set('tab', 'tree');
                  if (branch?.branch_id) {
                    params.set('branch', branch.branch_id);
                  }
                  params.set('node', evidence.ability_node_id);
                  router.push(`/architecture?${params.toString()}`);
                }}
                className="text-xs text-system-focus hover:underline"
              >
                Узел →
              </button>
            )}
            {evidence.session_id && (
              <Link
                href={`/sessions/${evidence.session_id}`}
                className="text-xs text-system-focus hover:underline"
              >
                Ситуация →
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

