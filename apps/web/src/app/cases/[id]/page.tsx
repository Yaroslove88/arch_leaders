'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCase, InteractiveCase, markCaseAsSolved, getCaseProgress, getNodeDescriptions, recordActivity, recordCaseChoice } from '@/lib/api';
import { getNodeName } from '@/lib/node-translations';
import { useToast } from '@/components/ToastProvider';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ReflectionModal } from '@/components/modals';
import { CaseDetailCardV2 } from '@/components/cards';
import { adaptCaseToV2, isCaseV2Compatible } from '@/lib/case-adapter';

export default function CasePage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  
  const [case_, setCase] = useState<InteractiveCase | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [choiceRecorded, setChoiceRecorded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSolved, setIsSolved] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [showReflectionModal, setShowReflectionModal] = useState(false);

  const { data: nodeDescriptionsData } = useQuery({
    queryKey: ['nodeDescriptions'],
    queryFn: getNodeDescriptions,
    retry: 2,
  });
  
  const nodeDescriptions = nodeDescriptionsData?.descriptions || {};

  useEffect(() => {
    if (params.id) {
      loadCase(params.id as string);
      checkIfSolved(params.id as string);
    }
  }, [params.id]);

  async function loadCase(id: string) {
    setLoading(true);
    try {
      const data = await getCase(id);
      setCase(data);
    } catch (error) {
      console.error('Failed to load case:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkIfSolved(caseId: string) {
    try {
      const apiProgress = await getCaseProgress();
      if (apiProgress.solvedCases.includes(caseId)) {
        setIsSolved(true);
      }
    } catch (error) {
      console.error('Failed to check if case is solved:', error);
    }
  }

  function handleOptionSelect(optionId: string) {
    if (!choiceRecorded && case_) {
      setSelectedOption(optionId);
      setChoiceRecorded(true);
      
      // Скролл вверх при выборе ответа
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      if (userId) {
        recordCaseChoice(userId, case_.id).catch(console.error);
      }
    }
  }

  async function handleMarkAsSolved() {
    if (!case_ || isMarking) return;
    
    setIsMarking(true);
    try {
      const optionData = selectedOption ? case_.options.find(opt => opt.id === selectedOption) : null;
      await markCaseAsSolved(case_.id, selectedOption || undefined, optionData?.skill_used);
      setIsSolved(true);
      
      if (userId) {
        await recordActivity(userId, 'case').catch(console.error);
      }
      
      toast.showToast('Кейс отмечен как решённый', 'success');
    } catch (error) {
      toast.showToast('Ошибка при сохранении', 'error');
    } finally {
      setIsMarking(false);
    }
  }

  // Loading
  if (loading) {
    return (
      <main className="min-h-screen bg-obsidian-core p-4 md:p-8">
        <div className="max-w-3xl mx-auto text-center text-ui-text-main">Загрузка...</div>
      </main>
    );
  }

  // Not found
  if (!case_ || !case_.options?.length) {
    return (
      <main className="min-h-screen bg-obsidian-core p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="text-strategic-blue mb-4">← Назад</button>
          <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6 text-center">
            <p className="text-ui-text-main">Кейс не найден или в разработке</p>
          </div>
        </div>
      </main>
    );
  }

  // Адаптируем данные для V2 компонента
  const caseDataV2 = adaptCaseToV2(case_);
  const nodeName = case_.node_id ? getNodeName(case_.node_id, nodeDescriptions) : undefined;

  return (
    <main className="min-h-screen bg-obsidian-core p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {caseDataV2 ? (
          <>
            <CaseDetailCardV2
              caseData={caseDataV2}
              difficulty={case_.difficulty}
              selectedPositionId={choiceRecorded ? selectedOption || undefined : undefined}
              nodeName={nodeName}
              xpReward={5}
              onSelectPosition={handleOptionSelect}
              onNextCase={() => router.push('/experiments?tab=cases')}
              onBackToList={() => router.push('/experiments?tab=cases')}
              onBack={() => router.push('/experiments?tab=cases')}
              actionButtons={choiceRecorded && (
                <div className="space-y-3 mb-3">
                  {/* Рефлексия */}
                  {case_.reflection?.questions && (
                    <button
                      onClick={() => setShowReflectionModal(true)}
                      className="w-full py-3 px-4 bg-graphite-structure border-2 border-ui-border-strong rounded-lg hover:border-strategic-blue hover:bg-strategic-blue/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🪞</span>
                        <span className="text-sm font-semibold text-ash-light">Рефлексия (опционально)</span>
                      </div>
                      <p className="text-xs text-ash-light/90">
                        Зафиксируй свои мысли и инсайты
                      </p>
                    </button>
                  )}

                  {/* Кнопка завершения */}
                  {!isSolved ? (
                    <button
                      onClick={handleMarkAsSolved}
                      disabled={isMarking}
                      className="w-full py-3 px-4 bg-sage-green hover:bg-sage-green/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {isMarking ? 'Сохранение...' : '✓ Завершить кейс'}
                    </button>
                  ) : (
                    <div className="w-full py-3 px-4 bg-sage-green/20 text-sage-green rounded-lg text-center text-sm font-medium border border-sage-green/30">
                      ✓ Кейс завершён
                    </div>
                  )}
                </div>
              )}
            />
          </>
        ) : (
          // Fallback на простой текст если адаптация не удалась
          <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
            <p className="text-ui-text-main">Ошибка загрузки кейса</p>
          </div>
        )}

        {/* Модальное окно рефлексии */}
        <ReflectionModal
          isOpen={showReflectionModal}
          context={{
            type: 'case',
            id: case_.id,
            title: case_.title,
            selectedOption: selectedOption || undefined,
            selectedOptionTitle: selectedOption ? case_.options.find(opt => opt.id === selectedOption)?.text.split('\n')[0] : undefined,
          }}
          reflectionQuestion={case_.reflection?.questions?.[0]}
          onClose={() => setShowReflectionModal(false)}
          onSave={async (data) => {
            console.log('Рефлексия сохранена:', data);
            setShowReflectionModal(false);
            toast.showToast('Рефлексия сохранена', 'success');
          }}
          onSkip={() => setShowReflectionModal(false)}
        />
      </div>
    </main>
  );
}
