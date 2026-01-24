'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getQuest, completeQuest, activateQuest, getEvidence, createEvidence, getNodeDescriptions, Quest, Evidence } from '@/lib/api';
import { getNodeName } from '@/lib/node-translations';
import Link from 'next/link';
import { isUserAdmin, isAdminDebugMode } from '@/lib/admin';
import { AdminDebugPanel, AdminLabel } from '@/components/AdminDebugPanel';
import { useAuth } from '@/hooks/useAuth';
import { useTelegramNavigation } from '@/hooks/useTelegramNavigation';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';
import { QuestDetailCard, type QuestStep, type QuestType, type QuestDifficulty } from '@/components/cards';
import { AddEvidenceModal, type EvidenceFormData } from '@/components/modals';

export default function QuestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const questId = params.id as string;
  
  // Telegram BackButton integration
  useTelegramNavigation('/experiments', { hapticFeedback: true });
  const [quest, setQuest] = useState<Quest | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [isSavingEvidence, setIsSavingEvidence] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [nodeDescriptions, setNodeDescriptions] = useState<Record<string, { name: string }>>({});
  const { user } = useAuth();

  useEffect(() => {
    getNodeDescriptions()
      .then((data) => {
        const descriptions: Record<string, { name: string }> = {};
        Object.entries(data.descriptions || {}).forEach(([nodeId, desc]: [string, any]) => {
          descriptions[nodeId] = { name: desc.name || nodeId };
        });
        setNodeDescriptions(descriptions);
      })
      .catch(() => {});
  }, []);

  const loadQuest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [questData, evidenceData] = await Promise.all([
        getQuest(questId),
        getEvidence({ quest_id: questId }).catch(() => ({ evidences: [], total: 0 }))
      ]);
      setQuest(questData);
      setEvidence(evidenceData.evidences || []);
    } catch (error: any) {
      setError(error?.message || 'Не удалось загрузить квест');
    } finally {
      setLoading(false);
    }
  }, [questId]);

  useEffect(() => {
    setMounted(true);
    setDebugMode(isAdminDebugMode(user));
    loadQuest();
  }, [loadQuest, user]);

  async function handleComplete() {
    if (!quest) return;
    setShowCompleteDialog(true);
  }

  async function confirmComplete() {
    if (!quest) return;
    setShowCompleteDialog(false);
    try {
      await completeQuest(quest.id);
      loadQuest();
      toast.showToast('Квест завершён', 'success');
    } catch (error) {
      toast.showToast('Ошибка при завершении квеста', 'error');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-core p-4 md:p-8">
        <div className="max-w-3xl mx-auto text-center text-ui-text-muted">Загрузка...</div>
      </div>
    );
  }

  if (error || !quest) {
    return (
      <div className="min-h-screen bg-obsidian-core p-4 md:p-8">
        <div className="max-w-3xl mx-auto bg-graphite-structure border border-tension-red rounded-lg p-6">
          <h2 className="text-xl font-semibold text-tension-red mb-2">Ошибка</h2>
          <p className="text-ash-light">{error || 'Квест не найден'}</p>
          <div className="mt-4 flex gap-4">
            <button onClick={() => loadQuest()} className="px-4 py-2 bg-tension-red text-white rounded hover:bg-tension-red/80">
              Попробовать снова
            </button>
            <Link href="/experiments" className="px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded">
              Вернуться к квестам
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Преобразуем шаги квеста в формат QuestDetailCard
  // Поддерживаем разные форматы: строки, объекты с order/title/description, объекты с id/description
  const questSteps: QuestStep[] = (quest.steps || [])
    .map((step: any, idx: number) => {
      // Если шаг - строка
      if (typeof step === 'string') {
        const stepText = step.trim();
        if (!stepText || stepText.length < 3) return null;
        return {
          id: `step-${idx}`,
          title: stepText,
          description: undefined,
          isCompleted: false,
          note: undefined,
        };
      }
      
      // Если шаг - объект
      if (typeof step === 'object' && step !== null) {
        const stepText = (step.description || step.text || '').trim();
        const stepTitle = step.title || null;
        if (!stepText || stepText.length < 3) return null;
        const stepCompleted = step.completed || step.status === 'completed';
        return {
          id: step.id || `step-${step.order !== undefined ? step.order - 1 : idx}`,
          title: stepTitle || stepText,
          description: stepTitle ? stepText : undefined,
          isCompleted: stepCompleted,
          note: step.note,
        };
      }
      
      return null;
    })
    .filter(Boolean) as QuestStep[];

  // Маппинг типа квеста
  const questTypeMap: Record<string, QuestType> = {
    'micro': 'micro',
    'weekly': 'weekly',
    'story': 'story',
    'in-person': 'default',
  };

  // Получаем теорию
  const theoryAndExamples = (quest.criteria as any)?.theory_and_examples;
  const theory = typeof theoryAndExamples === 'string' 
    ? theoryAndExamples 
    : theoryAndExamples?.theory || 
      (quest as any)?.theory_and_examples?.theory ||
      (quest.criteria as any)?.theory;

  // Гипотеза (берём из hypothesis, criteria или description)
  const hypothesis = (quest as any)?.hypothesis || 
                    (quest.criteria as any)?.hypothesis ||
                    (quest.description && quest.description.length > 20 ? quest.description.slice(0, 200) : undefined);

  // Критерии успеха (поддерживаем items и success_criteria для обратной совместимости)
  const criteriaItems = (quest.criteria as any)?.items || 
                       (quest.criteria as any)?.success_criteria || 
                       [];
  const successCriteria = criteriaItems.map((text: string, idx: number) => ({
    id: `criterion-${idx}`,
    text,
    isCompleted: false,
  }));

  // Награда
  const rewardXP = quest.reward?.xp || 0;
  
  // Влияние на дерево (массив узлов) - показываем все связанные узлы
  const treeImpact = quest.linked_nodes?.map(nodeId => ({
    nodeName: getNodeName(nodeId, nodeDescriptions),
    percentage: quest.reward?.nodes?.[nodeId] || 5, // дефолт 5% если не указано
  })) || [];

  const isCompleted = quest.status === 'done';

  return (
    <>
      <ConfirmDialog
        isOpen={showCompleteDialog}
        title="Завершить квест?"
        message="Вы уверены, что хотите завершить этот квест?"
        confirmText="Завершить"
        cancelText="Отмена"
        onConfirm={confirmComplete}
        onCancel={() => setShowCompleteDialog(false)}
        variant="default"
      />

      <div className="min-h-screen bg-obsidian-core p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Навигация + Активация */}
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/experiments"
              className="text-strategic-blue hover:text-strategic-blue/80 inline-flex items-center gap-1 text-sm"
            >
              ← К экспериментам
            </Link>

            {quest.status === 'backlog' && (
              <button
                onClick={async () => {
                  try {
                    await activateQuest(quest.id);
                    toast.showToast('Квест активирован', 'success');
                    loadQuest();
                  } catch {
                    toast.showToast('Ошибка', 'error');
                  }
                }}
                className="py-1.5 px-4 bg-catalyst-gold text-obsidian-core rounded-full text-xs font-bold uppercase tracking-wider hover:bg-catalyst-gold/90 transition-all shadow-glow-gold"
              >
                Активировать квест
              </button>
            )}
          </div>

          {/* Основная карточка квеста */}
          <QuestDetailCard
            questId={quest.id}
            title={quest.title}
            hypothesis={hypothesis}
            theory={theory}
            questType={questTypeMap[quest.type] || 'default'}
            difficulty="intermediate"
            steps={questSteps}
            successCriteria={successCriteria}
            treeImpact={treeImpact}
            xpReward={rewardXP}
            estimatedMinutes={quest.type === 'micro' ? 5 : quest.type === 'weekly' ? 30 : 60}
            onStepToggle={async (stepId, isCompleted) => {
              // Можно добавить API call для сохранения прогресса шага
              // Пока просто обновляем локально
              setQuest(prev => {
                if (!prev) return prev;
                const newSteps = prev.steps.map((step: any, idx: number) => {
                  if (`step-${idx}` === stepId) {
                    return { ...step, completed: isCompleted };
                  }
                  return step;
                });
                return { ...prev, steps: newSteps };
              });
            }}
            onComplete={handleComplete}
            isCompleted={isCompleted}
            evidence={evidence}
            onAddEvidence={() => setShowEvidenceModal(true)}
            className="mb-6"
          />

          {/* Модальное окно добавления доказательства */}
          <AddEvidenceModal
            isOpen={showEvidenceModal}
            questId={quest.id}
            questTitle={quest.title}
            successCriteria={successCriteria}
            onClose={() => setShowEvidenceModal(false)}
            onSave={async (data: EvidenceFormData) => {
              setIsSavingEvidence(true);
              try {
                await createEvidence({
                  type: 'observation',
                  text: data.text,
                  quest_id: data.questId || quest.id,
                  tags: data.completedCriteria,
                });
                toast.showToast('След сохранён', 'success');
                setShowEvidenceModal(false);
                loadQuest(); // Перезагружаем квест, чтобы обновить список доказательств
              } catch (error: any) {
                toast.showToast(error?.message || 'Ошибка при сохранении следа', 'error');
              } finally {
                setIsSavingEvidence(false);
              }
            }}
            isLoading={isSavingEvidence}
          />

          {/* Debug панель */}
          {debugMode && (
            <AdminDebugPanel
              data={{ questId: quest.id, quest }}
              title="Отладка: Данные квеста"
            />
          )}
        </div>
      </div>
    </>
  );
}
