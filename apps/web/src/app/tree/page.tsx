'use client';

import { useState, useEffect } from 'react';
import { 
  getSemanticTree, 
  SemanticTree, 
  getNodeDescription, 
  NodeDescription,
  getUserAbilityStates,
  getNodeAchievements,
  NodeAbilityState,
  Achievement,
} from '@/lib/api';
import { isUserAdmin, isAdminDebugMode, isAdminViewAllMode, toggleAdminDebugMode } from '@/lib/admin';
import { AdminDebugPanel, AdminLabel } from '@/components/AdminDebugPanel';
import { NodeExperienceIndicators } from '@/components/NodeExperienceIndicators';
import { useAuth } from '@/hooks/useAuth';

export default function TreePage() {
  const [tree, setTree] = useState<SemanticTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeDescription, setNodeDescription] = useState<NodeDescription | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [viewAllMode, setViewAllMode] = useState(false);
  const [abilityStates, setAbilityStates] = useState<Record<string, NodeAbilityState>>({});
  const [nodePrerequisites, setNodePrerequisites] = useState<Record<string, string[]>>({});
  const [nodeAchievements, setNodeAchievements] = useState<Record<string, Achievement[]>>({});
  const { user } = useAuth();

  useEffect(() => {
    setDebugMode(isAdminDebugMode(user));
    setViewAllMode(isAdminViewAllMode(user));
    async function loadTree() {
      try {
        setError(null);
        const data = await getSemanticTree();
        setTree(data);
        
        // Загружаем состояния узлов
        try {
          const states = await getUserAbilityStates();
          setAbilityStates(states);
          
          // Загружаем prerequisites для всех узлов
          const nodeIds = data.nodes?.map((n: any) => n.node_id) || [];
          if (nodeIds.length > 0) {
            try {
              const token = localStorage.getItem('auth_token');
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/tree/nodes/info?nodeIds=${nodeIds.join(',')}`,
                {
                  headers: token ? {
                    'Authorization': `Bearer ${token}`,
                  } : {},
                }
              );
              if (response.ok) {
                const nodesInfo = await response.json();
                const prerequisitesMap: Record<string, string[]> = {};
                nodesInfo.forEach((info: any) => {
                  prerequisitesMap[info.node_id] = info.prerequisites || [];
                });
                setNodePrerequisites(prerequisitesMap);
                
                // Загружаем ачивки для всех узлов (только если авторизован)
                if (token) {
                  const achievementsMap: Record<string, Achievement[]> = {};
                  // Загружаем ачивки только для первых 20 узлов, чтобы не перегружать
                  const nodesToCheck = nodeIds.slice(0, 20);
                  for (const nodeId of nodesToCheck) {
                    try {
                      const achievements = await getNodeAchievements(nodeId);
                      if (achievements.length > 0) {
                        achievementsMap[nodeId] = achievements;
                      }
                    } catch {
                      // Игнорируем ошибки для отдельных узлов
                    }
                  }
                  setNodeAchievements(achievementsMap);
                }
              }
            } catch (error) {
              console.warn('Failed to load node prerequisites:', error);
            }
          }
        } catch (error) {
          console.warn('Failed to load ability states:', error);
        }
      } catch (error: any) {
        setError(error?.message || 'Не удалось загрузить дерево способностей. Проверьте, что API сервер запущен.');
      } finally {
        setLoading(false);
      }
    }

    loadTree();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-core p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-ui-text-muted">Загрузка дерева...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-obsidian-core p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-graphite-structure border border-tension-red/30 rounded-lg p-6 shadow-panel">
            <h2 className="text-xl font-semibold text-tension-red mb-2">Ошибка загрузки</h2>
            <p className="text-ui-text-muted">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-obsidian-core border border-tension-red text-tension-red rounded hover:border-tension-red/70 hover:bg-graphite-structure transition-colors"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="min-h-screen bg-obsidian-core p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-ui-text-muted">Дерево не загружено</div>
        </div>
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

  const getNodeStateColor = (state: string) => {
    switch (state) {
      case 'locked':
        return 'bg-obsidian-core border-ui-border-soft text-ui-text-muted';
      case 'available':
        return 'bg-obsidian-core border-catalyst-gold/30 text-catalyst-gold';
      case 'active':
        return 'bg-obsidian-core border-strategic-blue/50 text-strategic-blue';
      case 'unlocked':
        return 'bg-obsidian-core border-sage-green/30 text-sage-green';
      case 'integrated':
        return 'bg-obsidian-core border-sage-green/50 text-sage-green';
      default:
        return 'bg-obsidian-core border-ui-border-soft text-ui-text-muted';
    }
  };

  // Для админа в режиме viewAll открываем все узлы (показываем как unlocked)
  const getDisplayState = (node: any) => {
    if (viewAllMode) {
      return 'unlocked';
    }
    return node.state;
  };

  return (
    <div className="min-h-screen bg-obsidian-core p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-ash-light">Дерево способностей</h1>
            <AdminLabel />
            {isUserAdmin(user) && (
              <button
                onClick={() => {
                  const newMode = toggleAdminDebugMode(user);
                  setDebugMode(newMode);
                }}
                className="ml-4 px-2 py-1 text-xs bg-obsidian-core border border-ui-border-soft text-ui-text-muted rounded hover:border-ui-border-strong hover:text-ash-light transition-colors"
                title="Переключить режим отладки"
              >
                {debugMode ? '🔓 Debug ON' : '🔒 Debug OFF'}
              </button>
            )}
          </div>
        </div>

        {/* Отладочная информация для админа */}
        {debugMode && tree && (
          <>
            <AdminDebugPanel
              data={{
                branches: branches.length,
                nodes: nodes.length,
                byState: {
                  locked: nodes.filter((n: any) => n.state === 'locked').length,
                  available: nodes.filter((n: any) => n.state === 'available').length,
                  active: nodes.filter((n: any) => n.state === 'active').length,
                  unlocked: nodes.filter((n: any) => n.state === 'unlocked').length,
                  integrated: nodes.filter((n: any) => n.state === 'integrated').length,
                },
                selectedBranch,
                selectedNode,
                tree: {
                  branches: branches.map((b: any) => ({
                    id: b.branch_id,
                    name: b.name,
                    nodes: nodes.filter((n: any) => n.branch_id === b.branch_id).length,
                  })),
                  nodes: nodes.map((n: any) => ({
                    id: n.node_id,
                    name: n.name,
                    state: n.state,
                    branch: n.branch_id,
                    xp: `${n.xp_current}/${n.xp_required}`,
                  })),
                },
              }}
              title="Отладка: Дерево способностей"
            />
            {error && (
              <AdminDebugPanel
                data={{ error }}
                title="Отладка: Ошибка"
              />
            )}
          </>
        )}

        {/* Ветки */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-ash-light">Ветки</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch: any) => (
              <button
                key={branch.branch_id}
                onClick={() =>
                  setSelectedBranch(selectedBranch === branch.branch_id ? null : branch.branch_id)
                }
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedBranch === branch.branch_id
                    ? 'border-strategic-blue bg-graphite-structure shadow-active'
                    : 'border-ui-border-soft bg-graphite-structure hover:border-ui-border-strong'
                }`}
              >
                <h3 className="font-semibold mb-1 text-ash-light">{branch.name}</h3>
                <p className="text-sm text-ui-text-muted">{branch.description}</p>
                <div className="mt-2 text-xs text-ui-text-muted">
                  Узлов: {nodes.filter((n: any) => n.branch_id === branch.branch_id).length}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Узлы */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-ash-light">
              Узлы {selectedBranch ? `(${branches.find((b: any) => b.branch_id === selectedBranch)?.name})` : '(Все)'}
              <span className="ml-2 text-sm text-ui-text-muted font-normal">
                ({filteredNodes.length} из {nodes.length})
              </span>
            </h2>
            {selectedBranch && (
              <button
                onClick={() => setSelectedBranch(null)}
                className="text-sm text-strategic-blue hover:text-strategic-blue/80 hover:underline transition-colors"
              >
                Показать все
              </button>
            )}
          </div>

          {filteredNodes.length === 0 && nodes.length > 0 && (
            <div className="bg-graphite-structure border border-catalyst-gold/30 rounded-lg p-4 mb-4 shadow-panel">
              <p className="text-catalyst-gold">
                Нет узлов в выбранной ветке. Всего узлов в дереве: {nodes.length}
              </p>
            </div>
          )}

          {nodes.length === 0 && (
            <div className="bg-graphite-structure border border-tension-red/30 rounded-lg p-4 mb-4 shadow-panel">
              <p className="text-tension-red">
                Дерево пустое. Проверьте, что API сервер запущен и seed файл загружен.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNodes.map((node: any) => (
              <div
                key={node.node_id}
                onClick={() => handleNodeClick(node.node_id)}
                className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel p-4 border-l-4 border-sage-green cursor-pointer hover:shadow-active transition-shadow bg-panel-gradient"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-ash-light">{node.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded border ${getNodeStateColor(getDisplayState(node))}`}>
                    {getDisplayState(node) === 'locked' ? 'Заблокирован' : 
                     getDisplayState(node) === 'available' ? 'Доступен' : 
                     getDisplayState(node) === 'active' ? 'Активен' : 
                     getDisplayState(node) === 'unlocked' ? 'Разблокирован' : 
                     getDisplayState(node) === 'integrated' ? 'Интегрирован' : 'Неизвестно'}
                    {viewAllMode && node.state !== getDisplayState(node) && (
                      <span className="ml-1 text-catalyst-gold" title={`Реальный статус: ${node.state}`}>
                        [было: {node.state}]
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-sm text-ui-text-muted mb-3">{node.description}</p>

                {/* Показываем только прогресс в процентах, без технических деталей */}
                {node.xp_required > 0 && (
                  <div className="text-xs mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-ui-text-muted">Прогресс:</span>
                      <span className="font-semibold text-ash-light">
                        {abilityStates[node.node_id] 
                          ? Math.round((abilityStates[node.node_id].progress || 0) * 100)
                          : Math.round((node.xp_current / node.xp_required) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-obsidian-core rounded-full h-2 border border-ui-border-soft">
                      <div
                        className="h-2 rounded-full bg-system-stable transition-all"
                        style={{
                          width: `${Math.min(
                            abilityStates[node.node_id] 
                              ? (abilityStates[node.node_id].progress || 0) * 100
                              : (node.xp_current / node.xp_required) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Индикаторы опыта */}
                {abilityStates[node.node_id] && (
                  <NodeExperienceIndicators
                    nodeId={node.node_id}
                    nodeState={abilityStates[node.node_id]}
                    nodePrerequisites={nodePrerequisites[node.node_id] || []}
                    prerequisitesStates={abilityStates}
                    achievements={nodeAchievements[node.node_id] || []}
                    allNodes={nodes.map((n: any) => ({ node_id: n.node_id, name: n.name }))}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Модальное окно с описанием узла */}
        {selectedNode && nodeDescription && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-floating max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-ash-light">{nodeDescription.name}</h2>
                  <button
                    onClick={() => {
                      setSelectedNode(null);
                      setNodeDescription(null);
                    }}
                    className="text-ui-text-muted hover:text-ash-light transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-ash-light">Полное описание</h3>
                    <p className="text-ui-text-muted">{nodeDescription.full_description}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-ash-light">Практическое значение</h3>
                    <p className="text-ui-text-muted">{nodeDescription.practical_meaning}</p>
                  </div>

                  {nodeDescription.examples && nodeDescription.examples.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 text-ash-light">Примеры применения</h3>
                      <ul className="list-disc list-inside space-y-1 text-ui-text-muted">
                        {nodeDescription.examples.map((example, idx) => (
                          <li key={idx}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2 text-ash-light">Уровни интеграции</h3>
                    <div className="space-y-2">
                      <div className="p-3 bg-obsidian-core border border-catalyst-gold/30 rounded">
                        <p className="font-semibold text-sm mb-1 text-catalyst-gold">Новичок:</p>
                        <p className="text-sm text-ui-text-muted">{nodeDescription.integration_levels.Novice}</p>
                      </div>
                      <div className="p-3 bg-obsidian-core border border-strategic-blue/30 rounded">
                        <p className="font-semibold text-sm mb-1 text-strategic-blue">Интегрированный:</p>
                        <p className="text-sm text-ui-text-muted">{nodeDescription.integration_levels.Integrated}</p>
                      </div>
                      <div className="p-3 bg-obsidian-core border border-sage-green/30 rounded">
                        <p className="font-semibold text-sm mb-1 text-sage-green">Воплощённый:</p>
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
    </div>
  );
}

