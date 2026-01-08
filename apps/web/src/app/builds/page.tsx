'use client';

import { useState, useEffect } from 'react';
import { getBuilds, getCurrentBuild, Build, BuildStatus, getSemanticTree, SemanticTree } from '@/lib/api';
import { isAdmin, toggleAdminMode } from '@/lib/admin';
import { AdminDebugPanel, AdminLabel } from '@/components/AdminDebugPanel';
import { useAuth } from '@/hooks/useAuth';

export default function BuildsPage() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [currentBuilds, setCurrentBuilds] = useState<BuildStatus[]>([]);
  const [tree, setTree] = useState<SemanticTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuild, setSelectedBuild] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setAdminMode(isAdmin());
    loadData();
  }, []);

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

        {/* Отладочная информация для админа */}
        {adminMode && (
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
            <h2 className="text-2xl font-semibold mb-4 text-ui-text-main">Активные билды</h2>
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

        {/* Все билды */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-ui-text-main">Все билды</h2>
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
                      {/* Требуемые навыки для активации */}
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

                      {/* Связанные узлы (дополнительно влияют на активацию) */}
                      {build.related_nodes && build.related_nodes.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 text-ui-text-main">
                            Связанные навыки и перки
                          </h4>
                          <p className="text-xs text-ui-text-muted mb-2">
                            Дополнительно влияют на активацию билда:
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

                      {/* Прогресс активации - только общая информация */}
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
    </div>
  );
}

