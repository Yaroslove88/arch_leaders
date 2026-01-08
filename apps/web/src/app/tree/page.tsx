'use client';

import { useState, useEffect } from 'react';
import { getSemanticTree, SemanticTree, getNodeDescription, NodeDescription } from '@/lib/api';
import { isAdmin, toggleAdminMode } from '@/lib/admin';
import { AdminDebugPanel, AdminLabel } from '@/components/AdminDebugPanel';
import { useAuth } from '@/hooks/useAuth';

export default function TreePage() {
  const [tree, setTree] = useState<SemanticTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeDescription, setNodeDescription] = useState<NodeDescription | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setAdminMode(isAdmin());
    async function loadTree() {
      try {
        setError(null);
        const data = await getSemanticTree();
        setTree(data);
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
      <div className="min-h-screen bg-bg-canvas p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-ui-text-muted">Загрузка дерева...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-canvas p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-bg-panel border border-system-critical/30 rounded-lg p-6 shadow-panel">
            <h2 className="text-xl font-semibold text-system-critical mb-2">Ошибка загрузки</h2>
            <p className="text-ui-text-muted">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-bg-secondary border border-system-critical text-system-critical rounded hover:border-system-critical/70 hover:bg-bg-panel transition-colors"
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
      <div className="min-h-screen bg-bg-canvas p-8">
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

  // Для админа открываем все узлы (показываем как unlocked)
  const getDisplayState = (node: any) => {
    if (adminMode) {
      return 'unlocked';
    }
    return node.state;
  };

  return (
    <div className="min-h-screen bg-bg-canvas p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-ui-text-main">Дерево способностей</h1>
            <AdminLabel />
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  toggleAdminMode();
                  setAdminMode(isAdmin());
                }}
                className="ml-4 px-2 py-1 text-xs bg-bg-secondary border border-ui-border-soft text-ui-text-muted rounded hover:border-ui-border-strong hover:text-ui-text-main transition-colors"
                title="Переключить режим админа"
              >
                {adminMode ? '🔓 Админ' : '🔒 Обычный'}
              </button>
            )}
          </div>
        </div>

        {/* Отладочная информация для админа */}
        {adminMode && tree && (
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
          <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Ветки</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch: any) => (
              <button
                key={branch.branch_id}
                onClick={() =>
                  setSelectedBranch(selectedBranch === branch.branch_id ? null : branch.branch_id)
                }
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedBranch === branch.branch_id
                    ? 'border-system-focus bg-bg-panel shadow-active'
                    : 'border-ui-border-soft bg-bg-panel hover:border-ui-border-strong'
                }`}
              >
                <h3 className="font-semibold mb-1 text-ui-text-main">{branch.name}</h3>
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

          {filteredNodes.length === 0 && nodes.length > 0 && (
            <div className="bg-bg-panel border border-system-warning/30 rounded-lg p-4 mb-4 shadow-panel">
              <p className="text-system-warning">
                Нет узлов в выбранной ветке. Всего узлов в дереве: {nodes.length}
              </p>
            </div>
          )}

          {nodes.length === 0 && (
            <div className="bg-bg-panel border border-system-critical/30 rounded-lg p-4 mb-4 shadow-panel">
              <p className="text-system-critical">
                Дерево пустое. Проверьте, что API сервер запущен и seed файл загружен.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNodes.map((node: any) => (
              <div
                key={node.node_id}
                onClick={() => handleNodeClick(node.node_id)}
                className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-4 border-l-4 border-system-stable cursor-pointer hover:shadow-active transition-shadow bg-panel-gradient"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-ui-text-main">{node.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded border ${getNodeStateColor(getDisplayState(node))}`}>
                    {getDisplayState(node) === 'locked' ? 'Заблокирован' : 
                     getDisplayState(node) === 'available' ? 'Доступен' : 
                     getDisplayState(node) === 'active' ? 'Активен' : 
                     getDisplayState(node) === 'unlocked' ? 'Разблокирован' : 
                     getDisplayState(node) === 'integrated' ? 'Интегрирован' : 'Неизвестно'}
                    {adminMode && node.state !== getDisplayState(node) && (
                      <span className="ml-1 text-system-warning" title={`Реальный статус: ${node.state}`}>
                        [было: {node.state}]
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-sm text-ui-text-muted mb-3">{node.description}</p>

                {/* Показываем только прогресс в процентах, без технических деталей */}
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
                        className="h-2 rounded-full bg-system-stable transition-all"
                        style={{
                          width: `${Math.min((node.xp_current / node.xp_required) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Модальное окно с описанием узла */}
        {selectedNode && nodeDescription && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-floating max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-ui-text-main">{nodeDescription.name}</h2>
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
    </div>
  );
}

