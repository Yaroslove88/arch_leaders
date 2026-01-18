'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getQuests, completeQuest, getNodeDescriptions, Quest } from '@/lib/api';
import { isAdmin, toggleAdminMode } from '@/lib/admin';
import { AdminDebugPanel, AdminLabel } from '@/components/AdminDebugPanel';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/hooks/useAuth';

// Маппинг nodeId на русские названия с переводами
const nodeNameMap: Record<string, string> = {
  'node_shared_leadership': 'Распределённое лидерство',
  'node_feedforward': 'Обратная связь в будущее',
  'node_rede_model': 'REDE Модель',
  'node_mirror_holder': 'Смотрящий в окно vs Держащий зеркало',
  'node_vertical_development': 'Вертикальное развитие',
  'node_ddo': 'Организация как тренажёр',
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

export default function QuestsPage() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'backlog' | 'done'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'micro' | 'weekly' | 'story' | 'in-person'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; questId: string | null }>({
    isOpen: false,
    questId: null,
  });
  const [nodeDescriptions, setNodeDescriptions] = useState<Record<string, { name: string }>>({});
  const toast = useToast();
  
  // Загружаем описания узлов для получения русских названий
  useEffect(() => {
    getNodeDescriptions()
      .then((data) => {
        const descriptions: Record<string, { name: string }> = {};
        Object.entries(data.descriptions || {}).forEach(([nodeId, desc]: [string, any]) => {
          descriptions[nodeId] = { name: desc.name || nodeId };
        });
        setNodeDescriptions(descriptions);
      })
      .catch((error) => {
        console.warn('Не удалось загрузить описания узлов:', error);
        // Продолжаем работу без описаний, используя fallback
      });
  }, []);

  useEffect(() => {
    setAdminMode(isAdmin());
    loadQuests();
  }, [statusFilter, typeFilter]);

  async function loadQuests() {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuests(statusFilter === 'all' ? undefined : statusFilter);
      let filteredQuests = data.quests || [];
      
      // Фильтр по типу
      if (typeFilter !== 'all') {
        filteredQuests = filteredQuests.filter(q => q.type === typeFilter);
      }
      
      setQuests(filteredQuests);
    } catch (error: any) {
      // Если не авторизован, показываем пустой массив вместо ошибки
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        setQuests([]);
      } else {
        setError(error?.message || 'Не удалось загрузить квесты. Проверьте, что API сервер запущен.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(questId: string) {
    setConfirmDialog({ isOpen: true, questId });
  }

  async function confirmComplete() {
    if (!confirmDialog.questId) return;

    try {
      await completeQuest(confirmDialog.questId);
      toast.showToast('Квест успешно завершен', 'success');
      loadQuests();
    } catch (error) {
      toast.showToast('Ошибка при завершении квеста', 'error');
    } finally {
      setConfirmDialog({ isOpen: false, questId: null });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-ui-text-muted">Загрузка...</div>
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
              onClick={() => loadQuests()}
              className="mt-4 px-4 py-2 bg-bg-secondary border border-system-critical text-system-critical rounded hover:border-system-critical/70 hover:bg-bg-panel transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Завершить квест?"
        message="Вы уверены, что хотите завершить этот квест? Это действие нельзя отменить."
        confirmText="Завершить"
        cancelText="Отмена"
        onConfirm={confirmComplete}
        onCancel={() => setConfirmDialog({ isOpen: false, questId: null })}
        variant="default"
      />
      <div className="min-h-screen bg-bg-main p-8">
        <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-ui-text-main">Квесты</h1>
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
          <Link
            href="/entries/new"
            className="px-4 py-2 bg-bg-secondary border border-system-focus text-system-focus rounded hover:border-system-focus/70 hover:bg-bg-panel transition-colors"
          >
            + Новая ситуация
          </Link>
        </div>

        {/* Отладочная информация для админа */}
        {adminMode && (
          <AdminDebugPanel
            data={{
              totalQuests: quests.length,
              byStatus: {
                active: quests.filter(q => q.status === 'active').length,
                backlog: quests.filter(q => q.status === 'backlog').length,
                done: quests.filter(q => q.status === 'done').length,
              },
              statusFilter,
              typeFilter,
              quests: quests.map(q => ({
                id: q.id,
                title: q.title,
                status: q.status,
                type: q.type,
                hasTheory: !!(q.criteria as any)?.theory_and_examples,
              })),
            }}
            title="Отладка: Квесты"
          />
        )}

        {adminMode && error && (
          <AdminDebugPanel
            data={{ error }}
            title="Отладка: Ошибка"
          />
        )}

        {/* Фильтры */}
        <div className="space-y-4 mb-6">
          {/* Фильтр по статусу */}
          <div>
            <p className="text-sm text-ui-text-muted mb-2">Статус:</p>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'active', 'backlog', 'done'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded border transition-colors ${
                    statusFilter === status
                      ? 'bg-bg-secondary border-system-focus text-system-focus'
                      : 'bg-bg-panel border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong hover:text-ui-text-main'
                  }`}
                >
                  {status === 'all' ? 'Все' : status === 'active' ? 'Активные' : status === 'backlog' ? 'Отложенные' : 'Завершенные'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Фильтр по типу */}
          <div>
            <p className="text-sm text-ui-text-muted mb-2">Тип:</p>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'micro', 'weekly', 'story', 'in-person'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-4 py-2 rounded border transition-colors ${
                    typeFilter === type
                      ? 'bg-bg-secondary border-system-focus text-system-focus'
                      : 'bg-bg-panel border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong hover:text-ui-text-main'
                  }`}
                >
                  {type === 'all' ? 'Все' : type === 'micro' ? 'Micro' : type === 'weekly' ? 'Weekly' : type === 'story' ? 'Story' : 'In-person'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Список квестов */}
        {quests.length === 0 ? (
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-8 text-center text-ui-text-muted">
            Нет квестов
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quests.map((quest) => {
              // Вычисляем прогресс выполнения шагов
              const steps = quest.steps || [];
              const completedSteps = steps.filter((step: any) => step.completed || step.status === 'completed').length;
              const progressPercent = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
              
              return (
                <div
                  key={quest.id}
                  className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 border-l-4 border-system-focus bg-panel-gradient"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-ui-text-main mb-2">{quest.title}</h3>
                      <div className="flex gap-2 flex-wrap">
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
                           quest.status === 'backlog' ? 'Отложен' : 
                           quest.status === 'archived' ? 'Архивирован' : quest.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-ui-text-muted mb-4 line-clamp-2">{quest.description}</p>

                  {/* Прогресс выполнения */}
                  {steps.length > 0 && quest.status === 'active' && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-ui-text-muted font-medium">Прогресс:</span>
                        <span className="text-xs text-ui-text-main">{completedSteps} из {steps.length} шагов</span>
                      </div>
                      <div className="w-full bg-bg-canvas rounded-full h-2 border border-ui-border-soft">
                        <div 
                          className="bg-system-growth h-2 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Связанные способности */}
                  {quest.linked_nodes && quest.linked_nodes.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-ui-text-muted mb-2 font-medium">Связанные способности:</p>
                      <div className="flex flex-wrap gap-1">
                        {/* Импортируем названия способностей из контентной базы узлов */}
                        {quest.linked_nodes.slice(0, 3).map((nodeId: string) => (
                          <span
                            key={nodeId}
                            className="px-2 py-1 bg-bg-secondary border border-system-stable text-system-stable rounded text-xs"
                          >
                            {getNodeName(nodeId, nodeDescriptions)}
                          </span>
                        ))}
                        {quest.linked_nodes.length > 3 && (
                          <span className="px-2 py-1 text-xs text-ui-text-muted">
                            +{quest.linked_nodes.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Награда */}
                  {quest.reward && (
                    <div className="mb-4">
                      <p className="text-xs text-ui-text-muted mb-1 font-medium">Награда:</p>
                      <div className="flex items-center gap-2">
                        {quest.reward.xp && (
                          <span className="px-2 py-1 bg-bg-secondary border border-system-stable text-system-stable rounded text-xs">
                            {quest.reward.xp} XP
                          </span>
                        )}
                        {quest.reward.nodes && Object.keys(quest.reward.nodes).length > 0 && (
                          <span className="text-xs text-ui-text-muted">
                            +{Object.values(quest.reward.nodes)[0]} к способности
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Действия */}
                  <div className="mt-4 space-y-2">
                    {quest.status === 'active' && (
                      <button
                        onClick={() => handleComplete(quest.id)}
                        className="w-full px-4 py-2 bg-bg-secondary border border-system-growth text-system-growth rounded hover:border-system-growth/70 hover:bg-bg-panel transition-colors"
                      >
                        Завершить
                      </button>
                    )}
                    {quest.status === 'backlog' && (
                      <Link
                        href={`/quests/${quest.id}`}
                        className="block w-full px-4 py-2 bg-bg-secondary border border-system-focus text-system-focus rounded hover:border-system-focus/70 hover:bg-bg-panel transition-colors text-center"
                      >
                        Активировать
                      </Link>
                    )}
                    <Link
                      href={`/quests/${quest.id}`}
                      className="block text-center text-sm text-system-focus hover:text-system-focus/80 hover:underline"
                    >
                      Подробнее →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </>
  );
}

