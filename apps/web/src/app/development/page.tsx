'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getSemanticTree, SemanticTree, getQuests, Quest, getCases, InteractiveCase, getCaseProgress, CaseProgress, getNodeDescriptions } from '../../lib/api';
import { getNodeName } from '../../lib/node-translations';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PillTabs } from '@leadership-architect/ui';

type DevelopmentTab = 'overview' | 'branches' | 'abilities';

interface NodeDevelopmentProgress {
  nodeId: string;
  nodeName: string;
  branchId?: string;
  branchName?: string;
  questsCompleted: number;
  questsTotal: number;
  casesCompleted: number;
  casesTotal: number;
  overallProgress: number; // 0-100
  status: 'locked' | 'in_progress' | 'mastered';
  state: string;
}

export default function DevelopmentPage() {
  const [activeTab, setActiveTab] = useState<DevelopmentTab>('overview');

  const { data: tree, isLoading: treeLoading } = useQuery({
    queryKey: ['tree', 'semantic'],
    queryFn: getSemanticTree,
  });

  const { data: questsData, isLoading: questsLoading } = useQuery({
    queryKey: ['quests'],
    queryFn: () => getQuests(),
  });

  const { data: casesData, isLoading: casesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
  });

  const { data: caseProgressData, isLoading: progressLoading } = useQuery({
    queryKey: ['caseProgress'],
    queryFn: getCaseProgress,
  });

  const { data: nodeDescriptionsData } = useQuery({
    queryKey: ['nodeDescriptions'],
    queryFn: getNodeDescriptions,
  });

  const isLoading = treeLoading || questsLoading || casesLoading || progressLoading;
  const quests = questsData?.quests || [];
  const cases = casesData?.cases || [];
  const caseProgress = caseProgressData || { solvedCases: [], nodeProgress: {} };
  const nodeDescriptions = nodeDescriptionsData?.descriptions || {};

  // Рассчитываем прогресс по узлам
  const nodeProgressMap = useMemo(() => {
    if (!tree?.nodes) return new Map<string, NodeDevelopmentProgress>();

    const map = new Map<string, NodeDevelopmentProgress>();

    tree.nodes.forEach((node: any) => {
      const nodeId = node.node_id;
      const branchId = node.branch_id;
      const branch = tree.branches?.find((b: any) => b.branch_id === branchId);
      
      // Подсчет квестов
      const nodeQuests = quests.filter((q: Quest) => q.linked_nodes?.includes(nodeId));
      const completedQuests = nodeQuests.filter((q: Quest) => q.status === 'done');
      
      // Подсчет кейсов
      const nodeCases = cases.filter((c: InteractiveCase) => c.node_id === nodeId);
      const completedCases = caseProgress.nodeProgress[nodeId]?.solved?.length || 0;
      
      // Расчет общего прогресса
      const questProgress = nodeQuests.length > 0 ? (completedQuests.length / nodeQuests.length) * 100 : 0;
      const caseProgressPercent = nodeCases.length > 0 ? (completedCases / nodeCases.length) * 100 : 0;
      const overallProgress = (questProgress * 0.6 + caseProgressPercent * 0.4); // Квесты важнее
      
      // Определяем статус на основе state узла (источник истины)
      let status: 'locked' | 'in_progress' | 'mastered' = 'locked';
      if (node.state === 'locked') {
        status = 'locked';
      } else if (node.state === 'integrated' || (node.state !== 'locked' && overallProgress >= 80)) {
        status = 'mastered';
      } else if (node.state === 'active' || node.state === 'available' || node.state === 'unlocked') {
        status = 'in_progress';
      } else {
        status = 'locked';
      }

      map.set(nodeId, {
        nodeId,
        nodeName: getNodeName(nodeId, nodeDescriptions),
        branchId,
        branchName: branch?.name || branchId,
        questsCompleted: completedQuests.length,
        questsTotal: nodeQuests.length,
        casesCompleted: completedCases,
        casesTotal: nodeCases.length,
        overallProgress: Math.round(overallProgress),
        status,
        state: node.state,
      });
    });

    return map;
  }, [tree, quests, cases, caseProgress, nodeDescriptions]);

  // Общий прогресс
  // Прогресс считается по узлам с реальной работой (active, unlocked, integrated)
  // available = доступен, но работа не начата = не считается как прогресс
  const overallStats = useMemo(() => {
    const nodes = Array.from(nodeProgressMap.values());
    const totalNodes = nodes.length;
    // Доступные узлы (все не-locked)
    const availableNodes = nodes.filter(n => n.status !== 'locked').length;
    // Узлы с реальным прогрессом (mastered или in_progress с state !== 'available')
    const progressNodes = nodes.filter(n =>
      n.status === 'mastered' ||
      (n.status === 'in_progress' && n.state !== 'available')
    ).length;
    const masteredNodes = nodes.filter(n => n.status === 'mastered').length;
    const totalProgress = totalNodes > 0 ? Math.round((progressNodes / totalNodes) * 100) : 0;
    
    const totalQuests = quests.length;
    const completedQuests = quests.filter((q: Quest) => q.status === 'done').length;
    const activeQuests = quests.filter((q: Quest) => q.status === 'active').length;
    
    const totalCases = cases.length;
    const completedCases = caseProgress.solvedCases.length;

    return {
      totalNodes,
      availableNodes,
      progressNodes,
      masteredNodes,
      totalProgress,
      totalQuests,
      completedQuests,
      activeQuests,
      totalCases,
      completedCases,
    };
  }, [nodeProgressMap, quests, cases, caseProgress]);

  // Прогресс по веткам
  const branchProgress = useMemo(() => {
    if (!tree?.branches || !tree?.nodes) return [];

    const result = tree.branches.map((branch: any) => {
      // Узлы ветки из дерева
      const branchNodesFromTree = tree.nodes.filter(
        (node: any) => node.branch_id === branch.branch_id
      );
      // Узлы с реальным прогрессом (active, unlocked, integrated)
      // available НЕ считается прогрессом - это только "доступно для начала работы"
      const progressNodesFromTree = branchNodesFromTree.filter(
        (node: any) =>
          node.state === 'active' ||
          node.state === 'unlocked' ||
          node.state === 'integrated'
      );
      // Доступные узлы (все не-locked)
      const availableNodesFromTree = branchNodesFromTree.filter(
        (node: any) =>
          node.state === 'available' ||
          node.state === 'active' ||
          node.state === 'unlocked' ||
          node.state === 'integrated'
      );

      // Используем nodeProgressMap для детальной информации о узлах
      const branchNodes = Array.from(nodeProgressMap.values()).filter(
        n => n.branchId === branch.branch_id
      );

      const totalNodes = branchNodesFromTree.length;
      const progressNodes = progressNodesFromTree.length;
      const availableNodes = availableNodesFromTree.length;
      const masteredNodes = branchNodes.filter(n => n.status === 'mastered').length;
      const progress = totalNodes > 0 ? Math.round((progressNodes / totalNodes) * 100) : 0;

      return {
        branchId: branch.branch_id,
        branchName: branch.name,
        description: branch.description,
        totalNodes,
        progressNodes,
        availableNodes,
        masteredNodes,
        progress,
        nodes: branchNodes,
      };
    });
    
    return result;
  }, [tree, nodeProgressMap]);

  // Текущий фокус (узлы с прогрессом но не завершенные)
  const currentFocus = useMemo(() => {
    return Array.from(nodeProgressMap.values())
      .filter(n => n.status === 'in_progress' && n.state !== 'locked')
      .sort((a, b) => b.overallProgress - a.overallProgress)
      .slice(0, 4);
  }, [nodeProgressMap]);

  // Рекомендации следующих шагов
  const nextSteps = useMemo(() => {
    const steps: string[] = [];
    
    // Активные квесты
    const activeQuestsList = quests.filter((q: Quest) => q.status === 'active');
    if (activeQuestsList.length > 0) {
      steps.push(`Завершите активный квест «${activeQuestsList[0].title}»`);
    }
    
    // Узлы без завершенных квестов но с доступными
    const nodesNeedingQuests = Array.from(nodeProgressMap.values())
      .filter(n => n.state !== 'locked' && n.questsCompleted === 0 && n.questsTotal > 0);
    if (nodesNeedingQuests.length > 0) {
      steps.push(`Начните квест на узле «${nodesNeedingQuests[0].nodeName}» для открытия кейсов`);
    }
    
    // Узлы с завершенными квестами но без решенных кейсов
    const nodesNeedingCases = Array.from(nodeProgressMap.values())
      .filter(n => n.questsCompleted > 0 && n.casesCompleted === 0 && n.casesTotal > 0);
    if (nodesNeedingCases.length > 0) {
      steps.push(`Решите первый кейс на узле «${nodesNeedingCases[0].nodeName}»`);
    }

    return steps.slice(0, 3);
  }, [quests, nodeProgressMap]);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка прогресса..." />;
  }

  return (
    <main className="min-h-screen bg-obsidian-core p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-ash-light">
            Мой путь развития
          </h1>
          <p className="text-ui-text-muted">
            Отслеживайте прогресс через квесты и кейсы
          </p>
        </div>

        {/* Вкладки */}
        <div className="mb-8">
          <PillTabs
            tabs={[
              { id: 'overview', label: 'Обзор' },
              { id: 'branches', label: 'По веткам' },
              { id: 'abilities', label: 'По способностям' },
            ]}
            activeId={activeTab}
            onSelect={(id: string) => setActiveTab(id as DevelopmentTab)}
            ariaLabel="Разделы развития"
          />
        </div>

        {/* Контент */}
        {activeTab === 'overview' && (
          <OverviewTab 
            stats={overallStats}
            currentFocus={currentFocus}
            nextSteps={nextSteps}
          />
        )}
        {activeTab === 'branches' && (
          <BranchesTab branches={branchProgress} />
        )}
        {activeTab === 'abilities' && (
          <AbilitiesTab nodes={Array.from(nodeProgressMap.values())} />
        )}
      </div>
    </main>
  );
}

function OverviewTab({ 
  stats, 
  currentFocus, 
  nextSteps 
}: { 
  stats: {
    totalNodes: number;
    availableNodes: number;
    progressNodes: number;
    masteredNodes: number;
    totalProgress: number;
    totalQuests: number;
    completedQuests: number;
    activeQuests: number;
    totalCases: number;
    completedCases: number;
  };
  currentFocus: NodeDevelopmentProgress[];
  nextSteps: string[];
}) {
  return (
    <div className="space-y-8">
      {/* Общий прогресс */}
      <section className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
        <h2 className="text-xl font-semibold mb-4 text-ash-light">Общий прогресс</h2>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-ui-text-muted">Развитие способностей</span>
            <span className="font-semibold text-ash-light">{stats.totalProgress}%</span>
          </div>
          <div className="w-full bg-obsidian-core rounded-full h-3 border border-ui-border-soft">
            <div
              className="bg-system-focus h-3 rounded-full transition-all"
              style={{ width: `${stats.totalProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-ui-text-muted mt-1">
            <span>{stats.availableNodes} из {stats.totalNodes} узлов доступно</span>
            <span>{stats.progressNodes} в работе, {stats.masteredNodes} освоено</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-obsidian-core border border-ui-border-soft rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-strategic-blue">{stats.completedQuests}</div>
            <div className="text-xs text-ui-text-muted">Квестов завершено</div>
            <div className="text-xs text-sage-green mt-1">{stats.activeQuests} активных</div>
          </div>
          <div className="bg-obsidian-core border border-ui-border-soft rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-sage-green">{stats.completedCases}</div>
            <div className="text-xs text-ui-text-muted">Кейсов решено</div>
            <div className="text-xs text-ui-text-muted mt-1">из {stats.totalCases}</div>
          </div>
          <div className="bg-obsidian-core border border-ui-border-soft rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-system-warning">{stats.masteredNodes}</div>
            <div className="text-xs text-ui-text-muted">Способностей освоено</div>
            <div className="text-xs text-ui-text-muted mt-1">из {stats.totalNodes}</div>
          </div>
        </div>
      </section>

      {/* Текущий фокус */}
      <section className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
        <h2 className="text-xl font-semibold mb-4 text-ash-light">Текущий фокус</h2>
        {currentFocus.length === 0 ? (
          <p className="text-ui-text-muted">Начните с выполнения квестов, чтобы открыть способности</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentFocus.map((node) => (
              <NodeProgressCard key={node.nodeId} node={node} />
            ))}
          </div>
        )}
      </section>

      {/* Следующие шаги */}
      <section className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
        <h2 className="text-xl font-semibold mb-4 text-ash-light">Следующие шаги</h2>
        {nextSteps.length === 0 ? (
          <p className="text-ui-text-muted">Отличная работа! Продолжайте в том же духе.</p>
        ) : (
          <ul className="space-y-3">
            {nextSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-system-focus/20 border border-strategic-blue/30 flex items-center justify-center text-xs font-semibold text-strategic-blue">
                  {index + 1}
                </span>
                <span className="text-ash-light">{step}</span>
              </li>
            ))}
          </ul>
        )}
        
        <div className="mt-6 flex gap-3">
          <Link
            href="/experiments?tab=base-quests"
            className="px-4 py-2 bg-system-focus text-ash-light rounded hover:bg-system-focus/80 transition-colors text-sm font-medium"
          >
            Перейти к квестам
          </Link>
          <Link
            href="/experiments?tab=cases"
            className="px-4 py-2 bg-obsidian-core border border-ui-border-soft text-ash-light rounded hover:bg-bg-hover transition-colors text-sm"
          >
            Открыть кейсы
          </Link>
        </div>
      </section>
    </div>
  );
}

function BranchesTab({ branches }: { branches: any[] }) {
  return (
    <div className="space-y-6">
      {branches.map((branch) => (
        <div
          key={branch.branchId}
          className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-ash-light">{branch.branchName}</h3>
              <p className="text-sm text-ui-text-muted">{branch.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-strategic-blue">{branch.progress}%</div>
              <div className="text-xs text-ui-text-muted">{branch.availableNodes}/{branch.totalNodes} доступно</div>
            </div>
          </div>
          
          <div className="w-full bg-obsidian-core rounded-full h-2 border border-ui-border-soft mb-4">
            <div
              className="bg-system-focus h-2 rounded-full transition-all"
              style={{ width: `${branch.progress}%` }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {branch.nodes.map((node: NodeDevelopmentProgress) => (
              <div
                key={node.nodeId}
                className={`p-3 rounded border ${
                  node.status === 'locked'
                    ? 'bg-obsidian-core border-ui-border-soft opacity-50'
                    : node.status === 'mastered'
                    ? 'bg-obsidian-core border-sage-green/30'
                    : 'bg-obsidian-core border-strategic-blue/30'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-medium ${
                    node.status === 'locked' ? 'text-ui-text-muted' : 'text-ash-light'
                  }`}>
                    {node.nodeName}
                  </span>
                  <span className={`text-xs ${
                    node.status === 'mastered' 
                      ? 'text-sage-green' 
                      : node.status === 'in_progress' 
                      ? 'text-strategic-blue' 
                      : 'text-ui-text-muted'
                  }`}>
                    {node.overallProgress}%
                  </span>
                </div>
                <div className="text-xs text-ui-text-muted">
                  Квестов: {node.questsCompleted}/{node.questsTotal} | Кейсов: {node.casesCompleted}/{node.casesTotal}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AbilitiesTab({ nodes }: { nodes: NodeDevelopmentProgress[] }) {
  const sortedNodes = [...nodes].sort((a, b) => {
    // Сначала по статусу (in_progress, mastered, locked)
    const statusOrder = { in_progress: 0, mastered: 1, locked: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    // Затем по прогрессу
    return b.overallProgress - a.overallProgress;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedNodes.map((node) => (
        <NodeProgressCard key={node.nodeId} node={node} showBranch />
      ))}
    </div>
  );
}

function NodeProgressCard({ node, showBranch = false }: { node: NodeDevelopmentProgress; showBranch?: boolean }) {
  return (
    <div
      className={`bg-graphite-structure border rounded-lg shadow-panel p-4 border-l-4 bg-panel-gradient ${
        node.status === 'locked'
          ? 'border-l-ui-border-soft border-ui-border-soft opacity-60'
          : node.status === 'mastered'
          ? 'border-l-system-growth border-ui-border-soft'
          : 'border-l-system-focus border-ui-border-soft'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-ash-light">{node.nodeName}</h4>
          {showBranch && node.branchName && (
            <span className="text-xs text-ui-text-muted">{node.branchName}</span>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded ${
          node.status === 'mastered'
            ? 'bg-sage-green/20 text-sage-green'
            : node.status === 'in_progress'
            ? 'bg-system-focus/20 text-strategic-blue'
            : 'bg-obsidian-core text-ui-text-muted'
        }`}>
          {node.status === 'mastered' ? 'Освоено' : node.status === 'in_progress' ? 'В процессе' : 'Заблокировано'}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-ui-text-muted">Прогресс</span>
          <span className="text-xs font-semibold text-ash-light">{node.overallProgress}%</span>
        </div>
        <div className="w-full bg-obsidian-core rounded-full h-2 border border-ui-border-soft">
          <div
            className={`h-2 rounded-full transition-all ${
              node.status === 'mastered' ? 'bg-sage-green' : 'bg-system-focus'
            }`}
            style={{ width: `${node.overallProgress}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-xs text-ui-text-muted">
        <span>Квестов: {node.questsCompleted}/{node.questsTotal}</span>
        <span>Кейсов: {node.casesCompleted}/{node.casesTotal}</span>
      </div>

      {node.status !== 'locked' && (
        <div className="mt-3 flex gap-2">
          {node.questsCompleted < node.questsTotal && (
            <Link
              href="/experiments?tab=base-quests"
              className="flex-1 px-3 py-1.5 bg-obsidian-core border border-ui-border-soft text-ash-light rounded hover:bg-bg-hover transition-colors text-xs text-center"
            >
              Квест
            </Link>
          )}
          {node.questsCompleted > 0 && node.casesCompleted < node.casesTotal && (
            <Link
              href="/experiments?tab=cases"
              className="flex-1 px-3 py-1.5 bg-obsidian-core border border-ui-border-soft text-ash-light rounded hover:bg-bg-hover transition-colors text-xs text-center"
            >
              Кейс
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
