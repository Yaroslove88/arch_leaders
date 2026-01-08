'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getSemanticTree, getCurrentBuild, getNodeDescription, getNodeDescriptions, getBuilds, SemanticTree, BuildStatus, NodeDescription } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useSearchParams } from 'next/navigation';

// Функция перевода названий узлов (вынесена на уровень модуля для использования в разных компонентах)
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

type ArchitectureTab = 'system' | 'tree' | 'builds' | 'history';

export default function ArchitecturePage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ArchitectureTab>('system');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeDescription, setNodeDescription] = useState<NodeDescription | null>(null);
  
  const { data: tree, isLoading: treeLoading } = useQuery({
    queryKey: ['tree', 'semantic'],
    queryFn: getSemanticTree,
  });
  
  const { data: currentBuilds, isLoading: buildsLoading } = useQuery({
    queryKey: ['builds', 'current'],
    queryFn: getCurrentBuild,
  });

  const { data: buildsData, isLoading: buildsDataLoading } = useQuery({
    queryKey: ['builds', 'all'],
    queryFn: getBuilds,
  });

  const isLoading = treeLoading || buildsLoading || buildsDataLoading;

  // Читаем параметры branch и node из URL при загрузке
  useEffect(() => {
    const branchParam = searchParams.get('branch');
    const nodeParam = searchParams.get('node');
    
    if (branchParam && branchParam !== selectedBranch) {
      setSelectedBranch(branchParam);
      setActiveTab('tree');
    }
    
    // Если есть параметр node, открываем модальное окно с описанием узла
    if (nodeParam && nodeParam !== selectedNode) {
      setActiveTab('tree');
      setSelectedNode(nodeParam);
      // Загружаем описание узла
      getNodeDescription(nodeParam)
        .then((description) => {
          setNodeDescription(description);
        })
        .catch((error) => {
          console.error('Failed to load node description:', error);
          setNodeDescription(null);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Активные билды
  const activeBuilds = useMemo(() => 
    Array.isArray(currentBuilds) ? currentBuilds.filter((b: BuildStatus) => b.is_active) : [],
    [currentBuilds]
  );

  // Доминирующие ветки (ветки с наибольшим количеством активных/интегрированных узлов)
  const dominantBranches = useMemo(() => {
    if (!tree?.branches || !tree?.nodes) return [];
    
    const branchStats = tree.branches.map((branch: any) => {
      const branchNodes = tree.nodes.filter((node: any) => 
        node.branch_id === branch.branch_id &&
        (node.state === 'active' || node.state === 'unlocked' || node.state === 'integrated')
      );
      return {
        branch,
        activeNodes: branchNodes.length,
        totalNodes: tree.nodes.filter((n: any) => n.branch_id === branch.branch_id).length,
        percentage: tree.nodes.filter((n: any) => n.branch_id === branch.branch_id).length > 0
          ? (branchNodes.length / tree.nodes.filter((n: any) => n.branch_id === branch.branch_id).length) * 100
          : 0,
      };
    });

    // Сортируем по проценту активных узлов и количеству активных узлов
    return branchStats
      .sort((a, b) => {
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        return b.activeNodes - a.activeNodes;
      })
      .slice(0, 3) // Топ-3 доминирующие ветки
      .map(stat => stat.branch);
  }, [tree]);

  // Текущие перекосы (ветки с очень низкой активностью или очень высокой)
  const imbalances = useMemo(() => {
    if (!tree?.branches || !tree?.nodes) return [];
    
    const branchStats = tree.branches.map((branch: any) => {
      const branchNodes = tree.nodes.filter((node: any) => node.branch_id === branch.branch_id);
      const activeNodes = branchNodes.filter((node: any) => 
        node.state === 'active' || node.state === 'unlocked' || node.state === 'integrated'
      );
      const percentage = branchNodes.length > 0 ? (activeNodes.length / branchNodes.length) * 100 : 0;
      
      return {
        branch,
        percentage,
        activeNodes: activeNodes.length,
        totalNodes: branchNodes.length,
      };
    });

    // Находим перекосы: очень низкая активность (<20%) или очень высокая (>80%)
    return branchStats
      .filter(stat => stat.percentage < 20 || stat.percentage > 80)
      .sort((a, b) => Math.abs(50 - a.percentage) - Math.abs(50 - b.percentage))
      .slice(0, 3); // Топ-3 перекоса
  }, [tree]);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка архитектуры..." />;
  }

  return (
    <main className="min-h-screen bg-bg-main p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-ui-text-main" id="page-title">
            Архитектура
          </h1>
          <p className="text-ui-text-muted">
            Экран идентичности и формы
          </p>
        </div>

        {/* Вкладки */}
        <div className="mb-6 border-b border-ui-border-soft">
          <nav className="flex gap-4" aria-label="Разделы архитектуры">
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'system'
                  ? 'border-system-focus text-system-focus'
                  : 'border-transparent text-ui-text-muted hover:text-ui-text-main'
              }`}
            >
              Кто я сейчас как система
            </button>
            <button
              onClick={() => setActiveTab('tree')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'tree'
                  ? 'border-system-focus text-system-focus'
                  : 'border-transparent text-ui-text-muted hover:text-ui-text-main'
              }`}
            >
              Карта способностей
            </button>
            <button
              onClick={() => setActiveTab('builds')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'builds'
                  ? 'border-system-focus text-system-focus'
                  : 'border-transparent text-ui-text-muted hover:text-ui-text-main'
              }`}
            >
              Активные стили
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-system-focus text-system-focus'
                  : 'border-transparent text-ui-text-muted hover:text-ui-text-main'
              }`}
            >
              История изменений
            </button>
          </nav>
        </div>

        {/* Контент вкладок */}
        <div>
          {activeTab === 'system' && (
            <SystemView 
              activeBuilds={activeBuilds}
              dominantBranches={dominantBranches}
              imbalances={imbalances}
              tree={tree}
              setActiveTab={setActiveTab}
              setSelectedBranch={setSelectedBranch}
            />
          )}
          {activeTab === 'tree' && (
            <TreeView 
              tree={tree}
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              nodeDescription={nodeDescription}
              setNodeDescription={setNodeDescription}
            />
          )}
          {activeTab === 'builds' && (
            <BuildsView 
              currentBuilds={currentBuilds}
              builds={buildsData?.builds || []}
              tree={tree}
            />
          )}
          {activeTab === 'history' && (
            <HistoryView />
          )}
        </div>
      </div>
    </main>
  );
}

// Главный экран "Кто я сейчас как система"
function SystemView({ 
  activeBuilds, 
  dominantBranches, 
  imbalances,
  tree,
  setActiveTab,
  setSelectedBranch
}: { 
  activeBuilds: BuildStatus[], 
  dominantBranches: any[],
  imbalances: any[],
  tree: SemanticTree | null,
  setActiveTab: (tab: ArchitectureTab) => void,
  setSelectedBranch: (branch: string | null) => void
}) {
  return (
    <div className="space-y-8">
      {/* Активные стили */}
      <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
        <h2 className="text-2xl font-bold mb-4 text-ui-text-main">Активные стили</h2>
        {activeBuilds.length === 0 ? (
          <p className="text-ui-text-muted">Нет активных стилей</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBuilds.map((buildStatus) => (
              <div
                key={buildStatus.build_id}
                className="bg-bg-secondary border border-ui-border-soft rounded-lg p-4 border-l-4"
                style={{ borderLeftColor: buildStatus.color || '#3A6F8F' }}
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{buildStatus.icon}</span>
                  <h3 className="font-semibold text-ui-text-main">{buildStatus.name}</h3>
                </div>
                <p className="text-sm text-ui-text-muted mb-2">{buildStatus.fantasy}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-ui-text-muted">Активация: {buildStatus.activation_percentage}%</span>
                  <div className="w-24 bg-bg-canvas rounded-full h-1.5 border border-ui-border-soft">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${buildStatus.activation_percentage}%`,
                        backgroundColor: buildStatus.color || '#3A6F8F',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Доминирующие ветки */}
      <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
        <h2 className="text-2xl font-bold mb-4 text-ui-text-main">Доминирующие ветки</h2>
        {dominantBranches.length === 0 ? (
          <p className="text-ui-text-muted">Недостаточно данных для определения доминирующих веток</p>
        ) : (
          <div className="space-y-4">
            {dominantBranches.map((branch: any) => {
              const branchNodes = tree?.nodes?.filter((n: any) => n.branch_id === branch.branch_id) || [];
              const activeNodes = branchNodes.filter((n: any) => 
                n.state === 'active' || n.state === 'unlocked' || n.state === 'integrated'
              );
              const percentage = branchNodes.length > 0 ? (activeNodes.length / branchNodes.length) * 100 : 0;
              
              return (
                <button
                  key={branch.branch_id}
                  onClick={() => {
                    setActiveTab('tree');
                    setSelectedBranch(branch.branch_id);
                  }}
                  className="block w-full text-left bg-bg-secondary border border-ui-border-soft rounded-lg p-4 hover:border-system-focus transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-ui-text-main">{branch.name || branch.branch_id}</h3>
                    <span className="text-sm text-system-focus">{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-ui-text-muted">
                    <span>{activeNodes.length} из {branchNodes.length} узлов активны</span>
                    <span>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Текущие перекосы */}
      <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
        <h2 className="text-2xl font-bold mb-4 text-ui-text-main">Текущие перекосы</h2>
        {imbalances.length === 0 ? (
          <p className="text-ui-text-muted">Перекосов не обнаружено. Развитие сбалансировано.</p>
        ) : (
          <div className="space-y-4">
            {imbalances.map((imbalance: any) => {
              const isLow = imbalance.percentage < 20;
              const isHigh = imbalance.percentage > 80;
              
              return (
                <button
                  key={imbalance.branch.branch_id}
                  onClick={() => {
                    setActiveTab('tree');
                    setSelectedBranch(imbalance.branch.branch_id);
                  }}
                  className={`block w-full text-left bg-bg-secondary border rounded-lg p-4 hover:border-opacity-70 transition-colors ${
                    isLow 
                      ? 'border-system-warning/50' 
                      : isHigh 
                      ? 'border-system-growth/50' 
                      : 'border-ui-border-soft'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-ui-text-main">
                      {imbalance.branch.name || imbalance.branch.branch_id}
                    </h3>
                    <span className={`text-sm ${
                      isLow ? 'text-system-warning' : isHigh ? 'text-system-growth' : 'text-ui-text-muted'
                    }`}>
                      {imbalance.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-ui-text-muted">
                    <span>
                      {isLow 
                        ? `Низкая активность: ${imbalance.activeNodes} из ${imbalance.totalNodes} узлов`
                        : isHigh
                        ? `Высокая активность: ${imbalance.activeNodes} из ${imbalance.totalNodes} узлов`
                        : `${imbalance.activeNodes} из ${imbalance.totalNodes} узлов`
                      }
                    </span>
                    <span>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// Компонент для отображения карты способностей
function TreeView({ 
  tree, 
  selectedBranch, 
  setSelectedBranch,
  selectedNode,
  setSelectedNode,
  nodeDescription,
  setNodeDescription
}: { 
  tree: SemanticTree | null,
  selectedBranch: string | null,
  setSelectedBranch: (branch: string | null) => void,
  selectedNode: string | null,
  setSelectedNode: (node: string | null) => void,
  nodeDescription: NodeDescription | null,
  setNodeDescription: (desc: NodeDescription | null) => void
}) {
  const [nodeDescriptions, setNodeDescriptions] = useState<Record<string, NodeDescription>>({});

  // Загружаем описания всех узлов при монтировании компонента
  useEffect(() => {
    getNodeDescriptions()
      .then((data) => {
        setNodeDescriptions(data.descriptions || {});
      })
      .catch((error) => {
        console.error('Failed to load node descriptions:', error);
      });
  }, []);

  if (!tree) {
    return (
      <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
        <p className="text-ui-text-muted">Дерево способностей не загружено</p>
      </div>
    );
  }

  const branches = tree.branches || [];
  const nodes = tree.nodes || [];
  const filteredNodes = selectedBranch
    ? nodes.filter((n: any) => n.branch_id === selectedBranch)
    : nodes;

  async function handleNodeClick(nodeId: string) {
    setSelectedNode(nodeId);
    try {
      const description = await getNodeDescription(nodeId);
      setNodeDescription(description);
    } catch (error) {
      setNodeDescription(null);
    }
  }

  // Генерация цвета для ветки на основе её ID и названия
  const getBranchColor = (branchId: string, branchName?: string): string => {
    // Специальные цвета для конкретных веток для лучшей различимости
    const specialBranches: Record<string, string> = {
      'subjectivity': '#4169E1', // Королевский синий для субъектности
      'устойчивость': '#00CED1', // Тёмно-бирюзовый для устойчивости
      'resilience': '#00CED1', // Тёмно-бирюзовый для устойчивости (англ)
      'субъектность': '#4169E1', // Королевский синий для субъектности (рус)
      'responsibility': '#FF6347', // Томатный для ответственности
      'ответственность': '#FF6347', // Томатный для ответственности (рус)
    };
    
    // Проверяем по названию ветки (если есть)
    if (branchName) {
      const lowerName = branchName.toLowerCase();
      for (const [key, color] of Object.entries(specialBranches)) {
        if (lowerName.includes(key.toLowerCase())) {
          return color;
        }
      }
    }
    
    // Проверяем по ID ветки
    const lowerId = branchId.toLowerCase();
    for (const [key, color] of Object.entries(specialBranches)) {
      if (lowerId.includes(key.toLowerCase())) {
        return color;
      }
    }
    
    // Палитра цветов для остальных веток - более контрастные и различимые цвета
    const colors = [
      '#3A6F8F', // Синий (глубокий)
      '#D2691E', // Шоколадный (коричневый)
      '#228B22', // Зелёный лесной
      '#8B008B', // Тёмно-фиолетовый
      '#DC143C', // Малиновый
      '#00CED1', // Тёмно-бирюзовый
      '#FF8C00', // Тёмно-оранжевый
      '#9370DB', // Средне-фиолетовый
      '#FFD700', // Золотой
      '#FF1493', // Глубокий розовый
      '#32CD32', // Лаймовый
      '#FF4500', // Оранжево-красный
      '#00FA9A', // Средне-весенний зелёный
      '#1E90FF', // Синий доджер
      '#FF69B4', // Горячий розовый
      '#20B2AA', // Бирюзовый
    ];
    
    // Простой хеш для получения индекса цвета
    let hash = 0;
    for (let i = 0; i < branchId.length; i++) {
      hash = ((hash << 5) - hash) + branchId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Получение уровня сложности узла (на основе xp_required или порядка в ветке)
  const getNodeLevel = (node: any, branchNodes: any[]): number => {
    // Сортируем узлы ветки по xp_required для определения уровня
    const sortedNodes = [...branchNodes].sort((a, b) => 
      (a.xp_required || 0) - (b.xp_required || 0)
    );
    const index = sortedNodes.findIndex((n: any) => n.node_id === node.node_id);
    return index >= 0 ? index + 1 : 0;
  };

  const getNodeStateColor = (state: string) => {
    switch (state) {
      case 'locked':
        return 'bg-bg-secondary border-ui-border-soft text-ui-text-muted';
      case 'available':
        return 'bg-bg-secondary border-system-warning/30 text-system-warning';
      case 'active':
        return 'bg-bg-secondary border-system-focus/50 text-system-focus';
      case 'unlocked':
        return 'bg-bg-secondary border-system-growth/30 text-system-growth';
      case 'integrated':
        return 'bg-bg-secondary border-system-stable/50 text-system-stable';
      default:
        return 'bg-bg-secondary border-ui-border-soft text-ui-text-muted';
    }
  };

  return (
    <div>
      {/* Ветки */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Ветки</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch: any) => {
            const branchColor = getBranchColor(branch.branch_id, branch.name);
            return (
              <button
                key={branch.branch_id}
                onClick={() =>
                  setSelectedBranch(selectedBranch === branch.branch_id ? null : branch.branch_id)
                }
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedBranch === branch.branch_id
                    ? 'bg-bg-panel shadow-active'
                    : 'bg-bg-panel hover:border-opacity-70'
                }`}
                style={{
                  borderColor: selectedBranch === branch.branch_id 
                    ? branchColor 
                    : branchColor + '80', // 80 = 50% opacity
                }}
              >
                <h3 className="font-semibold mb-1 text-ui-text-main">{branch.name}</h3>
                <p className="text-sm text-ui-text-muted">{branch.description}</p>
                <div className="mt-2 text-xs text-ui-text-muted">
                  Узлов: {nodes.filter((n: any) => n.branch_id === branch.branch_id).length}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Узлы */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-ui-text-main">
            Узлы {selectedBranch ? `(${branches.find((b: any) => b.branch_id === selectedBranch)?.name})` : '(Все)'}
            <span className="ml-2 text-sm text-ui-text-muted font-normal">
              ({filteredNodes.length} из {nodes.length})
            </span>
          </h2>
          {selectedBranch && (
            <button
              onClick={() => setSelectedBranch(null)}
              className="text-sm text-system-focus hover:text-system-focus/80 hover:underline transition-colors"
            >
              Показать все
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNodes.map((node: any) => {
            // Получаем цвет ветки для узла
            const branch = branches.find((b: any) => b.branch_id === node.branch_id);
            const branchColor = node.branch_id ? getBranchColor(node.branch_id, branch?.name) : '#3A6F8F';
            
            // Получаем уровень сложности узла
            const branchNodes = nodes.filter((n: any) => n.branch_id === node.branch_id);
            const nodeLevel = getNodeLevel(node, branchNodes);
            const maxLevel = branchNodes.length;
            
            // Вычисляем визуальный индикатор уровня (от 1 до 5 для визуализации)
            const levelIndicator = maxLevel > 0 ? Math.ceil((nodeLevel / maxLevel) * 5) : 1;
            
            return (
              <div
                key={node.node_id}
                onClick={() => handleNodeClick(node.node_id)}
                className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-4 border-l-4 cursor-pointer hover:shadow-active transition-shadow bg-panel-gradient"
                style={{
                  borderLeftColor: branchColor,
                  borderLeftWidth: '4px',
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-ui-text-main mb-1">
                      {nodeDescriptions[node.node_id]?.name || translateNodeName(node.name)}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-1 rounded border ${getNodeStateColor(node.state)}`}>
                      {node.state === 'locked' ? 'Заблокирован' : 
                       node.state === 'available' ? 'Доступен' : 
                       node.state === 'active' ? 'Активен' : 
                       node.state === 'unlocked' ? 'Разблокирован' : 
                       node.state === 'integrated' ? 'Интегрирован' : 'Неизвестно'}
                    </span>
                    {/* Индикатор уровня сложности под лейблом */}
                    {nodeLevel > 0 && (
                      <div className="flex gap-0.5" title={`Уровень ${nodeLevel} из ${maxLevel}`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              i < levelIndicator
                                ? 'bg-system-focus'
                                : 'bg-ui-border-soft'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {nodeLevel > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-ui-text-muted">
                      Уровень {nodeLevel}/{maxLevel}
                    </span>
                  </div>
                )}
                <p className="text-sm text-ui-text-muted mb-3">{node.description}</p>

                {node.xp_required > 0 && (
                  <div className="text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-ui-text-muted">Прогресс:</span>
                      <span className="font-semibold text-ui-text-main">
                        {Math.round((node.xp_current / node.xp_required) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-bg-canvas rounded-full h-2 border border-ui-border-soft">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((node.xp_current / node.xp_required) * 100, 100)}%`,
                          backgroundColor: branchColor,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Модальное окно с описанием узла */}
      {selectedNode && nodeDescription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-floating max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-ui-text-main">{translateNodeName(nodeDescription.name)}</h2>
                <button
                  onClick={() => {
                    setSelectedNode(null);
                    setNodeDescription(null);
                  }}
                  className="text-ui-text-muted hover:text-ui-text-main transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-ui-text-main">Полное описание</h3>
                  <p className="text-ui-text-muted">{nodeDescription.full_description}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-ui-text-main">Практическое значение</h3>
                  <p className="text-ui-text-muted">{nodeDescription.practical_meaning}</p>
                </div>

                {nodeDescription.examples && nodeDescription.examples.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-ui-text-main">Примеры применения</h3>
                    <ul className="list-disc list-inside space-y-1 text-ui-text-muted">
                      {nodeDescription.examples.map((example, idx) => (
                        <li key={idx}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2 text-ui-text-main">Уровни интеграции</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-bg-secondary border border-system-warning/30 rounded">
                      <p className="font-semibold text-sm mb-1 text-system-warning">Новичок:</p>
                      <p className="text-sm text-ui-text-muted">{nodeDescription.integration_levels.Novice}</p>
                    </div>
                    <div className="p-3 bg-bg-secondary border border-system-focus/30 rounded">
                      <p className="font-semibold text-sm mb-1 text-system-focus">Интегрированный:</p>
                      <p className="text-sm text-ui-text-muted">{nodeDescription.integration_levels.Integrated}</p>
                    </div>
                    <div className="p-3 bg-bg-secondary border border-system-growth/30 rounded">
                      <p className="font-semibold text-sm mb-1 text-system-growth">Воплощённый:</p>
                      <p className="text-sm text-ui-text-muted">{nodeDescription.integration_levels.Embodied}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Компонент для отображения активных стилей
function BuildsView({ 
  currentBuilds, 
  builds, 
  tree 
}: { 
  currentBuilds: BuildStatus[] | undefined,
  builds: any[],
  tree: SemanticTree | null
}) {
  const [selectedBuild, setSelectedBuild] = useState<string | null>(null);

  if (!currentBuilds || !builds) {
    return (
      <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
        <p className="text-ui-text-muted">Загрузка стилей...</p>
      </div>
    );
  }

  const activeBuilds = currentBuilds.filter((b) => b.is_active);

  function getNodeName(nodeId: string): string {
    if (!tree) return nodeId;
    const node = tree.nodes?.find((n: any) => n.node_id === nodeId);
    const nodeName = node?.name || nodeId;
    return translateNodeName(nodeName);
  }

  function getBranchName(branchId: string): string {
    if (!tree) return '';
    const branch = tree.branches?.find((b: any) => b.branch_id === branchId);
    return branch?.name || '';
  }

  function getNodeBranch(nodeId: string): string {
    if (!tree) return '';
    const node = tree.nodes?.find((n: any) => n.node_id === nodeId);
    if (node?.branch_id) {
      return getBranchName(node.branch_id);
    }
    return '';
  }

  return (
    <div>
      <p className="text-ui-text-muted mb-6">
        Стили — это временные идентичности лидера, которые активируются автоматически
        на основе ваших навыков и паттернов поведения. Зрелость проявляется в способности
        быть разным, входить и выходить из стилей осознанно.
      </p>

      {/* Текущие активные стили */}
      {activeBuilds.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-ui-text-main">Активные стили</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBuilds.map((buildStatus) => {
              const build = builds.find((b) => b.build_id === buildStatus.build_id);
              if (!build) return null;
              return (
                <div
                  key={buildStatus.build_id}
                  className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 border-l-4 bg-panel-gradient"
                  style={{ borderLeftColor: build.color || '#3A6F8F' }}
                >
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{build.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-ui-text-main">{build.name}</h3>
                      <p className="text-sm text-ui-text-muted">{build.fantasy}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-ui-text-muted">Активация:</span>
                      <span className="font-semibold text-ui-text-main">{buildStatus.activation_percentage}%</span>
                    </div>
                    <div className="w-full bg-bg-canvas rounded-full h-2 border border-ui-border-soft">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${buildStatus.activation_percentage}%`,
                          backgroundColor: build.color || '#3A6F8F',
                        }}
                      />
                    </div>
                  </div>
                  {buildStatus.matched_conditions.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-ui-text-muted mb-1">
                        Выполнено условий: {buildStatus.matched_conditions.length}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Все стили */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-ui-text-main">Все стили</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {builds.map((build) => {
            const status = currentBuilds.find((b) => b.build_id === build.build_id);
            const isActive = status?.is_active || false;
            const activationPercentage = status?.activation_percentage || 0;

            return (
              <div
                key={build.build_id}
                onClick={() => setSelectedBuild(selectedBuild === build.build_id ? null : build.build_id)}
                className={`bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 border-l-4 cursor-pointer hover:shadow-active transition-shadow bg-panel-gradient ${
                  isActive ? 'ring-2 ring-offset-2 ring-system-growth/30' : ''
                }`}
                style={{
                  borderLeftColor: build.color || '#3A6F8F',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{build.icon}</span>
                    <h3 className="text-lg font-semibold text-ui-text-main">{build.name}</h3>
                  </div>
                  {isActive && (
                    <span className="text-xs bg-bg-secondary border border-system-growth/30 text-system-growth px-2 py-1 rounded">
                      Активен
                    </span>
                  )}
                </div>

                <p className="text-sm text-ui-text-muted mb-2 italic">"{build.fantasy}"</p>
                <p className="text-sm text-ui-text-main mb-4">{build.description}</p>

                {status && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-ui-text-muted font-medium">Прогресс активации:</span>
                      <span className="text-xs font-semibold text-ui-text-main">{activationPercentage}%</span>
                    </div>
                    <div className="w-full bg-bg-canvas rounded-full h-2 border border-ui-border-soft">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${activationPercentage}%`,
                          backgroundColor: build.color,
                        }}
                      />
                    </div>
                  </div>
                )}

                {selectedBuild === build.build_id && (
                  <div className="mt-4 pt-4 border-t border-ui-border-soft space-y-4">
                    {build.entry_conditions.required_skills && build.entry_conditions.required_skills.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-ui-text-main">
                          Требуемые навыки для активации
                        </h4>
                        <p className="text-xs text-ui-text-muted mb-2">
                          Необходимо минимум {build.entry_conditions.min_skills_count || build.entry_conditions.required_skills.length} из {build.entry_conditions.required_skills.length} навыков:
                        </p>
                        <div className="space-y-1">
                          {build.entry_conditions.required_skills.map((skillId) => {
                            const nodeName = getNodeName(skillId);
                            const branchName = getNodeBranch(skillId);
                            const isActive = tree?.nodes?.find((n: any) => n.node_id === skillId)?.state === 'active' || 
                                           tree?.nodes?.find((n: any) => n.node_id === skillId)?.state === 'unlocked' ||
                                           tree?.nodes?.find((n: any) => n.node_id === skillId)?.state === 'integrated';
                            return (
                              <div 
                                key={skillId}
                                className={`text-xs p-2 rounded border ${
                                  isActive 
                                    ? 'bg-bg-secondary border-system-growth/30' 
                                    : 'bg-bg-secondary border-ui-border-soft'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={isActive ? 'text-system-growth font-medium' : 'text-ui-text-muted'}>
                                    {nodeName}
                                  </span>
                                  {isActive && (
                                    <span className="text-system-growth text-xs">✓</span>
                                  )}
                                </div>
                                {branchName && (
                                  <div className="text-xs text-ui-text-muted mt-1">
                                    Ветка: {branchName}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {build.related_nodes && build.related_nodes.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-ui-text-main">
                          Связанные навыки и перки
                        </h4>
                        <p className="text-xs text-ui-text-muted mb-2">
                          Дополнительно влияют на активацию стиля:
                        </p>
                        <div className="space-y-1">
                          {build.related_nodes
                            .filter(nodeId => !build.entry_conditions.required_skills?.includes(nodeId))
                            .map((nodeId) => {
                              const nodeName = getNodeName(nodeId);
                              const branchName = getNodeBranch(nodeId);
                              const isActive = tree?.nodes?.find((n: any) => n.node_id === nodeId)?.state === 'active' || 
                                             tree?.nodes?.find((n: any) => n.node_id === nodeId)?.state === 'unlocked' ||
                                             tree?.nodes?.find((n: any) => n.node_id === nodeId)?.state === 'integrated';
                              return (
                                <div 
                                  key={nodeId}
                                  className={`text-xs p-2 rounded border ${
                                    isActive 
                                      ? 'bg-bg-secondary border-system-focus/30' 
                                      : 'bg-bg-secondary border-ui-border-soft'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={isActive ? 'text-system-focus' : 'text-ui-text-muted'}>
                                      {nodeName}
                                    </span>
                                    {isActive && (
                                      <span className="text-system-focus text-xs">✓</span>
                                    )}
                                  </div>
                                  {branchName && (
                                    <div className="text-xs text-ui-text-muted mt-1">
                                      Ветка: {branchName}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {status && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-ui-text-main">Прогресс активации</h4>
                        <p className="text-xs text-ui-text-muted">
                          {status.matched_conditions && status.matched_conditions.length > 0
                            ? `Выполнено ${status.matched_conditions.length} условий`
                            : 'Условия не выполнены'}
                        </p>
                        {status.missing_conditions && status.missing_conditions.length > 0 && (
                          <p className="text-xs text-system-warning mt-1">
                            Осталось выполнить {status.missing_conditions.length} условий
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 text-center">
                  <button className="text-xs text-system-focus hover:text-system-focus/80 font-medium transition-colors">
                    {selectedBuild === build.build_id ? 'Скрыть прогресс' : 'Показать прогресс'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// История изменений
function HistoryView() {
  // Загружаем историю изменений из localStorage (как в дашборде)
  const [recentChanges, setRecentChanges] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedChanges = localStorage.getItem('node_changes');
      if (savedChanges) {
        try {
          const parsed = JSON.parse(savedChanges);
          if (Array.isArray(parsed)) {
            setRecentChanges(parsed);
          }
        } catch (e) {
          console.error('Failed to parse saved changes', e);
        }
      }
    }
  }, []);

  if (recentChanges.length === 0) {
    return (
      <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
        <p className="text-ui-text-muted">История изменений будет отображаться здесь</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentChanges.map((change, index) => (
        <div
          key={`${change.nodeId}-${index}`}
          className={`bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-4 border-l-4 ${
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
  );
}

