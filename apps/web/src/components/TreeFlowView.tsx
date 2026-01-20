'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { SemanticTree } from '../lib/api';
import { cn } from '@/lib/utils';
import { getNodeStateColorsRaw, getBranchColorRaw } from '@/lib/ui-utils';
import { tokens, NodeState } from '@leadership-architect/ui';

interface TreeFlowViewProps {
  tree: SemanticTree | null;
  selectedNode?: string | null;
  onNodeClick?: (nodeId: string) => void;
  /** Высота контейнера */
  height?: string;
  /** Фильтр по ветке */
  branchFilter?: string | null;
}

/**
 * Кастомный узел для дерева способностей
 */
function AbilityNodeComponent({ data }: { data: any }) {
  const colors = getNodeStateColorsRaw(data.state as NodeState);
  const isSelected = data.isSelected;
  const isHighlighted = data.isHighlighted;
  const hasFocus = isSelected || isHighlighted;

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl border-2 transition-all duration-300 shadow-lg",
        isSelected ? "scale-110 ring-4 ring-strategic-blue/20" : "scale-100",
        !hasFocus && data.anySelected ? "opacity-30 grayscale-[0.8]" : "opacity-100"
      )}
      style={{
        backgroundColor: colors.bg,
        borderColor: isSelected ? tokens.colors.nodeStates.available.border : colors.border,
        minWidth: '180px',
        maxWidth: '220px',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: data.branchColor || colors.accent }}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: colors.text }}>
            {data.tier || 'Level 1'}
          </span>
        </div>
        {data.state === 'locked' && <span className="text-[10px]" aria-label="Заблокировано" role="img">🔒</span>}
        {data.state === 'integrated' && <span className="text-[10px]" aria-label="Интегрировано" role="img">⭐</span>}
      </div>
      
      <div className="text-sm font-bold leading-tight mb-3" style={{ color: tokens.colors.text.main }}>
        {data.name}
      </div>
      
      {data.progress !== undefined && data.state !== 'locked' && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tighter opacity-50">
            <span id={`progress-label-${data.name}`}>Прогресс</span>
            <span>{Math.round(data.progress * 100)}%</span>
          </div>
          <div 
            className="h-1.5 bg-black/40 rounded-full overflow-hidden p-[1px]"
            role="progressbar"
            aria-valuenow={Math.round(data.progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-labelledby={`progress-label-${data.name}`}
          >
            <div
              className="h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.3)]"
              style={{
                width: `${Math.min(data.progress * 100, 100)}%`,
                backgroundColor: isSelected ? tokens.colors.nodeStates.available.border : colors.border,
              }}
            />
          </div>
        </div>
      )}
      
      {data.unlocksCount > 0 && (
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5">
          <span className="text-[10px] opacity-40">🔓</span>
          <span className="text-[9px] font-bold uppercase tracking-tight opacity-40">
            Открывает: {data.unlocksCount}
          </span>
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  ability: AbilityNodeComponent,
};

/**
 * TreeFlowView - интерактивная визуализация дерева способностей
 */
export function TreeFlowView({
  tree,
  selectedNode,
  onNodeClick,
  height = '600px',
  branchFilter,
}: TreeFlowViewProps) {
  // Находим все связанные узлы для подсветки пути
  const highlightedNodes = useMemo(() => {
    if (!selectedNode || !tree?.nodes) return new Set<string>();
    const highlighted = new Set<string>();
    highlighted.add(selectedNode);

    const findAncestors = (nodeId: string) => {
      const node = tree.nodes.find((n: any) => n.node_id === nodeId);
      if (node?.prerequisites) {
        node.prerequisites.forEach((prereqId: string) => {
          if (!highlighted.has(prereqId)) {
            highlighted.add(prereqId);
            findAncestors(prereqId);
          }
        });
      }
    };

    const findDescendants = (nodeId: string) => {
      tree.nodes.forEach((node: any) => {
        if (node.prerequisites?.includes(nodeId)) {
          if (!highlighted.has(node.node_id)) {
            highlighted.add(node.node_id);
            findDescendants(node.node_id);
          }
        }
      });
    };

    findAncestors(selectedNode);
    findDescendants(selectedNode);
    return highlighted;
  }, [selectedNode, tree]);

  // Преобразуем данные дерева в nodes и edges для React Flow
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!tree?.nodes) {
      return { initialNodes: [], initialEdges: [] };
    }

    // Фильтруем по ветке если указано
    const filteredNodes = branchFilter
      ? tree.nodes.filter((n) => n.branch_id === branchFilter)
      : tree.nodes;

    // Считаем unlocks для каждого узла
    const unlockCounts: Record<string, number> = {};
    tree.nodes.forEach(node => {
      if (node.prerequisites) {
        node.prerequisites.forEach((prereqId: string) => {
          unlockCounts[prereqId] = (unlockCounts[prereqId] || 0) + 1;
        });
      }
    });

    // Группируем узлы по тирам (tier)
    const nodesByTier = new Map<number, typeof filteredNodes>();
    filteredNodes.forEach((node) => {
      // Пытаемся определить уровень из tier или xp_required
      const tier = (node as any).tier === 'basic' ? 0 : 
                   (node as any).tier === 'intermediate' ? 1 : 
                   (node as any).tier === 'advanced' ? 2 : 0;
      
      if (!nodesByTier.has(tier)) {
        nodesByTier.set(tier, []);
      }
      nodesByTier.get(tier)!.push(node);
    });

    // Создаём nodes с позициями (Top-to-Bottom layout)
    const nodes: Node[] = [];
    const nodeWidth = 250;
    const nodeHeight = 160;
    const tierSpacing = 250;
    
    nodesByTier.forEach((tierNodes, tier) => {
      const startY = tier * tierSpacing + 50;
      const totalWidth = tierNodes.length * nodeWidth;
      const startX = -totalWidth / 2;

      tierNodes.forEach((node, nodeIndex) => {
        const isSelected = selectedNode === node.node_id;
        const isHighlighted = highlightedNodes.has(node.node_id);
        const branchColor = getBranchColorRaw(node.branch_id || '');

        nodes.push({
          id: node.node_id,
          type: 'ability',
          position: { x: startX + nodeIndex * nodeWidth, y: startY },
          data: {
            name: node.name || node.node_id.replace('node_', '').replace(/_/g, ' '),
            state: node.state,
            tier: (node as any).tier,
            progress: (node as any).xp_current && (node as any).xp_required
              ? (node as any).xp_current / (node as any).xp_required
              : 0,
            branchColor,
            unlocksCount: unlockCounts[node.node_id] || 0,
            isSelected,
            isHighlighted,
            anySelected: !!selectedNode,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
      });
    });

    // Создаём edges на основе prerequisites
    const edges: Edge[] = [];
    filteredNodes.forEach((node) => {
      const prerequisites = node.prerequisites || [];
      prerequisites.forEach((prereqId: string) => {
        const isHighlighted = highlightedNodes.has(node.node_id) && highlightedNodes.has(prereqId);
        
        if (nodes.find((n) => n.id === prereqId)) {
          edges.push({
            id: `${prereqId}-${node.node_id}`,
            source: prereqId,
            target: node.node_id,
            animated: isHighlighted && node.state !== 'locked',
            style: {
              stroke: isHighlighted ? tokens.colors.nodeStates.available.border : tokens.colors.nodeStates.locked.border,
              strokeWidth: isHighlighted ? 3 : 1.5,
              opacity: selectedNode ? (isHighlighted ? 1 : 0.1) : 0.6,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isHighlighted ? tokens.colors.nodeStates.available.border : tokens.colors.nodeStates.locked.border,
            },
          });
        }
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [tree, selectedNode, branchFilter, highlightedNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Обновляем nodes/edges при изменении внешних пропсов (подсветка)
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick],
  );

  if (!tree || nodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-obsidian-core rounded-xl border border-ui-border-soft"
        style={{ height }}
      >
        <p className="text-ui-text-muted">Нет данных для отображения</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-ui-border-soft shadow-2xl relative" style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={tokens.colors.base.obsidianCore} gap={30} size={1} />
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          className="bg-graphite-structure border-ui-border-soft fill-ash-light"
        />
        <MiniMap
          nodeColor={(node) => {
            const state = (node.data?.state || 'locked') as NodeState;
            return getNodeStateColorsRaw(state).border;
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          className="bg-graphite-structure border-ui-border-soft rounded-lg overflow-hidden"
        />
      </ReactFlow>
      
      {/* Overlay legend for Graph */}
      <div className="absolute top-4 left-4 p-3 bg-graphite-structure/80 backdrop-blur-md border border-ui-border-soft rounded-xl pointer-events-none">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ui-text-dim mb-2">Навигация по графу</div>
        <div className="text-[10px] text-ash-light opacity-80">
          • Кликните на узел, чтобы подсветить путь<br/>
          • Используйте колесо мыши для зума<br/>
          • Тяните за фон для перемещения
        </div>
      </div>
    </div>
  );
}
