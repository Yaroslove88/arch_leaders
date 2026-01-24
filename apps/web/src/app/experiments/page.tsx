'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuests } from '../../hooks/useQuests';
import { getCases, InteractiveCase, activateQuest, getSemanticTree, SemanticTree, getCaseProgress, CaseProgress, getQuests, Quest } from '../../lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNodeDescriptions } from '../../lib/api';
import { getNodeName } from '../../lib/node-translations';
import { getNodeLevel as getNodeLevelUtil, getQuestComplexity as getQuestComplexityUtil, sortQuestsByComplexity } from '../../lib/quest-utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/ToastProvider';
import CaseLockedModal from '../../components/CaseLockedModal';
import { CaseCard as NewCaseCard, QuestCard as NewQuestCard, type CaseDifficulty, type QuestType, type QuestStatus } from '@/components/cards';
import { PillTabs } from '@leadership-architect/ui';

type ExperimentTab = 'active' | 'base-quests' | 'cases' | 'completed';

// Маппинг nodeId на русские названия с переводами

// Сохранение позиции скролла
const SCROLL_KEY = 'experiments_scroll_position';

function ExperimentsPageInner() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ExperimentTab>('active');
  const [baseQuestTypeFilter, setBaseQuestTypeFilter] = useState<'all' | 'micro' | 'weekly' | 'story'>('all');
  const [baseQuestLabelFilter, setBaseQuestLabelFilter] = useState<string>('all');
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: questsData, isLoading: questsLoading, error: questsError, isFetching: questsFetching } = useQuests();
  
  // Восстанавливаем позицию скролла после загрузки
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(SCROLL_KEY);
    if (savedPosition) {
      // Небольшая задержка чтобы контент успел отрисоваться
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition, 10));
        sessionStorage.removeItem(SCROLL_KEY);
      }, 100);
    }
  }, []);
  
  // Сохраняем позицию скролла перед переходом
  const saveScrollPosition = () => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
  };

  // Читаем вкладку из URL параметров при загрузке
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['active', 'base-quests', 'cases', 'completed'].includes(tabParam)) {
      setActiveTab(tabParam as ExperimentTab);
    } else {
      // Или из localStorage
      const savedTab = typeof window !== 'undefined' ? localStorage.getItem('experiments_active_tab') : null;
      if (savedTab && ['active', 'base-quests', 'cases', 'completed'].includes(savedTab)) {
        setActiveTab(savedTab as ExperimentTab);
      }
    }
  }, [searchParams]);

  // Сохраняем активную вкладку в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('experiments_active_tab', activeTab);
    }
  }, [activeTab]);
  const { data: tree, isLoading: treeLoading } = useQuery({
    queryKey: ['tree', 'semantic'],
    queryFn: getSemanticTree,
  });

  const { data: casesData, isLoading: casesLoading, error: casesError } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
    retry: 2,
    retryDelay: 1000,
  });
  const { data: nodeDescriptionsData, error: nodeDescriptionsError } = useQuery({
    queryKey: ['nodeDescriptions'],
    queryFn: getNodeDescriptions,
    retry: 2,
    retryDelay: 1000,
  });
  
  // Log errors if present
  if (casesError) console.error('Failed to load cases:', casesError);
  if (nodeDescriptionsError) console.error('Failed to load node descriptions:', nodeDescriptionsError);

  // Проверяем, есть ли токен авторизации для квестов
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const isQuestsDisabled = !token;

  const isLoading = questsLoading || casesLoading;
  const quests = questsData?.quests || [];
  const cases = casesData?.cases || [];
  const nodeDescriptions = nodeDescriptionsData?.descriptions || {};

  // УДАЛЕНО: Живые квесты (in-person) - это ЛИЧНОЕ, не показываем

  // Базовые квесты - все квесты (кроме in-person - это ЛИЧНОЕ), но только те, которые не активны и не завершены
  // (активные показываются в "Мои активные эксперименты", завершённые - в "Завершённые")
  // ВАЖНО: Последовательное открытие - показываем только первый доступный квест
  // Следующий откроется после завершения предыдущего
  const baseQuests = useMemo(() => {
    const filtered = quests.filter((q: any) => 
      q.type !== 'in-person' && 
      q.status !== 'active' && 
      q.status !== 'done'
    );
    
    // Последовательное открытие: показываем только первый доступный квест
    // Считаем сколько базовых квестов завершено
    const completedBaseQuests = quests.filter((q: any) => 
      q.type !== 'in-person' && 
      q.status === 'done'
    ).length;
    
    // Показываем только квесты до текущего прогресса + 1 (следующий доступный)
    if (filtered.length > 0) {
      // Сортируем по created_at
      const sorted = [...filtered].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      // Показываем только следующий доступный квест (после завершенных)
      const nextQuestIndex = completedBaseQuests;
      if (nextQuestIndex < sorted.length) {
        return [sorted[nextQuestIndex]]; // Только следующий доступный квест
      }
      // Если все доступные квесты завершены, не показываем ничего
      return [];
    }
    return [];
  }, [quests]);

  // Активные эксперименты - все квесты (и живые, и базовые) со статусом 'active'
  const activeQuests = useMemo(() => 
    quests.filter((q: any) => q.status === 'active'),
    [quests]
  );

  // Завершённые квесты - все квесты со статусом 'done'
  const completedQuests = useMemo(() => 
    quests.filter((q: any) => q.status === 'done'),
    [quests]
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка экспериментов..." />;
  }

  // Показываем ошибки, если есть
  const hasErrors = questsError || casesError || nodeDescriptionsError;

  return (
    <main className="min-h-screen bg-obsidian-core p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-ash-light" id="page-title">
            Эксперименты
          </h1>
          <p className="text-sm md:text-base text-ui-text-muted">
            Всё, где ты пробуешь другой способ действия
          </p>
        </div>

        {/* Отображение предупреждений и ошибок */}
        {(hasErrors || isQuestsDisabled) && (
          <div className="mb-6 bg-graphite-structure border border-catalyst-gold rounded-lg p-4">
            <p className="text-sm text-system-warning font-medium mb-2">
              {isQuestsDisabled && !hasErrors 
                ? 'Для просмотра квестов необходимо авторизоваться' 
                : (casesError || questsError || nodeDescriptionsError)?.message?.includes('ERR_CONNECTION_REFUSED') || (casesError || questsError || nodeDescriptionsError)?.message?.includes('Failed to fetch')
                ? 'API сервер не запущен' 
                : 'Не удалось загрузить некоторые данные:'}
            </p>
            {hasErrors && (
              <>
                <ul className="text-xs text-ui-text-muted space-y-1 mb-2">
                  {questsError && (
                    <li>
                      Квесты: {questsError instanceof Error 
                        ? (questsError.message.includes('ERR_CONNECTION_REFUSED') || questsError.message.includes('Failed to fetch')
                          ? 'Сервер недоступен. Убедитесь, что API сервер запущен на localhost:3001'
                          : questsError.message)
                        : 'Ошибка загрузки'}
                    </li>
                  )}
                  {casesError && (
                    <li>
                      Кейсы: {casesError instanceof Error 
                        ? (casesError.message.includes('ERR_CONNECTION_REFUSED') || casesError.message.includes('Failed to fetch')
                          ? 'Сервер недоступен. Убедитесь, что API сервер запущен на localhost:3001'
                          : casesError.message)
                        : 'Ошибка загрузки'}
                    </li>
                  )}
                  {nodeDescriptionsError && (
                    <li>
                      Описания узлов: {nodeDescriptionsError instanceof Error 
                        ? (nodeDescriptionsError.message.includes('ERR_CONNECTION_REFUSED') || nodeDescriptionsError.message.includes('Failed to fetch')
                          ? 'Сервер недоступен. Убедитесь, что API сервер запущен на localhost:3001'
                          : nodeDescriptionsError.message)
                        : 'Ошибка загрузки'}
                    </li>
                  )}
                </ul>
                {(casesError || questsError || nodeDescriptionsError)?.message?.includes('ERR_CONNECTION_REFUSED') || (casesError || questsError || nodeDescriptionsError)?.message?.includes('Failed to fetch') && (
                  <div className="mt-3 p-3 bg-obsidian-core border border-ui-border-soft rounded text-xs text-ui-text-muted">
                    <p className="font-medium mb-1">Как запустить API сервер:</p>
                    <code className="block bg-bg-canvas p-2 rounded mt-1">
                      cd leadership-architect<br />
                      pnpm run dev --filter=api
                    </code>
                  </div>
                )}
              </>
            )}
            {isQuestsDisabled && !hasErrors && (
              <p className="text-xs text-ui-text-muted mt-2">
                Квесты доступны только для авторизованных пользователей. Кейсы загружены: {cases.length}
              </p>
            )}
          </div>
        )}

        {/* Вкладки */}
        <div className="mb-8">
          <PillTabs
            tabs={[
              { id: 'active', label: 'Мои активные', count: activeQuests.length },
              { id: 'base-quests', label: 'Базовые', count: baseQuests.length },
              { id: 'cases', label: 'Кейсы', count: cases.length },
              { id: 'completed', label: 'Готовые', count: completedQuests.length },
            ]}
            activeId={activeTab}
            onSelect={(id: string) => setActiveTab(id as ExperimentTab)}
            scrollable
            ariaLabel="Типы экспериментов"
          />
        </div>

        {/* Контент вкладок */}
        <div>
          {activeTab === 'active' && (
            <ActiveExperimentsSection 
              quests={activeQuests} 
              nodeDescriptions={nodeDescriptions}
              onQuestUpdate={() => queryClient.invalidateQueries({ queryKey: ['quests'] })}
              toast={toast}
              tree={tree ?? null}
            />
          )}
          {activeTab === 'base-quests' && (
            <BaseQuestsSection 
              quests={baseQuests} 
              nodeDescriptions={nodeDescriptions}
              onQuestUpdate={() => queryClient.invalidateQueries({ queryKey: ['quests'] })}
              toast={toast}
              typeFilter={baseQuestTypeFilter}
              setTypeFilter={setBaseQuestTypeFilter}
              labelFilter={baseQuestLabelFilter}
              setLabelFilter={setBaseQuestLabelFilter}
              tree={tree ?? null}
            />
          )}
          {activeTab === 'completed' && (
            <QuestsSection 
              quests={completedQuests} 
              title="Завершённые"
              subtitle="Завершённые квесты"
              nodeDescriptions={nodeDescriptions}
              onQuestUpdate={() => queryClient.invalidateQueries({ queryKey: ['quests'] })}
              toast={toast}
            />
          )}
          {activeTab === 'cases' && (
            <CasesSection cases={cases} nodeDescriptions={nodeDescriptions} tree={tree ?? null} />
          )}
        </div>
      </div>
    </main>
  );
}

export default function ExperimentsPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen text="Загрузка экспериментов..." />}>
      <ExperimentsPageInner />
    </Suspense>
  );
}

// Компонент для активных экспериментов
function ActiveExperimentsSection({ quests, nodeDescriptions, onQuestUpdate, toast, tree }: { quests: any[], nodeDescriptions: any, onQuestUpdate: () => void, toast: any, tree?: SemanticTree | null }) {
  const router = useRouter();
  // Функция для определения уровня узла
  const getNodeLevel = (nodeId: string, tree: SemanticTree | null, nodeDescriptions?: any): { level: number; maxLevel: number } => {
    if (!tree || !tree.nodes) return { level: 0, maxLevel: 0 };
    
    // Ищем узел по node_id
    let node = tree.nodes.find((n: any) => n.node_id === nodeId);
    
    // Если не нашли по node_id, пытаемся найти по названию из nodeDescriptions
    if (!node && nodeDescriptions) {
      const nodeName = getNodeName(nodeId, nodeDescriptions);
      if (nodeName && nodeName !== nodeId) {
        // Пытаемся найти узел по названию (частичное совпадение)
        node = tree.nodes.find((n: any) => {
          const nodeNameLower = nodeName.toLowerCase();
          const treeNodeNameLower = (n.name || '').toLowerCase();
          return treeNodeNameLower.includes(nodeNameLower) || nodeNameLower.includes(treeNodeNameLower);
        });
      }
    }
    
    if (!node) {
      // Если узел не найден, но есть linked_nodes, возвращаем базовый уровень
      return { level: 1, maxLevel: 6 };
    }
    
    // Если у узла нет branch_id, но есть узлы, используем общее количество узлов как maxLevel
    if (!node.branch_id) {
      const totalNodes = tree.nodes.length;
      return { level: 1, maxLevel: totalNodes > 0 ? totalNodes : 6 };
    }
    
    // Получаем все узлы этой ветки
    const branchNodes = tree.nodes.filter((n: any) => n.branch_id === node.branch_id);
    
    if (branchNodes.length === 0) {
      return { level: 1, maxLevel: 6 };
    }
    
    // Сортируем узлы ветки по xp_required для определения уровня
    const sortedNodes = [...branchNodes].sort((a, b) => 
      (a.xp_required || 0) - (b.xp_required || 0)
    );
    
    const index = sortedNodes.findIndex((n: any) => n.node_id === node.node_id);
    const level = index >= 0 ? index + 1 : 1; // Минимум уровень 1, если узел найден
    const maxLevel = branchNodes.length;
    
    return { level, maxLevel };
  };

  // Функция для определения сложности квеста
  const getQuestComplexity = (quest: any, tree: SemanticTree | null, nodeDescriptions?: any): { minLevel: number; maxLevel: number; avgLevel: number } => {
    if (!quest.linked_nodes || !Array.isArray(quest.linked_nodes) || quest.linked_nodes.length === 0) {
      return { minLevel: 0, maxLevel: 0, avgLevel: 0 };
    }
    
    if (!tree || !tree.nodes) {
      return { minLevel: 0, maxLevel: 0, avgLevel: 0 };
    }
    
    const levels: number[] = [];
    const maxLevels: number[] = [];
    
    quest.linked_nodes.forEach((nodeId: string) => {
      const { level, maxLevel } = getNodeLevel(nodeId, tree, nodeDescriptions);
      // Если узел найден (даже если level = 1 по умолчанию), учитываем его
      if (level > 0) {
        levels.push(level);
        if (maxLevel > 0) {
          maxLevels.push(maxLevel);
        }
      }
    });
    
    if (levels.length === 0) {
      return { minLevel: 0, maxLevel: 0, avgLevel: 0 };
    }
    
    const minLevel = Math.min(...levels);
    const maxLevel = maxLevels.length > 0 ? Math.max(...maxLevels) : (levels.length > 0 ? 6 : 0);
    const avgLevel = Math.round(levels.reduce((sum, l) => sum + l, 0) / levels.length);
    
    return { minLevel, maxLevel, avgLevel };
  };
  if (quests.length === 0) {
    return (
      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
        <p className="text-ui-text-muted mb-4">У вас пока нет активных экспериментов</p>
        <Link
          href="/traces"
          className="inline-block px-6 py-3 bg-system-focus text-ash-light rounded-lg hover:bg-system-focus/90 transition-colors font-medium"
        >
          Создать ситуацию
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ash-light mb-2">Мои активные эксперименты</h2>
        <p className="text-ui-text-muted">Эксперименты, над которыми вы работаете прямо сейчас</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quests.map((quest) => {
          const steps = quest.steps || [];
          const completedSteps = steps.filter((step: any) => step.completed || step.status === 'completed').length;
          
          // Гипотеза квеста (берём из hypothesis, criteria или description)
          const hypothesis = (quest as any)?.hypothesis || 
                            (quest.criteria as any)?.hypothesis ||
                            (quest.description && quest.description.length > 20 ? quest.description.slice(0, 150) : undefined);
          
          // XP награда
          const xpReward = quest.reward?.xp || 0;
          
          // Влияние на дерево (массив узлов) - показываем все связанные узлы
          const treeImpact = quest.linked_nodes?.map((nodeId: string) => ({
            nodeName: getNodeName(nodeId, nodeDescriptions),
            percentage: quest.reward?.nodes?.[nodeId] || 5, // дефолт 5% если не указано
          })) || [];
          
          const questTypeMap: Record<string, QuestType> = { 'micro': 'micro', 'weekly': 'weekly', 'story': 'story', 'in-person': 'default' };
          const questStatusMap: Record<string, QuestStatus> = { 'active': 'in_progress', 'done': 'completed', 'backlog': 'available', 'archived': 'locked' };
          
          return (
            <NewQuestCard
              key={quest.id}
              questId={quest.id}
              title={quest.title}
              hypothesis={hypothesis}
              questType={questTypeMap[quest.type] || 'default'}
              difficulty="intermediate"
              status={questStatusMap[quest.status] || 'available'}
              completedSteps={completedSteps}
              totalSteps={steps.length}
              xpReward={xpReward}
              treeImpact={treeImpact}
              estimatedMinutes={quest.type === 'micro' ? 5 : quest.type === 'weekly' ? 30 : 60}
              onClick={() => router.push(`/quests/${quest.id}`)}
            />
          );
        })}
      </div>
    </div>
  );
}

// Компонент для базовых квестов с фильтрами
function BaseQuestsSection({ 
  quests, 
  nodeDescriptions, 
  onQuestUpdate, 
  toast,
  typeFilter,
  setTypeFilter,
  labelFilter,
  setLabelFilter,
  tree
}: { 
  quests: any[], 
  nodeDescriptions: any,
  onQuestUpdate: () => void,
  toast: any,
  typeFilter: 'all' | 'micro' | 'weekly' | 'story',
  setTypeFilter: (filter: 'all' | 'micro' | 'weekly' | 'story') => void,
  labelFilter: string,
  setLabelFilter: (filter: string) => void,
  tree: SemanticTree | null
}) {
  const router = useRouter();
  // Фильтруем квесты по типу (верхнеуровневый фильтр)
  const filteredByType = useMemo(() => {
    if (typeFilter === 'all') return quests;
    return quests.filter((q: any) => q.type === typeFilter);
  }, [quests, typeFilter]);

  // Получаем доступные способности только из квестов, отфильтрованных по типу
  const availableLabels = useMemo(() => {
    const labelsSet = new Set<string>();
    filteredByType.forEach((quest) => {
      if (quest.linked_nodes && Array.isArray(quest.linked_nodes)) {
        quest.linked_nodes.forEach((nodeId: string) => {
          labelsSet.add(nodeId);
        });
      }
    });
    return Array.from(labelsSet).sort();
  }, [filteredByType]);

  // Фильтруем квесты по лейблу
  const filteredQuestsRaw = useMemo(() => {
    if (labelFilter === 'all') return filteredByType;
    return filteredByType.filter((q: any) => 
      q.linked_nodes && q.linked_nodes.includes(labelFilter)
    );
  }, [filteredByType, labelFilter]);

  // Функция для определения уровня узла (аналогично architecture/page.tsx)
  const getNodeLevel = (nodeId: string, tree: SemanticTree | null, nodeDescriptions?: any): { level: number; maxLevel: number } => {
    if (!tree || !tree.nodes) return { level: 0, maxLevel: 0 };
    
    // Ищем узел по node_id
    let node = tree.nodes.find((n: any) => n.node_id === nodeId);
    
    // Если не нашли по node_id, пытаемся найти по названию из nodeDescriptions
    if (!node && nodeDescriptions) {
      const nodeName = getNodeName(nodeId, nodeDescriptions);
      if (nodeName && nodeName !== nodeId) {
        // Пытаемся найти узел по названию (частичное совпадение)
        node = tree.nodes.find((n: any) => {
          const nodeNameLower = nodeName.toLowerCase();
          const treeNodeNameLower = (n.name || '').toLowerCase();
          return treeNodeNameLower.includes(nodeNameLower) || nodeNameLower.includes(treeNodeNameLower);
        });
      }
    }
    
    if (!node) {
      // Если узел не найден, но есть linked_nodes, возвращаем базовый уровень
      return { level: 1, maxLevel: 6 };
    }
    
    // Если у узла нет branch_id, но есть узлы, используем общее количество узлов как maxLevel
    if (!node.branch_id) {
      const totalNodes = tree.nodes.length;
      return { level: 1, maxLevel: totalNodes > 0 ? totalNodes : 6 };
    }
    
    // Получаем все узлы этой ветки
    const branchNodes = tree.nodes.filter((n: any) => n.branch_id === node.branch_id);
    
    if (branchNodes.length === 0) {
      return { level: 1, maxLevel: 6 };
    }
    
    // Сортируем узлы ветки по xp_required для определения уровня
    const sortedNodes = [...branchNodes].sort((a, b) => 
      (a.xp_required || 0) - (b.xp_required || 0)
    );
    
    const index = sortedNodes.findIndex((n: any) => n.node_id === node.node_id);
    const level = index >= 0 ? index + 1 : 1; // Минимум уровень 1, если узел найден
    const maxLevel = branchNodes.length;
    
    return { level, maxLevel };
  };

  // Функция для определения сложности квеста (минимальный уровень связанных узлов)
  const getQuestComplexity = (quest: any, tree: SemanticTree | null, nodeDescriptions?: any): { minLevel: number; maxLevel: number; avgLevel: number } => {
    if (!quest.linked_nodes || !Array.isArray(quest.linked_nodes) || quest.linked_nodes.length === 0) {
      return { minLevel: 0, maxLevel: 0, avgLevel: 0 };
    }
    
    if (!tree || !tree.nodes) {
      return { minLevel: 0, maxLevel: 0, avgLevel: 0 };
    }
    
    const levels: number[] = [];
    const maxLevels: number[] = [];
    
    quest.linked_nodes.forEach((nodeId: string) => {
      const { level, maxLevel } = getNodeLevel(nodeId, tree, nodeDescriptions);
      // Если узел найден (даже если level = 1 по умолчанию), учитываем его
      if (level > 0) {
        levels.push(level);
        if (maxLevel > 0) {
          maxLevels.push(maxLevel);
        }
      }
    });
    
    if (levels.length === 0) {
      return { minLevel: 0, maxLevel: 0, avgLevel: 0 };
    }
    
    const minLevel = Math.min(...levels);
    const maxLevel = maxLevels.length > 0 ? Math.max(...maxLevels) : (levels.length > 0 ? 6 : 0);
    const avgLevel = Math.round(levels.reduce((sum, l) => sum + l, 0) / levels.length);
    
    return { minLevel, maxLevel, avgLevel };
  };

  // Сортируем квесты по сложности (сначала по минимальному уровню, потом по среднему)
  const filteredQuests = useMemo(() => {
    if (!tree) return filteredQuestsRaw;
    
    return [...filteredQuestsRaw].sort((a, b) => {
      const complexityA = getQuestComplexity(a, tree, nodeDescriptions);
      const complexityB = getQuestComplexity(b, tree, nodeDescriptions);
      
      // Сначала по минимальному уровню
      if (complexityA.minLevel !== complexityB.minLevel) {
        return complexityA.minLevel - complexityB.minLevel;
      }
      
      // Затем по среднему уровню
      return complexityA.avgLevel - complexityB.avgLevel;
    });
  }, [filteredQuestsRaw, tree]);

  // Сбрасываем фильтр по способности, если выбранная способность недоступна после изменения фильтра по типу
  useEffect(() => {
    if (labelFilter !== 'all' && !availableLabels.includes(labelFilter)) {
      setLabelFilter('all');
    }
  }, [availableLabels, labelFilter, setLabelFilter]);

  if (quests.length === 0) {
    return (
      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
        <p className="text-ui-text-muted">Нет квестов в этой категории</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ash-light mb-2">Базовые квесты</h2>
        <p className="text-ui-text-muted">Все квесты из базы (микро-квест, недельный, сюжетный)</p>
      </div>

      {/* Фильтры */}
      <div className="mb-6 space-y-4">
        {/* Фильтр по типу */}
        <fieldset>
          <legend className="text-sm text-ui-text-muted mb-2">Тип квеста:</legend>
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Фильтр по типу квеста">
            {(['all', 'micro', 'weekly', 'story'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                aria-pressed={typeFilter === type}
                className={`px-4 py-2 min-h-[44px] rounded-lg border transition-colors text-sm ${
                  typeFilter === type
                    ? 'bg-obsidian-core border-strategic-blue text-strategic-blue'
                    : 'bg-graphite-structure border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong hover:text-ash-light'
                }`}
              >
                {type === 'all' ? 'Все' : type === 'micro' ? 'Микро-квест' : type === 'weekly' ? 'Недельный' : 'Сюжетный'}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Фильтр по лейблам (выпадающий список) - показывает только способности из отфильтрованных квестов */}
        {availableLabels.length > 0 && (
          <fieldset>
            <legend className="text-sm text-ui-text-muted mb-2">Проверяет способность:</legend>
            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              aria-label="Фильтр по способности"
              className="px-4 py-2 min-h-[44px] bg-graphite-structure border border-ui-border-soft rounded-lg text-ash-light hover:border-ui-border-strong focus:border-strategic-blue focus:outline-none focus:ring-2 focus:ring-strategic-blue/30 transition-colors text-sm min-w-[200px]"
            >
              <option value="all">Все способности</option>
              {availableLabels.map((nodeId) => (
                <option key={nodeId} value={nodeId}>
                  {getNodeName(nodeId, nodeDescriptions)}
                </option>
              ))}
            </select>
          </fieldset>
        )}
      </div>

      {/* Список квестов */}
      {filteredQuests.length === 0 ? (
        <div className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
          <p className="text-ui-text-muted">Нет квестов, соответствующих выбранным фильтрам</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuests.map((quest) => {
            const steps = quest.steps || [];
            const completedSteps = steps.filter((step: any) => step.completed || step.status === 'completed').length;
            
            // Гипотеза квеста (берём из hypothesis, criteria или description)
            const hypothesis = (quest as any)?.hypothesis || 
                              (quest.criteria as any)?.hypothesis ||
                              (quest.description && quest.description.length > 20 ? quest.description.slice(0, 150) : undefined);
            
            // XP награда
            const xpReward = quest.reward?.xp || 0;
            
            // Влияние на дерево (массив узлов) - показываем все связанные узлы
            const treeImpact = quest.linked_nodes?.map((nodeId: string) => ({
              nodeName: getNodeName(nodeId, nodeDescriptions),
              percentage: quest.reward?.nodes?.[nodeId] || 5, // дефолт 5% если не указано
            })) || [];
            
            const questTypeMap: Record<string, QuestType> = { 'micro': 'micro', 'weekly': 'weekly', 'story': 'story', 'in-person': 'default' };
            const questStatusMap: Record<string, QuestStatus> = { 'active': 'in_progress', 'done': 'completed', 'backlog': 'available', 'archived': 'locked' };
            
            return (
              <NewQuestCard
                key={quest.id}
                questId={quest.id}
                title={quest.title}
                hypothesis={hypothesis}
                questType={questTypeMap[quest.type] || 'default'}
                difficulty="intermediate"
                status={questStatusMap[quest.status] || 'available'}
                completedSteps={completedSteps}
                totalSteps={steps.length}
                xpReward={xpReward}
                treeImpact={treeImpact}
                estimatedMinutes={quest.type === 'micro' ? 5 : quest.type === 'weekly' ? 30 : 60}
                onClick={() => router.push(`/quests/${quest.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// Компонент для секции квестов
function QuestsSection({ quests, title, subtitle, nodeDescriptions, onQuestUpdate, toast, tree }: { 
  quests: any[], 
  title: string, 
  subtitle: string,
  nodeDescriptions: any,
  onQuestUpdate: () => void,
  toast: any,
  tree?: SemanticTree | null
}) {
  const router = useRouter();
  // Функция для определения уровня узла
  const getNodeLevel = (nodeId: string, tree: SemanticTree | null, nodeDescriptions?: any): { level: number; maxLevel: number } => {
    if (!tree || !tree.nodes) return { level: 0, maxLevel: 0 };
    
    // Ищем узел по node_id
    let node = tree.nodes.find((n: any) => n.node_id === nodeId);
    
    // Если не нашли по node_id, пытаемся найти по названию из nodeDescriptions
    if (!node && nodeDescriptions) {
      const nodeName = getNodeName(nodeId, nodeDescriptions);
      if (nodeName && nodeName !== nodeId) {
        // Пытаемся найти узел по названию (частичное совпадение)
        node = tree.nodes.find((n: any) => {
          const nodeNameLower = nodeName.toLowerCase();
          const treeNodeNameLower = (n.name || '').toLowerCase();
          return treeNodeNameLower.includes(nodeNameLower) || nodeNameLower.includes(treeNodeNameLower);
        });
      }
    }
    
    if (!node) {
      // Если узел не найден, но есть linked_nodes, возвращаем базовый уровень
      return { level: 1, maxLevel: 6 };
    }
    
    // Если у узла нет branch_id, но есть узлы, используем общее количество узлов как maxLevel
    if (!node.branch_id) {
      const totalNodes = tree.nodes.length;
      return { level: 1, maxLevel: totalNodes > 0 ? totalNodes : 6 };
    }
    
    // Получаем все узлы этой ветки
    const branchNodes = tree.nodes.filter((n: any) => n.branch_id === node.branch_id);
    
    if (branchNodes.length === 0) {
      return { level: 1, maxLevel: 6 };
    }
    
    // Сортируем узлы ветки по xp_required для определения уровня
    const sortedNodes = [...branchNodes].sort((a, b) => 
      (a.xp_required || 0) - (b.xp_required || 0)
    );
    
    const index = sortedNodes.findIndex((n: any) => n.node_id === node.node_id);
    const level = index >= 0 ? index + 1 : 1; // Минимум уровень 1, если узел найден
    const maxLevel = branchNodes.length;
    
    return { level, maxLevel };
  };

  // Функция для определения сложности квеста
  const getQuestComplexity = (quest: any, tree: SemanticTree | null, nodeDescriptions?: any): { minLevel: number; maxLevel: number; avgLevel: number } => {
    if (!quest.linked_nodes || !Array.isArray(quest.linked_nodes) || quest.linked_nodes.length === 0) {
      return { minLevel: 0, maxLevel: 0, avgLevel: 0 };
    }
    
    if (!tree || !tree.nodes) {
      return { minLevel: 0, maxLevel: 0, avgLevel: 0 };
    }
    
    const levels: number[] = [];
    const maxLevels: number[] = [];
    
    quest.linked_nodes.forEach((nodeId: string) => {
      const { level, maxLevel } = getNodeLevel(nodeId, tree, nodeDescriptions);
      // Если узел найден (даже если level = 1 по умолчанию), учитываем его
      if (level > 0) {
        levels.push(level);
        if (maxLevel > 0) {
          maxLevels.push(maxLevel);
        }
      }
    });
    
    if (levels.length === 0) {
      return { minLevel: 0, maxLevel: 0, avgLevel: 0 };
    }
    
    const minLevel = Math.min(...levels);
    const maxLevel = maxLevels.length > 0 ? Math.max(...maxLevels) : (levels.length > 0 ? 6 : 0);
    const avgLevel = Math.round(levels.reduce((sum, l) => sum + l, 0) / levels.length);
    
    return { minLevel, maxLevel, avgLevel };
  };
  if (quests.length === 0) {
    return (
      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
        <p className="text-ui-text-muted">Нет квестов в этой категории</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ash-light mb-2">{title}</h2>
        <p className="text-ui-text-muted">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quests.map((quest) => {
          const steps = quest.steps || [];
          const completedSteps = steps.filter((step: any) => step.completed || step.status === 'completed').length;
          
          // Гипотеза квеста (берём из hypothesis, criteria или description)
          const hypothesis = (quest as any)?.hypothesis || 
                            (quest.criteria as any)?.hypothesis ||
                            (quest.description && quest.description.length > 20 ? quest.description.slice(0, 150) : undefined);
          
          // XP награда
          const xpReward = quest.reward?.xp || 0;
          
          // Влияние на дерево (массив узлов) - показываем все связанные узлы
          const treeImpact = quest.linked_nodes?.map((nodeId: string) => ({
            nodeName: getNodeName(nodeId, nodeDescriptions),
            percentage: quest.reward?.nodes?.[nodeId] || 5, // дефолт 5% если не указано
          })) || [];
          
          const questTypeMap: Record<string, QuestType> = { 'micro': 'micro', 'weekly': 'weekly', 'story': 'story', 'in-person': 'default' };
          const questStatusMap: Record<string, QuestStatus> = { 'active': 'in_progress', 'done': 'completed', 'backlog': 'available', 'archived': 'locked' };
          
          return (
            <NewQuestCard
              key={quest.id}
              questId={quest.id}
              title={quest.title}
              hypothesis={hypothesis}
              questType={questTypeMap[quest.type] || 'default'}
              difficulty="intermediate"
              status={questStatusMap[quest.status] || 'available'}
              completedSteps={completedSteps}
              totalSteps={steps.length}
              xpReward={xpReward}
              treeImpact={treeImpact}
              estimatedMinutes={quest.type === 'micro' ? 5 : quest.type === 'weekly' ? 30 : 60}
              onClick={() => router.push(`/quests/${quest.id}`)}
            />
          );
        })}
      </div>
    </div>
  );
}

// Компонент для секции кейсов
function CasesSection({ cases, nodeDescriptions, tree }: { cases: InteractiveCase[], nodeDescriptions: any, tree?: SemanticTree | null }) {
  const router = useRouter();
  const [caseProgress, setCaseProgress] = useState<CaseProgress>({ solvedCases: [], nodeProgress: {} });
  const [showLockedModal, setShowLockedModal] = useState<{ show: boolean; message: string; nodeId?: string }>({ show: false, message: '' });
  
  // Загружаем квесты для проверки завершенных квестов на узлах
  const { data: questsData } = useQuery({
    queryKey: ['quests'],
    queryFn: () => getQuests(),
    staleTime: 1000 * 60 * 5, // 5 минут
  });
  const quests = questsData?.quests || [];

  // Загружаем прогресс при монтировании и при возврате на страницу
  useEffect(() => {
    loadProgress();
    
    // Обновляем прогресс при фокусе на окне (когда пользователь возвращается)
    const handleFocus = () => {
      loadProgress();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  async function loadProgress() {
    try {
      // Load progress from API (single source of truth - database)
      const apiProgress = await getCaseProgress();
      setCaseProgress(apiProgress);
    } catch (error) {
      console.error('Failed to load case progress:', error);
    }
  }

  // Функция для определения уровня узла
  const getNodeLevel = (nodeId: string | undefined, tree: SemanticTree | null | undefined, nodeDescriptions?: any): { level: number; maxLevel: number } => {
    if (!nodeId || !tree || !tree.nodes) return { level: 1, maxLevel: 1 };
    
    // Ищем узел по node_id (точное совпадение)
    let node = tree.nodes.find((n: any) => n.node_id === nodeId);
    
    // Если не нашли по node_id, пытаемся найти по названию из nodeDescriptions
    if (!node && nodeDescriptions) {
      const nodeName = getNodeName(nodeId, nodeDescriptions);
      if (nodeName && nodeName !== nodeId) {
        // Пытаемся найти узел по названию (частичное совпадение)
        node = tree.nodes.find((n: any) => {
          const nodeNameLower = nodeName.toLowerCase();
          const treeNodeNameLower = (n.name || '').toLowerCase();
          return treeNodeNameLower.includes(nodeNameLower) || nodeNameLower.includes(treeNodeNameLower);
        });
      }
    }
    
    // Если всё ещё не нашли, пробуем найти по частичному совпадению node_id
    if (!node) {
      node = tree.nodes.find((n: any) => {
        if (!n.node_id) return false;
        return n.node_id.includes(nodeId) || nodeId.includes(n.node_id);
      });
    }
    
    if (!node) {
      // Если узел не найден, возвращаем уровень 1 (fallback)
      console.warn(`Node not found in tree: ${nodeId}`);
      return { level: 1, maxLevel: 1 };
    }
    
    // Если у узла нет branch_id, считаем его узлом уровня 1
    if (!node.branch_id) {
      return { level: 1, maxLevel: 1 };
    }
    
    // Получаем все узлы этой ветки
    const branchNodes = tree.nodes.filter((n: any) => n.branch_id === node.branch_id);
    
    if (branchNodes.length === 0) {
      return { level: 1, maxLevel: 1 };
    }
    
    // Сортируем узлы ветки по xp_required для определения уровня
    const sortedNodes = [...branchNodes].sort((a, b) => 
      (a.xp_required || 0) - (b.xp_required || 0)
    );
    
    const index = sortedNodes.findIndex((n: any) => n.node_id === node.node_id);
    const level = index >= 0 ? index + 1 : 1; // Минимум уровень 1, если узел найден
    const maxLevel = branchNodes.length;
    
    return { level, maxLevel };
  };

  // Функция для подсчета завершенных квестов на узле
  const getCompletedQuestsOnNode = (nodeId: string): number => {
    if (!quests || quests.length === 0) return 0;
    return quests.filter(
      (q: Quest) => q.status === 'done' && q.linked_nodes?.includes(nodeId)
    ).length;
  };

  // Функция для проверки доступности кейса
  // ИЗМЕНЕНО: Убрана зависимость от node.state (который часто некорректен)
  // Главный критерий - наличие завершённых квестов на узле
  const isCaseAvailable = (case_: InteractiveCase): boolean => {
    // 1. Базовые проверки - кейсы должны иметь node_id
    if (!case_.node_id) {
      console.error(`Case ${case_.id} has no node_id - needs manual assignment`);
      return false; // Кейс без node_id недоступен до ручной привязки
    }
    
    if (!tree || !tree.nodes) return false;
    
    // 2. Найти узел кейса в дереве
    const node = tree.nodes.find((n: any) => n.node_id === case_.node_id);
    if (!node) {
      console.warn(`Node ${case_.node_id} not found in tree for case ${case_.id}`);
      return false;
    }
    
    // 3. ГЛАВНЫЙ КРИТЕРИЙ: Проверить наличие завершенных квестов на узле
    // Для открытия ЛЮБЫХ кейсов требуется хотя бы 1 завершенный квест на узле
    const completedQuestsOnNode = getCompletedQuestsOnNode(case_.node_id);
    if (completedQuestsOnNode === 0) {
      return false; // Нет завершенных квестов - кейс недоступен
    }
    
    // 4. Проверить сложность кейса
    const nodeProgress = caseProgress.nodeProgress[case_.node_id] || { progress: 0, solved: [] };
    const solvedCount = nodeProgress.solved.length;
    
    // Найти решенные кейсы этого узла для проверки наличия intermediate
    const solvedCasesForNode = nodeProgress.solved || [];
    const hasIntermediate = solvedCasesForNode.some((caseId: string) => {
      const solvedCase = cases.find((c: InteractiveCase) => c.id === caseId);
      return solvedCase?.difficulty === 'intermediate';
    });
    
    // Basic кейсы - доступны сразу после первого квеста
    if (case_.difficulty === 'basic') {
      return true; // Квест уже есть (проверено выше)
    }
    
    // Intermediate кейсы - нужен прогресс ≥30% ИЛИ решен ≥1 basic кейс
    if (case_.difficulty === 'intermediate') {
      return nodeProgress.progress >= 30 || solvedCount >= 1;
    }
    
    // Advanced кейсы - прогресс ≥60% ИЛИ решено ≥2 кейса (включая ≥1 intermediate)
    if (case_.difficulty === 'advanced') {
      return nodeProgress.progress >= 60 || (solvedCount >= 2 && hasIntermediate);
    }
    
    return false;
  };

  // Функция ранжирования кейсов
  const rankCases = (casesToRank: InteractiveCase[]): InteractiveCase[] => {
    const difficultyOrder = { basic: 1, intermediate: 2, advanced: 3 };
    
    return [...casesToRank].sort((a, b) => {
      const aSolved = caseProgress.solvedCases.includes(a.id);
      const bSolved = caseProgress.solvedCases.includes(b.id);
      const aAvailable = isCaseAvailable(a);
      const bAvailable = isCaseAvailable(b);
      
      // 1. Приоритет: доступные → недоступные → завершённые
      // Доступные и не решённые = приоритет 0
      // Недоступные и не решённые = приоритет 1
      // Решённые = приоритет 2
      const getPriority = (solved: boolean, available: boolean): number => {
        if (solved) return 2;
        if (!available) return 1;
        return 0;
      };
      
      const aPriority = getPriority(aSolved, aAvailable);
      const bPriority = getPriority(bSolved, bAvailable);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // 2. По уровню узла (1 → 2)
      const aLevelInfo = getNodeLevel(a.node_id, tree || null, nodeDescriptions);
      const bLevelInfo = getNodeLevel(b.node_id, tree || null, nodeDescriptions);
      
      if (aLevelInfo.level !== bLevelInfo.level) {
        return aLevelInfo.level - bLevelInfo.level;
      }
      
      // 3. Если уровень одинаковый, сортируем по node_id для группировки по узлам
      if (a.node_id !== b.node_id) {
        return (a.node_id || '').localeCompare(b.node_id || '');
      }
      
      // 4. По сложности внутри узла (basic → intermediate → advanced)
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
  };

  // Ранжируем кейсы
  const rankedCases = useMemo(() => rankCases(cases), [cases, caseProgress, tree, nodeDescriptions]);

  // Функция для получения причины недоступности кейса
  const getCaseUnavailableReason = (case_: InteractiveCase): { message: string; nodeId?: string } => {
    if (!case_.node_id || !tree || !tree.nodes) {
      return { message: 'Кейс не может быть открыт. Обратитесь к администратору.' };
    }
    
    const node = tree.nodes.find((n: any) => n.node_id === case_.node_id);
    if (!node) {
      return { message: 'Узел для этого кейса не найден. Обратитесь к администратору.' };
    }
    
    const nodeProgress = caseProgress.nodeProgress[case_.node_id] || { progress: 0, solved: [] };
    const solvedCount = nodeProgress.solved.length;
    const nodeName = getNodeName(case_.node_id, nodeDescriptions);
    
    // ГЛАВНЫЙ КРИТЕРИЙ: Проверка наличия завершенных квестов на узле
    // Убрана зависимость от nodeState, так как статусы узлов не синхронизированы
    const completedQuestsOnNode = getCompletedQuestsOnNode(case_.node_id);
    if (completedQuestsOnNode === 0) {
      return { 
        message: `Для доступа к кейсам сначала выполните хотя бы один квест на узле «${nodeName}». Квесты дают практику в реальности, а кейсы — закрепление.`,
        nodeId: case_.node_id
      };
    }
    
    // Проверка сложности (упрощённая логика без зависимости от nodeState)
    if (case_.difficulty === 'intermediate') {
      if (nodeProgress.progress < 30 && solvedCount < 1) {
        return { 
          message: `Сначала решите базовые кейсы узла «${nodeName}» или продолжайте выполнять квесты до 30% прогресса.`,
          nodeId: case_.node_id
        };
      }
    }
    
    if (case_.difficulty === 'advanced') {
      
      const solvedCasesForNode = nodeProgress.solved || [];
      const hasIntermediate = solvedCasesForNode.some((caseId: string) => {
        const solvedCase = cases.find((c: InteractiveCase) => c.id === caseId);
        return solvedCase?.difficulty === 'intermediate';
      });
      
      if (nodeProgress.progress < 60 && !(solvedCount >= 2 && hasIntermediate)) {
        const solvedBasic = solvedCasesForNode.filter((id: string) => {
          const solvedCase = cases.find((c: InteractiveCase) => c.id === id);
          return solvedCase?.difficulty === 'basic';
        }).length;
        const solvedIntermediate = solvedCasesForNode.filter((id: string) => {
          const solvedCase = cases.find((c: InteractiveCase) => c.id === id);
          return solvedCase?.difficulty === 'intermediate';
        }).length;
        
        if (solvedCount < 2) {
          return { 
            message: `Для доступа к сложному кейсу нужно решить минимум 2 кейса этого узла (включая хотя бы 1 intermediate) или развить способность до 60% прогресса. Решено: ${solvedCount} из 2 (basic: ${solvedBasic}, intermediate: ${solvedIntermediate}).`,
            nodeId: case_.node_id
          };
        } else if (!hasIntermediate) {
          return { 
            message: `Для доступа к сложному кейсу нужно решить хотя бы 1 intermediate кейс этого узла или развить способность до 60% прогресса. Решено: ${solvedCount} кейсов, но нет intermediate.`,
            nodeId: case_.node_id
          };
        }
        
        return { 
          message: `Для доступа к этому кейсу нужно развить способность до 60% прогресса или решить больше кейсов. Прогресс: ${nodeProgress.progress}%`,
          nodeId: case_.node_id
        };
      }
    }
    
    return { 
      message: 'Развитие — это процесс. Продолжайте выполнять квесты и решать кейсы предыдущего уровня.',
      nodeId: case_.node_id
    };
  };

  const handleCaseClick = (e: React.MouseEvent, case_: InteractiveCase) => {
    if (!isCaseAvailable(case_)) {
      e.preventDefault();
      const { message, nodeId } = getCaseUnavailableReason(case_);
      setShowLockedModal({ show: true, message, nodeId });
      // Автозакрытие через 6 секунд (увеличено для более длинных сообщений и показа кнопки)
      setTimeout(() => {
        setShowLockedModal({ show: false, message: '' });
      }, 6000);
    }
  };

  // Сохраняем позицию скролла перед переходом к кейсу
  const handleCaseLinkClick = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    }
  };

  if (cases.length === 0) {
    return (
      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
        <p className="text-ui-text-muted">Нет доступных кейсов</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ash-light mb-2">Учебные кейсы</h2>
        <p className="text-ui-text-muted">Практикуйтесь в принятии решений в безопасной среде</p>
      </div>
      
      {/* Модальное окно для недоступных кейсов */}
      <CaseLockedModal
        show={showLockedModal.show}
        message={showLockedModal.message}
        nodeId={showLockedModal.nodeId}
        onClose={() => setShowLockedModal({ show: false, message: '' })}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rankedCases.map((case_) => {
          const isAvailable = isCaseAvailable(case_);
          const isSolved = caseProgress.solvedCases.includes(case_.id);
          
          return (
            <div
              key={case_.id}
              onClick={(e) => {
                if (!isAvailable && !isSolved) {
                  handleCaseClick(e, case_);
                } else {
                  handleCaseLinkClick();
                  router.push(`/cases/${case_.id}`);
                }
              }}
              className={!isAvailable && !isSolved ? 'cursor-not-allowed' : 'cursor-pointer'}
            >
              <NewCaseCard
                caseId={case_.id}
                title={case_.title}
                event={case_.event?.summary || case_.context?.split('\n')[0]?.slice(0, 150)}
                difficulty={case_.difficulty as CaseDifficulty}
                status={isSolved ? 'completed' : isAvailable ? 'available' : 'locked'}
                selectedOption={isSolved ? 'A' : undefined}
                treeImpact={case_.node_id ? [{
                  nodeName: getNodeName(case_.node_id, nodeDescriptions),
                  percentage: case_.difficulty === 'basic' ? 5 : case_.difficulty === 'intermediate' ? 10 : 15
                }] : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
