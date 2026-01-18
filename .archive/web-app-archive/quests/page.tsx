'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getQuests, completeQuest, getNodeDescriptions, Quest } from '@/lib/api';
import { getNodeName } from '@/lib/node-translations';
import { isUserAdmin, isAdminDebugMode, isAdminViewAllMode, toggleAdminDebugMode } from '@/lib/admin';
import { AdminDebugPanel, AdminLabel } from '@/components/AdminDebugPanel';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/hooks/useAuth';
import { QuestCard, type QuestType, type QuestDifficulty, type QuestStatus } from '@/components/cards';

// Маппинг nodeId на русские названия с переводами

export default function QuestsPage() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'backlog' | 'done'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'micro' | 'weekly' | 'story' | 'in-person'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
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
    setDebugMode(isAdminDebugMode(user));
    loadQuests();
  }, [statusFilter, typeFilter, user]);

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
          <Link
            href="/entries/new"
            className="px-4 py-2 bg-bg-secondary border border-system-focus text-system-focus rounded hover:border-system-focus/70 hover:bg-bg-panel transition-colors"
          >
            + Новая ситуация
          </Link>
        </div>

        {/* Отладочная информация для админа */}
        {debugMode && (
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

        {debugMode && error && (
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
                  {type === 'all' ? 'Все' : type === 'micro' ? 'Микро-квест' : type === 'weekly' ? 'Недельный' : type === 'story' ? 'Сюжетный' : 'In-person'}
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
              
              // Маппинг типа квеста
              const questTypeMap: Record<string, QuestType> = {
                'micro': 'micro',
                'weekly': 'weekly',
                'story': 'story',
                'in-person': 'default',
              };
              
              // Маппинг статуса квеста
              const questStatusMap: Record<string, QuestStatus> = {
                'active': 'in_progress',
                'done': 'completed',
                'backlog': 'available',
                'archived': 'locked',
              };
              
              // Гипотеза
              const hypothesis = (quest as any)?.hypothesis || quest.description?.split('\n')[1]?.slice(0, 150);
              
              // Награда
              const rewardXP = quest.reward?.xp || 0;
              
              // Влияние на дерево (массив узлов)
              const treeImpact = quest.linked_nodes?.map(nodeId => ({
                nodeName: getNodeName(nodeId, nodeDescriptions),
                percentage: quest.reward?.nodes?.[nodeId] || 0,
              })).filter(impact => impact.percentage > 0) || [];
              
              return (
                <QuestCard
                  key={quest.id}
                  questId={quest.id}
                  title={quest.title}
                  hypothesis={hypothesis}
                  questType={questTypeMap[quest.type] || 'default'}
                  difficulty="intermediate"
                  status={questStatusMap[quest.status] || 'available'}
                  completedSteps={completedSteps}
                  totalSteps={steps.length}
                  xpReward={rewardXP}
                  treeImpact={treeImpact}
                  estimatedMinutes={quest.type === 'micro' ? 5 : quest.type === 'weekly' ? 30 : 60}
                  onClick={() => window.location.href = `/quests/${quest.id}`}
                />
              );
            })}
          </div>
        )}
        </div>
      </div>
    </>
  );
}

