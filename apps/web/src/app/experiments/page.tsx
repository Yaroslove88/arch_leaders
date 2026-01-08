'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuests } from '../../hooks/useQuests';
import { getCases, InteractiveCase, activateQuest, getSemanticTree, SemanticTree } from '../../lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNodeDescriptions } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/ToastProvider';

type ExperimentTab = 'active' | 'live-quests' | 'base-quests' | 'cases' | 'completed';

// Маппинг nodeId на русские названия с переводами
const nodeNameMap: Record<string, string> = {
  'node_grounding_point': 'Точка опоры',
  'node_self_regulation': 'Саморегуляция',
  'node_role_differentiation': 'Различение ролей',
  'node_scenario_analysis': 'Разбор сценария',
  'node_subject_in_system': 'Субъект в системе',
  'node_decision_authorship': 'Авторство решений',
  'node_architecture_coupling': 'Архитектура сцепки',
  'node_field_of_differences': 'Поле различий',
  'node_system_thinking': 'Системное мышление',
  'node_scenario_thinking': 'Сценарное мышление',
  'node_form_assembly': 'Сборка форм',
  'node_containment': 'Контейнирование',
  'node_thinking_through_form': 'Мышление через форму',
  'node_personal_resilience': 'Личная устойчивость',
  'node_weak_zone_diagnosis': 'Диагностика слабых зон',
  'node_recovery_skills': 'Навыки восстановления',
  'node_emotional_work': 'Работа с эмоциями',
  'node_cognitive_maturity': 'Когнитивная зрелость',
  'node_role_energy': 'Энергия роли',
  'node_stress_tolerance': 'Толерантность к стрессу',
  'node_recovery': 'Восстановление',
  'node_responsibility_as_form': 'Ответственность как форма',
  'node_responsibility_sag_diagnosis': 'Диагностика провисания ответственности',
  'node_delegation_as_coupling': 'Делегирование как сцепка',
  'node_upper_field_work': 'Работа с верхним полем',
  'node_leader_liberation': 'Освобождение лидера',
  'node_shared_leadership': 'Распределённое лидерство',
  'node_psychological_ownership': 'Психологическая собственность',
  'node_collective_efficacy': 'Коллективная эффективность',
  'node_ownership': 'Владение',
  'node_accountability': 'Подотчетность',
  'node_feedback_types': 'Типы обратной связи',
  'node_language_of_differences': 'Язык различий',
  'node_feedback_through_vulnerability': 'Приём обратной связи через уязвимость',
  'node_feedforward': 'Обратная связь в будущее',
  'node_rede_model': 'REDE Модель',
  'node_mirror_holder': 'Смотрящий в окно vs Держащий зеркало',
  'node_giving_feedback': 'Дача обратной связи',
  'node_receiving_feedback': 'Принятие обратной связи',
  'node_maturity_environment': 'Среда зрелости',
  'node_subjectivity_transfer': 'Передача субъектности',
  'node_scene_holding': 'Удержание сцены',
  'node_institutionalization': 'Институционализация',
  'node_vertical_development': 'Вертикальное развитие',
  'node_ddo': 'Организация как тренажёр',
  'node_mature_parting': 'Зрелое расставание',
  'node_team_development': 'Развитие команды',
  'node_organizational_culture': 'Организационная культура',
  'node_grounding': 'Заземление',
  'node_design_thinking': 'Дизайн-мышление',
};

// Функция перевода названий узлов
function translateNodeName(name: string): string {
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
}

function getNodeName(nodeId: string, nodeDescriptions?: Record<string, { name: string }>): string {
  // Сначала пробуем получить из загруженных описаний
  if (nodeDescriptions?.[nodeId]?.name) {
    return translateNodeName(nodeDescriptions[nodeId].name);
  }
  // Затем из статического маппинга
  if (nodeNameMap[nodeId]) {
    return nodeNameMap[nodeId];
  }
  // Fallback: человеческий вид из id
  const fallbackName = nodeId.replace(/^node_/, '').replace(/_/g, ' ');
  return translateNodeName(fallbackName);
}

export default function ExperimentsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ExperimentTab>('active');
  const [baseQuestTypeFilter, setBaseQuestTypeFilter] = useState<'all' | 'micro' | 'weekly' | 'story'>('all');
  const [baseQuestLabelFilter, setBaseQuestLabelFilter] = useState<string>('all');
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: questsData, isLoading: questsLoading, error: questsError, isFetching: questsFetching } = useQuests();

  // Читаем вкладку из URL параметров при загрузке
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['active', 'live-quests', 'base-quests', 'cases', 'completed'].includes(tabParam)) {
      setActiveTab(tabParam as ExperimentTab);
    } else {
      // Или из localStorage
      const savedTab = typeof window !== 'undefined' ? localStorage.getItem('experiments_active_tab') : null;
      if (savedTab && ['active', 'live-quests', 'base-quests', 'cases', 'completed'].includes(savedTab)) {
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
    onError: (error) => {
      console.error('Failed to load cases:', error);
    },
  });
  const { data: nodeDescriptionsData, error: nodeDescriptionsError } = useQuery({
    queryKey: ['nodeDescriptions'],
    queryFn: getNodeDescriptions,
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('Failed to load node descriptions:', error);
    },
  });

  // Проверяем, есть ли токен авторизации для квестов
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const isQuestsDisabled = !token;

  const isLoading = questsLoading || casesLoading;
  const quests = questsData?.quests || [];
  const cases = casesData?.cases || [];
  const nodeDescriptions = nodeDescriptionsData?.descriptions || {};

  // Живые квесты - это квесты со статусом 'in-person' (квесты из анализов)
  const liveQuests = useMemo(() => 
    quests.filter((q: any) => q.type === 'in-person'),
    [quests]
  );

  // Базовые квесты - все остальные квесты (не in-person), но только те, которые не активны и не завершены
  // (активные показываются в "Мои активные эксперименты", завершённые - в "Завершённые")
  const baseQuests = useMemo(() => 
    quests.filter((q: any) => 
      q.type !== 'in-person' && 
      q.status !== 'active' && 
      q.status !== 'done'
    ),
    [quests]
  );

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
    <main className="min-h-screen bg-bg-main p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-ui-text-main" id="page-title">
            Эксперименты
          </h1>
          <p className="text-ui-text-muted">
            Всё, где ты пробуешь другой способ действия
          </p>
        </div>

        {/* Отображение предупреждений и ошибок */}
        {(hasErrors || isQuestsDisabled) && (
          <div className="mb-6 bg-bg-panel border border-system-warning rounded-lg p-4">
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
                  <div className="mt-3 p-3 bg-bg-secondary border border-ui-border-soft rounded text-xs text-ui-text-muted">
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
        <div className="mb-6 border-b border-ui-border-soft">
          <nav className="flex gap-4" aria-label="Типы экспериментов">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'active'
                  ? 'border-system-focus text-system-focus'
                  : 'border-transparent text-ui-text-muted hover:text-ui-text-main'
              }`}
            >
              Мои активные эксперименты ({activeQuests.length})
            </button>
            <button
              onClick={() => setActiveTab('live-quests')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'live-quests'
                  ? 'border-system-focus text-system-focus'
                  : 'border-transparent text-ui-text-muted hover:text-ui-text-main'
              }`}
            >
              Живые квесты ({liveQuests.length})
            </button>
            <button
              onClick={() => setActiveTab('base-quests')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'base-quests'
                  ? 'border-system-focus text-system-focus'
                  : 'border-transparent text-ui-text-muted hover:text-ui-text-main'
              }`}
            >
              Базовые квесты ({baseQuests.length})
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'cases'
                  ? 'border-system-focus text-system-focus'
                  : 'border-transparent text-ui-text-muted hover:text-ui-text-main'
              }`}
            >
              Учебные кейсы ({cases.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'completed'
                  ? 'border-system-focus text-system-focus'
                  : 'border-transparent text-ui-text-muted hover:text-ui-text-main'
              }`}
            >
              Завершённые ({completedQuests.length})
            </button>
          </nav>
        </div>

        {/* Контент вкладок */}
        <div>
          {activeTab === 'active' && (
            <ActiveExperimentsSection 
              quests={activeQuests} 
              nodeDescriptions={nodeDescriptions}
              onQuestUpdate={() => queryClient.invalidateQueries({ queryKey: ['quests'] })}
              toast={toast}
              tree={tree}
            />
          )}
          {activeTab === 'live-quests' && (
            <QuestsSection 
              quests={liveQuests} 
              title="Живые квесты"
              subtitle="Квесты из анализов ситуаций (in-person)"
              nodeDescriptions={nodeDescriptions}
              onQuestUpdate={() => queryClient.invalidateQueries({ queryKey: ['quests'] })}
              toast={toast}
              tree={tree}
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
              tree={tree}
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
            <CasesSection cases={cases} />
          )}
        </div>
      </div>
    </main>
  );
}

// Компонент для активных экспериментов
function ActiveExperimentsSection({ quests, nodeDescriptions, onQuestUpdate, toast, tree }: { quests: any[], nodeDescriptions: any, onQuestUpdate: () => void, toast: any, tree?: SemanticTree | null }) {
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
      <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
        <p className="text-ui-text-muted mb-4">У вас пока нет активных экспериментов</p>
        <Link
          href="/entries"
          className="inline-block px-6 py-3 bg-system-focus text-ui-text-main rounded-lg hover:bg-system-focus/90 transition-colors font-medium"
        >
          Создать ситуацию
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ui-text-main mb-2">Мои активные эксперименты</h2>
        <p className="text-ui-text-muted">Эксперименты, над которыми вы работаете прямо сейчас</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quests.map((quest) => (
          <QuestCard key={quest.id} quest={quest} nodeDescriptions={nodeDescriptions} onQuestUpdate={onQuestUpdate} toast={toast} />
        ))}
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
      <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
        <p className="text-ui-text-muted">Нет квестов в этой категории</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ui-text-main mb-2">Базовые квесты</h2>
        <p className="text-ui-text-muted">Все квесты из базы (micro, weekly, story)</p>
      </div>

      {/* Фильтры */}
      <div className="mb-6 space-y-4">
        {/* Фильтр по типу */}
        <div>
          <p className="text-sm text-ui-text-muted mb-2">Тип квеста:</p>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'micro', 'weekly', 'story'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded border transition-colors text-sm ${
                  typeFilter === type
                    ? 'bg-bg-secondary border-system-focus text-system-focus'
                    : 'bg-bg-panel border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong hover:text-ui-text-main'
                }`}
              >
                {type === 'all' ? 'Все' : type === 'micro' ? 'Micro' : type === 'weekly' ? 'Weekly' : 'Story'}
              </button>
            ))}
          </div>
        </div>

        {/* Фильтр по лейблам (выпадающий список) - показывает только способности из отфильтрованных квестов */}
        {availableLabels.length > 0 && (
          <div>
            <p className="text-sm text-ui-text-muted mb-2">Проверяет способность:</p>
            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              className="px-4 py-2 bg-bg-panel border border-ui-border-soft rounded text-ui-text-main hover:border-ui-border-strong transition-colors text-sm min-w-[200px]"
            >
              <option value="all">Все способности</option>
              {availableLabels.map((nodeId) => (
                <option key={nodeId} value={nodeId}>
                  {getNodeName(nodeId, nodeDescriptions)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Список квестов */}
      {filteredQuests.length === 0 ? (
        <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
          <p className="text-ui-text-muted">Нет квестов, соответствующих выбранным фильтрам</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuests.map((quest) => {
            const complexity = getQuestComplexity(quest, tree, nodeDescriptions);
            return (
              <QuestCard 
                key={quest.id} 
                quest={quest} 
                nodeDescriptions={nodeDescriptions} 
                onQuestUpdate={onQuestUpdate} 
                toast={toast}
                complexity={complexity}
                tree={tree}
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
      <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
        <p className="text-ui-text-muted">Нет квестов в этой категории</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ui-text-main mb-2">{title}</h2>
        <p className="text-ui-text-muted">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quests.map((quest) => {
          const complexity = getQuestComplexity(quest, tree || null, nodeDescriptions);
          return (
            <QuestCard 
              key={quest.id} 
              quest={quest} 
              nodeDescriptions={nodeDescriptions} 
              onQuestUpdate={onQuestUpdate} 
              toast={toast}
              complexity={complexity}
              tree={tree || null}
            />
          );
        })}
      </div>
    </div>
  );
}

// Компонент для секции кейсов
function CasesSection({ cases }: { cases: InteractiveCase[] }) {
  if (cases.length === 0) {
    return (
      <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
        <p className="text-ui-text-muted">Нет доступных кейсов</p>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic':
        return 'bg-bg-secondary border-system-growth/30 text-system-growth';
      case 'intermediate':
        return 'bg-bg-secondary border-system-warning/30 text-system-warning';
      case 'advanced':
        return 'bg-bg-secondary border-system-critical/30 text-system-critical';
      default:
        return 'bg-bg-secondary border-ui-border-soft text-ui-text-muted';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ui-text-main mb-2">Учебные кейсы</h2>
        <p className="text-ui-text-muted">Практикуйтесь в принятии решений в безопасной среде</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((case_) => (
          <Link
            key={case_.id}
            href={`/cases/${case_.id}`}
            className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 border-l-4 border-system-stable hover:shadow-active transition-shadow bg-panel-gradient block"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg text-ui-text-main">{case_.title}</h3>
              <span className={`text-xs px-2 py-1 rounded border ${getDifficultyColor(case_.difficulty)}`}>
                {case_.difficulty === 'basic' ? 'Базовый' : 
                 case_.difficulty === 'intermediate' ? 'Средний' : 
                 case_.difficulty === 'advanced' ? 'Продвинутый' : case_.difficulty}
              </span>
            </div>
            <p className="text-sm text-ui-text-muted mb-4 line-clamp-3">{case_.context}</p>
            <div className="text-sm text-system-focus hover:text-system-focus/80 hover:underline">
              Пройти кейс →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Карточка квеста с гипотезой и способностью
function QuestCard({ 
  quest, 
  nodeDescriptions, 
  onQuestUpdate, 
  toast,
  complexity,
  tree
}: { 
  quest: any, 
  nodeDescriptions: any, 
  onQuestUpdate: () => void, 
  toast: any,
  complexity?: { minLevel: number; maxLevel: number; avgLevel: number },
  tree?: SemanticTree | null
}) {
  const steps = quest.steps || [];
  const completedSteps = steps.filter((step: any) => step.completed || step.status === 'completed').length;
  const progressPercent = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  // Извлекаем гипотезу - проверяем разные возможные места
  // Для weekly квестов нужно извлекать только гипотезу, а не весь description с "Действия на неделю"
  let hypothesis = (quest as any).hypothesis || 
                   (quest.criteria as any)?.hypothesis || 
                   (quest.criteria as any)?.theory_and_examples?.hypothesis;
  
  // Если гипотезы нет в специальных полях, извлекаем из description
  if (!hypothesis && quest.description) {
    const desc = quest.description;
    // Для weekly квестов description может содержать "Действия на неделю" - обрезаем до этого места
    const actionsIndex = desc.indexOf('Действия на неделю:');
    if (actionsIndex !== -1) {
      hypothesis = desc.substring(0, actionsIndex).trim();
    } else {
      // Ищем другие маркеры конца гипотезы
      const markers = [
        'Действия на неделю',
        'Шаги выполнения:',
        'Этап 1:',
        'День 1:',
        'Критерии успеха:',
        'Награда:'
      ];
      let minIndex = desc.length;
      for (const marker of markers) {
        const index = desc.indexOf(marker);
        if (index !== -1 && index < minIndex) {
          minIndex = index;
        }
      }
      if (minIndex < desc.length) {
        hypothesis = desc.substring(0, minIndex).trim();
      } else {
        hypothesis = desc;
      }
    }
  }

  // Получаем способности, которые проверяет квест
  const abilityNodes = quest.linked_nodes || [];

  return (
    <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 border-l-4 border-system-focus bg-panel-gradient">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-ui-text-main mb-2">{quest.title}</h3>
          <div className="flex gap-2 flex-wrap items-center">
            <span className="px-2 py-1 bg-bg-secondary border border-system-focus text-system-focus rounded text-xs">
              {quest.type === 'micro' ? 'Micro' : 
               quest.type === 'weekly' ? 'Weekly' : 
               quest.type === 'story' ? 'Story' : 
               quest.type === 'in-person' ? 'In-person' : quest.type}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded border ${
                quest.status === 'active'
                  ? 'bg-bg-secondary border-system-growth/30 text-system-growth'
                  : quest.status === 'done'
                  ? 'bg-bg-secondary border-ui-border-soft text-ui-text-muted'
                  : 'bg-bg-secondary border-system-warning/30 text-system-warning'
              }`}
            >
              {quest.status === 'active' ? 'Активный' : 
               quest.status === 'done' ? 'Завершён' : 
               quest.status === 'backlog' ? 'Отложен' : quest.status}
            </span>
            {/* Индикатор сложности квеста (кружочки) */}
            {complexity && complexity.minLevel > 0 && (
              <div className="flex items-center gap-1.5" title={`Уровень сложности: ${complexity.minLevel}/${complexity.maxLevel || 6}`}>
                <div className="flex gap-0.5">
                  {Array.from({ length: 6 }).map((_, i) => {
                    // Вычисляем визуальный индикатор уровня на основе минимального уровня квеста
                    // Если maxLevel известен, используем его, иначе предполагаем 6
                    const maxLevelForCalc = complexity.maxLevel > 0 ? complexity.maxLevel : 6;
                    const levelIndicator = Math.ceil((complexity.minLevel / maxLevelForCalc) * 6);
                    return (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i < levelIndicator
                            ? 'bg-system-focus'
                            : 'bg-ui-border-soft'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Гипотеза */}
      <div className="mb-4">
        <p className="text-xs font-medium text-ui-text-muted mb-1">Гипотеза:</p>
        <p className="text-sm text-ui-text-main">{hypothesis}</p>
      </div>

      {/* Способность, которую проверяет */}
      {abilityNodes.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-ui-text-muted mb-2">Проверяет способность:</p>
          <div className="flex flex-wrap gap-1">
            {abilityNodes.map((nodeId: string) => (
              <span
                key={nodeId}
                className="px-2 py-1 bg-bg-secondary border border-system-stable text-system-stable rounded text-xs"
              >
                {getNodeName(nodeId, nodeDescriptions)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Прогресс выполнения */}
      {steps.length > 0 && quest.status === 'active' && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-ui-text-muted font-medium">Прогресс:</span>
            <span className="text-xs text-ui-text-main">{completedSteps} из {steps.length} шагов</span>
          </div>
          <div className="w-full bg-bg-canvas rounded-full h-1 border border-ui-border-soft">
            <div 
              className="bg-system-growth rounded-full transition-all"
              style={{ 
                width: `${progressPercent}%`,
                height: '100%'
              }}
            />
          </div>
        </div>
      )}

      {/* Действия */}
      <div className="mt-4 space-y-2">
        <Link
          href={`/quests/${quest.id}`}
          className="block w-full px-4 py-2 bg-bg-secondary border border-system-focus text-system-focus rounded hover:border-system-focus/70 hover:bg-bg-panel transition-colors text-center"
        >
          Открыть →
        </Link>
        {quest.status === 'backlog' && (
          <button
            onClick={async () => {
              try {
                await activateQuest(quest.id);
                toast.showToast('Квест активирован', 'success');
                onQuestUpdate();
              } catch (error) {
                toast.showToast('Ошибка при активации квеста', 'error');
              }
            }}
            className="w-full px-4 py-2 bg-system-focus text-ui-text-main rounded hover:bg-system-focus/80 transition-colors text-center"
          >
            Активировать
          </button>
        )}
      </div>
    </div>
  );
}

