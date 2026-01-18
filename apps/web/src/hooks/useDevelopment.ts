import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  getSemanticTree, 
  SemanticTree, 
  getQuests, 
  Quest, 
  getCases, 
  InteractiveCase, 
  getCaseProgress, 
  CaseProgress,
  getNodeDescriptions 
} from '../lib/api';
import { getNodeName } from '../lib/node-translations';

export interface NodeDevelopmentProgress {
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

export interface BranchDevelopmentProgress {
  branchId: string;
  branchName: string;
  description?: string;
  totalNodes: number;
  activeNodes: number;
  masteredNodes: number;
  progress: number;
  nodes: NodeDevelopmentProgress[];
}

export interface OverallStats {
  totalNodes: number;
  activeNodes: number;
  masteredNodes: number;
  totalProgress: number;
  totalQuests: number;
  completedQuests: number;
  activeQuests: number;
  totalCases: number;
  completedCases: number;
}

export interface UseDevelopmentResult {
  isLoading: boolean;
  tree: SemanticTree | undefined;
  quests: Quest[];
  cases: InteractiveCase[];
  caseProgress: CaseProgress;
  nodeDescriptions: Record<string, any>;
  nodeProgressMap: Map<string, NodeDevelopmentProgress>;
  overallStats: OverallStats;
  branchProgress: BranchDevelopmentProgress[];
  currentFocus: NodeDevelopmentProgress[];
  nextSteps: string[];
  getNodeProgress: (nodeId: string) => NodeDevelopmentProgress | undefined;
  getCompletedQuestsOnNode: (nodeId: string) => number;
  isCaseUnlockable: (nodeId: string) => boolean;
}

export function useDevelopment(): UseDevelopmentResult {
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
      
      // Определяем статус
      let status: 'locked' | 'in_progress' | 'mastered' = 'locked';
      if (node.state === 'locked') {
        status = 'locked';
      } else if (overallProgress >= 80) {
        status = 'mastered';
      } else {
        status = 'in_progress';
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
  const overallStats = useMemo((): OverallStats => {
    const nodes = Array.from(nodeProgressMap.values());
    const totalNodes = nodes.length;
    const activeNodes = nodes.filter(n => n.status !== 'locked').length;
    const masteredNodes = nodes.filter(n => n.status === 'mastered').length;
    const totalProgress = totalNodes > 0 ? Math.round((activeNodes / totalNodes) * 100) : 0;
    
    const totalQuests = quests.length;
    const completedQuests = quests.filter((q: Quest) => q.status === 'done').length;
    const activeQuests = quests.filter((q: Quest) => q.status === 'active').length;
    
    const totalCases = cases.length;
    const completedCases = caseProgress.solvedCases.length;

    return {
      totalNodes,
      activeNodes,
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
  const branchProgress = useMemo((): BranchDevelopmentProgress[] => {
    if (!tree?.branches) return [];

    return tree.branches.map((branch: any) => {
      const branchNodes = Array.from(nodeProgressMap.values()).filter(
        n => n.branchId === branch.branch_id
      );
      const totalNodes = branchNodes.length;
      const activeNodes = branchNodes.filter(n => n.status !== 'locked').length;
      const masteredNodes = branchNodes.filter(n => n.status === 'mastered').length;
      const progress = totalNodes > 0 ? Math.round((activeNodes / totalNodes) * 100) : 0;

      return {
        branchId: branch.branch_id,
        branchName: branch.name,
        description: branch.description,
        totalNodes,
        activeNodes,
        masteredNodes,
        progress,
        nodes: branchNodes,
      };
    });
  }, [tree, nodeProgressMap]);

  // Текущий фокус (узлы с прогрессом но не завершенные)
  const currentFocus = useMemo((): NodeDevelopmentProgress[] => {
    return Array.from(nodeProgressMap.values())
      .filter(n => n.status === 'in_progress' && n.state !== 'locked')
      .sort((a, b) => b.overallProgress - a.overallProgress)
      .slice(0, 4);
  }, [nodeProgressMap]);

  // Рекомендации следующих шагов
  const nextSteps = useMemo((): string[] => {
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

  // Вспомогательные функции
  const getNodeProgress = (nodeId: string): NodeDevelopmentProgress | undefined => {
    return nodeProgressMap.get(nodeId);
  };

  const getCompletedQuestsOnNode = (nodeId: string): number => {
    return quests.filter(
      (q: Quest) => q.status === 'done' && q.linked_nodes?.includes(nodeId)
    ).length;
  };

  const isCaseUnlockable = (nodeId: string): boolean => {
    // Кейсы разблокируются при наличии хотя бы одного завершённого квеста на узле
    // Убрана зависимость от node.state, так как статусы узлов не синхронизированы корректно
    const completedQuests = getCompletedQuestsOnNode(nodeId);
    return completedQuests > 0;
  };

  return {
    isLoading,
    tree,
    quests,
    cases,
    caseProgress,
    nodeDescriptions,
    nodeProgressMap,
    overallStats,
    branchProgress,
    currentFocus,
    nextSteps,
    getNodeProgress,
    getCompletedQuestsOnNode,
    isCaseUnlockable,
  };
}
