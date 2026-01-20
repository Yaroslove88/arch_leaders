'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { getSemanticTree, getCurrentBuild, getNodeDescription, getNodeDescriptions, getBuilds, SemanticTree, BuildStatus, NodeDescription, getQuests, getCases, getCaseProgress, Quest, InteractiveCase } from '../../lib/api';
import { translateNodeName, getNodeName } from '../../lib/node-translations';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useSearchParams, useRouter } from 'next/navigation';
import { BranchCard, NodeCard, NodeDetailCard, BuildCard } from '@/components/cards';
import { AddSituationModal, AddEvidenceModal } from '@/components/modals';
import { PillTabs, Surface, Progress, Badge, tokens } from '@leadership-architect/ui';
import { cn } from '@/lib/utils';
import { getBranchColorRaw } from '@/lib/ui-utils';

// Функция перевода названий узлов (вынесена на уровень модуля для использования в разных компонентах)

type ArchitectureTab = 'path' | 'tree' | 'builds';

function ArchitecturePageInner() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ArchitectureTab>('path');
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
        node.state === 'active' || node.state === 'available' || node.state === 'unlocked' || node.state === 'integrated'
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
    <main className="min-h-screen bg-obsidian-core p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-ash-light" id="page-title">
            Архитектура
          </h1>
          <p className="text-sm md:text-base text-ui-text-muted">
            Экран идентичности и формы
          </p>
        </div>

        {/* Вкладки */}
        <div className="mb-8">
          <PillTabs
            tabs={[
              { id: 'path', label: 'Мой путь' },
              { id: 'tree', label: 'Карта' },
              { id: 'builds', label: 'Стили' },
            ]}
            activeId={activeTab}
            onSelect={(id: string) => setActiveTab(id as ArchitectureTab)}
            scrollable
          />
        </div>

        {/* Контент вкладок */}
        <div>
          {activeTab === 'path' && (
            <PathView 
              activeBuilds={activeBuilds}
              dominantBranches={dominantBranches}
              imbalances={imbalances}
              tree={tree ?? null}
              setActiveTab={setActiveTab}
              setSelectedBranch={setSelectedBranch}
            />
          )}
          {activeTab === 'tree' && (
            <TreeViewWrapper 
              tree={tree ?? null}
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
              tree={tree ?? null}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default function ArchitecturePage() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen text="Загрузка архитектуры..." />}>
      <ArchitecturePageInner />
    </Suspense>
  );
}

// Главный экран "Мой путь" (переименовано из "Кто я сейчас как система")
function PathView({ 
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
  // Расчёт общего прогресса
  // Считаем только узлы с реальным прогрессом (active, unlocked, integrated)
  // available = доступен, но работа не начата = не считается как прогресс
  const totalNodes = tree?.nodes?.length || 0;
  const progressNodes = tree?.nodes?.filter((n: any) =>
    n.state === 'active' || n.state === 'unlocked' || n.state === 'integrated'
  ).length || 0;
  const availableNodes = tree?.nodes?.filter((n: any) =>
    n.state === 'available' || n.state === 'active' || n.state === 'unlocked' || n.state === 'integrated'
  ).length || 0;
  const overallProgress = totalNodes > 0 ? Math.round((progressNodes / totalNodes) * 100) : 0;

  // Расчёт прогресса по веткам
  // Прогресс = узлы с реальной работой (active, unlocked, integrated)
  // Доступность = все не-locked узлы (включая available)
  const branchProgress = (tree?.branches || []).map((branch: any) => {
    const branchNodes = tree?.nodes?.filter((n: any) => n.branch_id === branch.branch_id) || [];
    const progressBranchNodes = branchNodes.filter((n: any) =>
      n.state === 'active' || n.state === 'unlocked' || n.state === 'integrated'
    );
    const availableBranchNodes = branchNodes.filter((n: any) =>
      n.state === 'available' || n.state === 'active' || n.state === 'unlocked' || n.state === 'integrated'
    );
    const percentage = branchNodes.length > 0 ? Math.round((progressBranchNodes.length / branchNodes.length) * 100) : 0;

    return {
      branch,
      percentage,
      progressNodes: progressBranchNodes.length,
      availableNodes: availableBranchNodes.length,
      totalNodes: branchNodes.length,
      isImbalanced: percentage > 80 || percentage < 20,
      isGrowing: percentage > 30 && percentage < 80,
    };
  }).sort((a, b) => b.percentage - a.percentage);

  // Найти рекомендуемый фокус (ветка с низким прогрессом для баланса)
  const recommendedFocus = branchProgress.find(bp => bp.percentage < 30 && bp.totalNodes > 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Общий прогресс */}
      <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🏆</span>
          <h2 className="text-lg font-semibold text-ash-light">Общий прогресс</h2>
        </div>
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-ui-text-muted">{availableNodes} из {totalNodes} способностей доступно</span>
            <span className="text-strategic-blue font-medium">{overallProgress}%</span>
          </div>
          <div className="w-full bg-obsidian-core rounded-full h-3">
            <div 
              className="bg-strategic-blue h-3 rounded-full transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </section>

      {/* Баланс веток */}
      <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📊</span>
          <h2 className="text-lg font-semibold text-ash-light">Баланс веток</h2>
        </div>
        <div className="space-y-3">
          {branchProgress.map((bp) => (
            <button
              key={bp.branch.branch_id}
              onClick={() => {
                setActiveTab('tree');
                setSelectedBranch(bp.branch.branch_id);
              }}
              className="w-full text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-32 text-sm text-ash-light truncate group-hover:text-strategic-blue transition-colors">
                  {bp.branch.name || bp.branch.branch_id}
                </div>
                <div className="flex-1 bg-obsidian-core rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      bp.percentage > 80 ? 'bg-catalyst-gold' :
                      bp.percentage < 20 ? 'bg-ui-border-soft' :
                      'bg-strategic-blue'
                    }`}
                    style={{ width: `${bp.percentage}%` }}
                  />
                </div>
                <div className="w-12 text-right text-sm text-ui-text-muted">
                  {bp.percentage}%
                </div>
                <div className="w-16 text-right">
                  {bp.percentage > 80 && <span className="text-xs text-catalyst-gold">⚠️ Перекос</span>}
                  {bp.isGrowing && <span className="text-xs text-sage-green">📈 Растёт</span>}
                  {bp.percentage < 20 && bp.totalNodes > 0 && <span className="text-xs text-strategic-blue">⚡ Фокус</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Текущий фокус */}
      {recommendedFocus && (
        <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🎯</span>
            <h2 className="text-lg font-semibold text-ash-light">Текущий фокус</h2>
          </div>
          <div className="bg-obsidian-core rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🌱</span>
              <h3 className="font-medium text-ash-light">
                {recommendedFocus.branch.name || recommendedFocus.branch.branch_id}
              </h3>
            </div>
            <p className="text-sm text-ui-text-muted mb-3">
              Рекомендуется для баланса развития
            </p>
            <button
              onClick={() => {
                setActiveTab('tree');
                setSelectedBranch(recommendedFocus.branch.branch_id);
              }}
              className="text-sm text-strategic-blue hover:underline"
            >
              Начать развитие →
            </button>
          </div>
        </section>
      )}

      {/* Активные стили (компактно) */}
      {activeBuilds.length > 0 && (
        <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎭</span>
              <h2 className="text-lg font-semibold text-ash-light">Активные стили</h2>
            </div>
            <button
              onClick={() => setActiveTab('builds')}
              className="text-sm text-strategic-blue hover:underline"
            >
              Все стили →
            </button>
          </div>
          <div className="flex gap-3 flex-wrap">
            {activeBuilds.slice(0, 3).map((buildStatus) => (
              <div
                key={buildStatus.build_id}
                className="flex items-center gap-2 px-3 py-2 bg-obsidian-core rounded-lg"
                style={{ borderLeft: `3px solid ${buildStatus.color || tokens.colors.nodeStates.available.border}` }}
              >
                <span className="text-lg">{buildStatus.icon}</span>
                <span className="text-sm text-ash-light">{buildStatus.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Wrapper для TreeView с загрузкой квестов и кейсов
function TreeViewWrapper({
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
  const { data: questsData } = useQuery({
    queryKey: ['quests'],
    queryFn: () => getQuests(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: casesData } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
    staleTime: 1000 * 60 * 5,
  });

  const { data: caseProgressData } = useQuery({
    queryKey: ['caseProgress'],
    queryFn: getCaseProgress,
    staleTime: 1000 * 60 * 2,
  });

  const router = useRouter();

  const branches = tree?.branches || [];
  const nodes = tree?.nodes || [];

  // Расчёт зависимостей
  const dependencyMap = useMemo(() => {
    if (!nodes) return { unlocks: {}, requires: {} };
    const unlocks: Record<string, string[]> = {};
    const requires: Record<string, string[]> = {};
    
    nodes.forEach(node => {
      const prereqs = node.prerequisites || [];
      requires[node.node_id] = prereqs;
      prereqs.forEach((prereqId: string) => {
        if (!unlocks[prereqId]) unlocks[prereqId] = [];
        unlocks[prereqId].push(node.node_id);
      });
    });
    return { unlocks, requires };
  }, [nodes]);

  const selectedBranchData = useMemo(() => 
    branches.find((b: any) => b.branch_id === selectedBranch),
    [branches, selectedBranch]
  );

  const nodesGridRef = useRef<HTMLDivElement>(null);

  const handleBranchSelect = (id: string | null) => {
    setSelectedBranch(id);
    setSelectedNode(null); // Сброс выделения узла при смене ветки
    setNodeDescription(null);
    // Авто-скролл на мобильных
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && nodesGridRef.current) {
      nodesGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar: Branches */}
      <aside className="w-full lg:w-80 flex-shrink-0">
        <div className="sticky top-8 space-y-6">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-ui-text-dim">Ветки развития</h2>
            <div className="space-y-2">
              <button
                onClick={() => handleBranchSelect(null)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group",
                  !selectedBranch 
                    ? "bg-strategic-blue/10 border-strategic-blue/50 text-ash-light" 
                    : "bg-graphite-structure border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong hover:text-ash-light"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🗺️</span>
                  <span className="font-semibold text-sm">Все способности</span>
                </div>
                {!selectedBranch && <div className="w-1.5 h-1.5 rounded-full bg-strategic-blue shadow-[0_0_8px_rgba(58,111,143,0.8)]" />}
              </button>

              {branches.map((branch: any) => {
                const isSelected = selectedBranch === branch.branch_id;
                const branchNodes = nodes.filter((n: any) => n.branch_id === branch.branch_id);
                const activeNodes = branchNodes.filter((n: any) => 
                  ['active', 'unlocked', 'integrated'].includes(n.state)
                ).length;
                const percentage = branchNodes.length > 0 ? Math.round((activeNodes / branchNodes.length) * 100) : 0;
                
                return (
                  <button
                    key={branch.branch_id}
                    onClick={() => handleBranchSelect(isSelected ? null : branch.branch_id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all group",
                      isSelected 
                        ? "bg-strategic-blue/10 border-strategic-blue/50 text-ash-light" 
                        : "bg-graphite-structure border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong hover:text-ash-light"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg flex-shrink-0">🌿</span>
                        <span className="font-semibold text-sm truncate">{branch.name || branch.branch_id}</span>
                      </div>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-strategic-blue shadow-[0_0_8px_rgba(58,111,143,0.8)]" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Progress value={percentage} tone={percentage > 80 ? 'warning' : 'focus'} className="h-1" />
                      </div>
                      <span className="text-[10px] font-medium opacity-60">{percentage}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0" ref={nodesGridRef}>
        <div className="mb-8 p-6 bg-strategic-blue/5 border border-strategic-blue/10 rounded-2xl">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-strategic-blue/10 flex items-center justify-center text-2xl shadow-inner">
              {selectedBranch ? '🌿' : '🗺️'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ash-light flex items-center gap-3">
                {selectedBranch ? selectedBranchData?.name : 'Все способности'}
                <Badge tone="neutral" soft className="text-[10px] px-1.5 py-0 opacity-60">
                  {selectedBranch ? nodes.filter((n: any) => n.branch_id === selectedBranch).length : nodes.length}
                </Badge>
              </h2>
              <p className="text-xs text-ui-text-dim uppercase tracking-widest font-bold">
                {selectedBranch ? 'Ветка развития' : 'Полная карта архитектуры'}
              </p>
            </div>
          </div>
          {selectedBranch && selectedBranchData?.description && (
            <div className="mt-4 pt-4 border-t border-ui-border-soft/50">
              <p className="text-sm text-ash-light leading-relaxed">
                <span className="text-strategic-blue font-bold mr-2">Смысл ветки:</span>
                {selectedBranchData.description}
              </p>
            </div>
          )}
        </div>

        <TreeView
          tree={tree}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          nodeDescription={nodeDescription}
          setNodeDescription={setNodeDescription}
          quests={questsData?.quests || []}
          cases={casesData?.cases || []}
          caseProgress={caseProgressData || { solvedCases: [], nodeProgress: {} }}
          dependencyMap={dependencyMap}
        />
      </div>

      {/* Модальное окно с описанием узла */}
      {selectedNode && nodeDescription && (() => {
        const node = nodes.find((n: any) => n.node_id === selectedNode);
        const branch = node ? branches.find((b: any) => b.branch_id === node.branch_id) : null;
        const branchColor = node?.branch_id ? getBranchColorRaw(node.branch_id) : tokens.colors.nodeStates.available.border;
        const branchNodes = node ? nodes.filter((n: any) => n.branch_id === node.branch_id) : [];
        const nodeLevel = node ? (([...branchNodes].sort((a, b) => (a.xp_required || 0) - (b.xp_required || 0)).findIndex((n: any) => n.node_id === node.node_id) + 1) || 0) : 0;
        const nodeQuests = (questsData?.quests || []).filter((q: any) => q.linked_nodes?.includes(selectedNode));
        const nodeCases = (casesData?.cases || []).filter((c: any) => c.node_id === selectedNode);
        
        let prerequisiteIds: string[] = [];
        if (node?.prerequisites && Array.isArray(node.prerequisites)) {
          prerequisiteIds = node.prerequisites;
        } else if (node?.unlock_conditions?.type === 'prerequisite' && node?.unlock_conditions?.required_nodes) {
          prerequisiteIds = Array.isArray(node.unlock_conditions.required_nodes) ? node.unlock_conditions.required_nodes : [];
        }
        
        const requirements = prerequisiteIds.map((prereqId: string) => {
          const prereqNode = tree?.nodes?.find((n: any) => n.node_id === prereqId);
          const prereqName = prereqNode ? translateNodeName(prereqNode.name) : getNodeName(prereqId);
          return `${prereqNode?.state !== 'locked' ? '✅' : '⚪'} Разблокировать "${prereqName}"`;
        });
        
        if (node?.state === 'locked' && requirements.length === 0) {
          requirements.push(node?.xp_required > 0 ? `Набрать ${node.xp_required} XP` : 'Выполнить условия');
        }
        
        return (
          <div className="fixed inset-0 bg-obsidian-core/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="max-w-4xl w-full my-auto">
              <NodeDetailCard
                nodeId={selectedNode}
                name={translateNodeName(nodeDescription.name)}
                description={nodeDescription.full_description}
                branchName={branch?.name || ''}
                branchColor={branchColor}
                level={nodeLevel}
                maxLevel={branchNodes.length}
                currentXP={node?.xp_current || 0}
                requiredXP={node?.xp_required > 0 ? node.xp_required : 100}
                state={node?.state || 'locked'}
                requirements={requirements}
                quests={nodeQuests.map((q: any) => ({
                  id: q.id,
                  title: q.title,
                  status: q.status === 'done' ? 'completed' : q.status === 'active' ? 'in_progress' : 'available',
                }))}
                cases={nodeCases.map((c: any) => ({
                  id: c.id,
                  title: c.title,
                  status: (caseProgressData?.solvedCases || []).includes(c.id) ? 'completed' : 'available',
                }))}
                onQuestClick={(id) => router.push(`/quests/${id}`)}
                onCaseClick={(id) => router.push(`/cases/${id}`)}
                onClose={() => {
                  setNodeDescription(null);
                  // Не сбрасываем selectedNode, чтобы осталась подсветка в фоне
                }}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Компонент для отображения сетки карточек
function TreeView({ 
  tree, 
  selectedBranch, 
  setSelectedBranch,
  selectedNode,
  setSelectedNode,
  nodeDescription,
  setNodeDescription,
  quests = [],
  cases = [],
  caseProgress = { solvedCases: [], nodeProgress: {} },
  dependencyMap = { unlocks: {}, requires: {} },
}: { 
  tree: SemanticTree | null,
  selectedBranch: string | null,
  setSelectedBranch: (branch: string | null) => void,
  selectedNode: string | null,
  setSelectedNode: (node: string | null) => void,
  nodeDescription: NodeDescription | null,
  setNodeDescription: (desc: NodeDescription | null) => void,
  quests?: Quest[],
  cases?: InteractiveCase[],
  caseProgress?: { solvedCases: string[], nodeProgress: Record<string, { solved: string[], progress: number }> },
  dependencyMap?: { unlocks: Record<string, string[]>, requires: Record<string, string[]> },
}) {
  const [nodeDescriptions, setNodeDescriptions] = useState<Record<string, NodeDescription>>({});
  
  useEffect(() => {
    getNodeDescriptions()
      .then((data) => {
        setNodeDescriptions(data.descriptions || {});
      })
      .catch((error) => {
        // Тихая обработка ошибки - API может быть недоступен
        console.warn('Failed to load node descriptions:', error);
        setNodeDescriptions({});
      });
  }, []);

  const branches = tree?.branches || [];
  const nodes = tree?.nodes || [];
  const filteredNodes = selectedBranch
    ? nodes.filter((n: any) => n.branch_id === selectedBranch)
    : nodes;

  // Узлы для подсветки связей
  const highlightedContext = useMemo(() => {
    if (!selectedNode) return null;
    return {
      requires: dependencyMap.requires[selectedNode] || [],
      unlocks: dependencyMap.unlocks[selectedNode] || [],
    };
  }, [selectedNode, dependencyMap]);

  const getNodeLevel = (node: any, branchNodes: any[]): number => {
    const sortedNodes = [...branchNodes].sort((a, b) => (a.xp_required || 0) - (b.xp_required || 0));
    const index = sortedNodes.findIndex((n: any) => n.node_id === node.node_id);
    return index >= 0 ? index + 1 : 0;
  };

  const getNodeQuestCaseStats = (nodeId: string) => {
    const nodeQuests = quests.filter((q) => q.linked_nodes?.includes(nodeId));
    const nodeCases = cases.filter((c) => c.node_id === nodeId);
    return {
      questsTotal: nodeQuests.length,
      casesTotal: nodeCases.length,
    };
  };

  async function handleNodeClick(nodeId: string) {
    // Устанавливаем подсветку
    setSelectedNode(nodeId);
    
    // Загружаем данные для модального окна
    try {
      const description = await getNodeDescription(nodeId);
      setNodeDescription(description);
    } catch (error) {
      console.error('Failed to load node description:', error);
      setNodeDescription(null);
    }
  }

  if (!tree) return null;

  return (
    <div className="space-y-4">
      {selectedNode && (
        <div className="flex justify-end">
          <button 
            onClick={() => {
              setSelectedNode(null);
              setNodeDescription(null);
            }}
            aria-label="Сбросить выделение узла"
            className="text-[10px] uppercase tracking-widest font-bold text-strategic-blue hover:text-ash-light transition-colors flex items-center gap-1.5 min-h-[44px] px-2"
          >
            <span aria-hidden="true">✕</span> Сбросить выделение
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filteredNodes.map((node: any) => {
        const branch = branches.find((b: any) => b.branch_id === node.branch_id);
        const branchColor = node.branch_id ? getBranchColorRaw(node.branch_id) : tokens.colors.nodeStates.available.border;
        const branchNodes = nodes.filter((n: any) => n.branch_id === node.branch_id);
        const nodeLevel = getNodeLevel(node, branchNodes);
        const stats = getNodeQuestCaseStats(node.node_id);
        
        const isSelected = selectedNode === node.node_id;
        const isRequired = highlightedContext?.requires.includes(node.node_id);
        const isUnlocked = highlightedContext?.unlocks.includes(node.node_id);
        const isDimmed = !!selectedNode && !isSelected && !isRequired && !isUnlocked;
        
        return (
          <NodeCard
            key={node.node_id}
            nodeId={node.node_id}
            name={nodeDescriptions[node.node_id]?.name || translateNodeName(node.name)}
            branchName={branch?.name}
            level={nodeLevel}
            maxLevel={branchNodes.length}
            progress={Math.min(100, Math.round((node.xp_current / (node.xp_required || 100)) * 100))}
            questsCount={stats.questsTotal}
            casesCount={stats.casesTotal}
            state={node.state}
            branchColor={branchColor}
            onClick={() => handleNodeClick(node.node_id)}
            unlocksCount={(dependencyMap.unlocks[node.node_id] || []).length}
            className={cn(
              "transition-all duration-300",
              isSelected && "ring-2 ring-strategic-blue ring-offset-4 ring-offset-obsidian-core scale-[1.02]",
              isRequired && "border-tension-red/60 shadow-[0_0_15px_rgba(235,87,87,0.2)]",
              isUnlocked && "border-strategic-blue/60 shadow-[0_0_15px_rgba(58,111,143,0.2)]",
              isDimmed && "opacity-30 grayscale-[0.5] scale-[0.98]"
            )}
          />
        );
      })}
      </div>
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
      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
        <p className="text-ui-text-muted">Загрузка стилей...</p>
      </div>
    );
  }

  const activeBuilds = currentBuilds.filter((b) => b.is_active);

  return (
    <div>
      <p className="text-ui-text-muted mb-6">
        Стили — это временные идентичности лидера, которые активируются автоматически
        на основе ваших навыков и паттернов поведения. Зрелость проявляется в способности
        быть разным, входить и выходить из стилей осознанно.
      </p>

      {/* Все стили */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-ash-light">Все стили</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {builds.map((build) => {
            const status = currentBuilds.find((b) => b.build_id === build.build_id);
            const isActive = status?.is_active || false;
            const activationPercentage = status?.activation_percentage || 0;
            
            // Формируем требования (обязательные узлы)
            const requirements = (build.entry_conditions?.required_nodes || []).map((nodeId: string) => {
              const node = tree?.nodes?.find((n: any) => n.node_id === nodeId);
              const isNodeActive = node?.state === 'active' || node?.state === 'unlocked' || node?.state === 'integrated';
              return {
                nodeId: nodeId,
                nodeName: translateNodeName(node?.name || getNodeName(nodeId)),
                requiredLevel: 1,
                currentLevel: isNodeActive ? 1 : 0,
                isCompleted: isNodeActive,
              };
            });
            
            // Опциональные узлы
            const relatedNodes = (build.entry_conditions?.optional_nodes || []).map((nodeId: string) => {
              const node = tree?.nodes?.find((n: any) => n.node_id === nodeId);
              return {
                id: nodeId,
                name: translateNodeName(node?.name || getNodeName(nodeId)),
              };
            });

            return (
              <BuildCard
                key={build.build_id}
                buildId={build.build_id}
                name={build.name}
                fantasy={build.fantasy}
                description={build.description}
                icon={build.icon}
                status={isActive ? 'active' : 'available'}
                activationProgress={activationPercentage}
                requirements={requirements}
                relatedNodes={relatedNodes}
                variant={selectedBuild === build.build_id ? 'detailed' : 'compact'}
                onClick={() => setSelectedBuild(selectedBuild === build.build_id ? null : build.build_id)}
                onClose={selectedBuild === build.build_id ? () => setSelectedBuild(null) : undefined}
              />
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
      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
        <p className="text-ui-text-muted">История изменений будет отображаться здесь</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentChanges.map((change, index) => (
        <div
          key={`${change.nodeId}-${index}`}
          className={`bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-4 border-l-4 ${
            change.changeType === 'available' ? 'border-system-warning' :
            change.changeType === 'integrated' ? 'border-system-growth' :
            'border-ui-border-soft'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ash-light">
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
              className="text-xs text-strategic-blue hover:text-strategic-blue/80 hover:underline ml-4"
            >
              Открыть →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

