'use client';

import { useState, useEffect } from 'react';
import { getBuilds, getCurrentBuild, Build, BuildStatus, getSemanticTree, SemanticTree } from '@/lib/api';
import { isUserAdmin, isAdminDebugMode, toggleAdminDebugMode } from '@/lib/admin';
import { AdminDebugPanel, AdminLabel } from '@/components/AdminDebugPanel';
import { useAuth } from '@/hooks/useAuth';
import { BuildCard, type BuildStatus as BuildCardStatus, type BuildRequirement } from '@/components/cards';
import { translateNodeName } from '@/lib/node-translations';

export default function BuildsPage() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [currentBuilds, setCurrentBuilds] = useState<BuildStatus[]>([]);
  const [tree, setTree] = useState<SemanticTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuild, setSelectedBuild] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setDebugMode(isAdminDebugMode(user));
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [buildsData, currentData, treeData] = await Promise.all([
        getBuilds(),
        getCurrentBuild(),
        getSemanticTree(),
      ]);
      setBuilds(buildsData.builds);
      setCurrentBuilds(currentData);
      setTree(treeData);
    } catch (error: any) {
      setError(error?.message || 'Не удалось загрузить билды. Проверьте, что API сервер запущен.');
    } finally {
      setLoading(false);
    }
  }

  // Функция перевода названий узлов
  // Функция для получения названия узла по ID
  function getNodeName(nodeId: string): string {
    if (!tree) return nodeId;
    const node = tree.nodes?.find((n: any) => n.node_id === nodeId);
    const nodeName = node?.name || nodeId;
    return translateNodeName(nodeName);
  }

  // Функция для получения названия ветки по ID
  function getBranchName(branchId: string): string {
    if (!tree) return '';
    const branch = tree.branches?.find((b: any) => b.branch_id === branchId);
    return branch?.name || '';
  }

  // Функция для получения ветки узла
  function getNodeBranch(nodeId: string): string {
    if (!tree) return '';
    const node = tree.nodes?.find((n: any) => n.node_id === nodeId);
    if (node?.branch_id) {
      return getBranchName(node.branch_id);
    }
    return '';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-ui-text-muted">Загрузка билдов...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-main p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-bg-panel border border-system-critical/30 rounded-lg p-6 shadow-panel">
            <h2 className="text-xl font-semibold text-system-critical mb-2">Ошибка загрузки</h2>
            <p className="text-ui-text-muted">{error}</p>
            <button
              onClick={() => loadData()}
              className="mt-4 px-4 py-2 bg-bg-secondary border border-system-critical text-system-critical rounded hover:border-system-critical/70 hover:bg-bg-panel transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeBuilds = currentBuilds.filter((b) => b.is_active);
  const selectedBuildData = builds.find((b) => b.build_id === selectedBuild);
  const selectedBuildStatus = currentBuilds.find((b) => b.build_id === selectedBuild);

  return (
    <div className="min-h-screen bg-bg-main p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <h1 className="text-3xl font-bold text-ui-text-main">Билды лидерства</h1>
          <AdminLabel />
          {isUserAdmin(user) && (
            <button
              onClick={() => {
                const newMode = toggleAdminDebugMode(user);
                setDebugMode(newMode);
              }}
              className="ml-4 px-2 py-1 text-xs bg-bg-secondary border border-ui-border-soft text-ui-text-muted rounded hover:border-ui-border-strong hover:text-ui-text-main transition-colors"
              title="Переключить режим отладки"
            >
              {debugMode ? '🔓 Debug ON' : '🔒 Debug OFF'}
            </button>
          )}
        </div>

        {/* Отладочная информация для админа */}
        {debugMode && (
          <>
            <AdminDebugPanel
              data={{
                totalBuilds: builds.length,
                activeBuilds: currentBuilds.filter(b => b.is_active).length,
                builds: builds.map(b => ({
                  id: b.build_id,
                  name: b.name,
                  color: b.color,
                })),
                currentBuilds: currentBuilds.map(b => ({
                  id: b.build_id,
                  isActive: b.is_active,
                  activation: b.activation_percentage,
                  matched: b.matched_conditions?.length || 0,
                  missing: b.missing_conditions?.length || 0,
                })),
              }}
              title="Отладка: Билды"
            />
            {error && (
              <AdminDebugPanel
                data={{ error }}
                title="Отладка: Ошибка"
              />
            )}
          </>
        )}

        <p className="text-ui-text-muted mb-6">
          Билды — это временные идентичности лидера, которые активируются автоматически
          на основе ваших навыков и паттернов поведения. Зрелость проявляется в способности
          быть разным, входить и выходить из билдов осознанно.
        </p>

        {/* Текущие активные билды */}
        {activeBuilds.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-ui-text-main">Активные стили</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBuilds.map((buildStatus) => {
                const build = builds.find((b) => b.build_id === buildStatus.build_id);
                if (!build) return null;
                
                // Формируем требования
                const requirements: BuildRequirement[] = (build.entry_conditions?.required_nodes || []).map((nodeId: string) => {
                  const node = tree?.nodes?.find((n: any) => n.node_id === nodeId);
                  const isCompleted = node?.state === 'active' || node?.state === 'unlocked' || node?.state === 'integrated';
                  return {
                    nodeId: nodeId,
                    nodeName: translateNodeName(node?.name || nodeId),
                    requiredLevel: 1,
                    currentLevel: isCompleted ? 1 : 0,
                    isCompleted,
                  };
                });
                
                return (
                  <BuildCard
                    key={buildStatus.build_id}
                    buildId={build.build_id}
                    name={build.name}
                    fantasy={build.fantasy}
                    icon={build.icon}
                    status="active"
                    activationProgress={buildStatus.activation_percentage}
                    requirements={requirements}
                    onClick={() => setSelectedBuild(selectedBuild === build.build_id ? null : build.build_id)}
                  />
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
              
              // Определяем статус карточки
              let buildCardStatus: BuildCardStatus = 'locked';
              if (isActive) buildCardStatus = 'active';
              else if (activationPercentage > 0) buildCardStatus = 'available';
              
              // Формируем требования
              const requirements: BuildRequirement[] = (build.entry_conditions?.required_nodes || []).map((nodeId: string) => {
                const node = tree?.nodes?.find((n: any) => n.node_id === nodeId);
                const isNodeActive = node?.state === 'active' || node?.state === 'unlocked' || node?.state === 'integrated';
                return {
                  nodeId: nodeId,
                  nodeName: translateNodeName(node?.name || nodeId),
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
                  name: translateNodeName(node?.name || nodeId),
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
                  status={buildCardStatus}
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
    </div>
  );
}

