'use client';

/**
 * Страница детального просмотра квеста
 * 
 * Структура отображения соответствует docs/QUEST_CONTENT_STRUCTURE.md:
 * 1. Описание (description) - краткое описание цели квеста
 * 2. Теория и примеры (theory_and_examples) - теоретическое объяснение
 * 3. Шаги выполнения (steps) - конкретные действия
 * 4. Критерии успеха (criteria.items) - проверяемые условия
 * 5. Награда (reward) - XP и прогресс по способностям
 * 6. Связанные способности (linked_nodes) - список способностей
 * 7. Почему появился этот квест - если есть session_id, source
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getQuest, completeQuest, activateQuest, getEvidence, getNodeDescriptions, Quest, Evidence } from '@/lib/api';
import Link from 'next/link';
import { isAdmin, toggleAdminMode } from '@/lib/admin';
import { AdminDebugPanel, AdminLabel } from '@/components/AdminDebugPanel';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';
import { QuestTheory } from '@/components/QuestTheory';

// Маппинг nodeId на русские названия
const nodeNameMap: Record<string, string> = {
  'node_grounding_point': 'Точка опоры',
  'node_self_regulation': 'Саморегуляция',
  'node_role_differentiation': 'Различение ролей',
  'node_scenario_analysis': 'Разбор сценария',
  'node_subject_in_system': 'Субъект в системе',
  'node_decision_authorship': 'Авторство решений',
  'node_architecture_coupling': 'Архитектура сцепки',
  'node_field_of_differences': 'Поле различий',
  'node_system_thinking': 'Системное мышление',
  'node_scenario_thinking': 'Сценарное мышление',
  'node_form_assembly': 'Сборка форм',
  'node_containment': 'Контейнирование',
  'node_thinking_through_form': 'Мышление через форму',
  'node_personal_resilience': 'Личная устойчивость',
  'node_weak_zone_diagnosis': 'Диагностика слабых зон',
  'node_recovery_skills': 'Навыки восстановления',
  'node_emotional_work': 'Работа с эмоциями',
  'node_cognitive_maturity': 'Когнитивная зрелость',
  'node_role_energy': 'Энергия роли',
  'node_stress_tolerance': 'Толерантность к стрессу',
  'node_recovery': 'Восстановление',
  'node_responsibility_as_form': 'Ответственность как форма',
  'node_responsibility_sag_diagnosis': 'Диагностика провисания ответственности',
  'node_delegation_as_coupling': 'Делегирование как сцепка',
  'node_upper_field_work': 'Работа с верхним полем',
  'node_leader_liberation': 'Освобождение лидера',
  'node_shared_leadership': 'Распределённое лидерство',
  'node_psychological_ownership': 'Психологическая собственность',
  'node_collective_efficacy': 'Коллективная эффективность',
  'node_ownership': 'Владение',
  'node_accountability': 'Подотчетность',
  'node_feedback_types': 'Типы обратной связи',
  'node_language_of_differences': 'Язык различий',
  'node_feedback_through_vulnerability': 'Приём обратной связи через уязвимость',
  'node_feedforward': 'Обратная связь в будущее',
  'node_rede_model': 'REDE Модель',
  'node_mirror_holder': 'Смотрящий в окно vs Держащий зеркало',
  'node_giving_feedback': 'Дача обратной связи',
  'node_receiving_feedback': 'Принятие обратной связи',
  'node_maturity_environment': 'Среда зрелости',
  'node_subjectivity_transfer': 'Передача субъектности',
  'node_scene_holding': 'Удержание сцены',
  'node_institutionalization': 'Институционализация',
  'node_vertical_development': 'Вертикальное развитие',
  'node_ddo': 'Организация как тренажёр',
'node_mature_parting': 'Зрелое расставание',
  'node_team_development': 'Развитие команды',
  'node_organizational_culture': 'Организационная культура',
  'node_grounding': 'Заземление',
  'node_design_thinking': 'Дизайн-мышление',
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

// Перевод источника на русский
function translateSource(source: string | null | undefined): string {
  if (!source) return '';
  
  const sourceMap: Record<string, string> = {
    'session_analysis': 'Анализ ситуации',
    'base_template': 'Базовый шаблон',
    'manual': 'Создан вручную',
    'auto-generated': 'Автоматически сгенерирован',
  };
  
  return sourceMap[source] || source;
}

export default function QuestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const questId = params.id as string;
  const [quest, setQuest] = useState<Quest | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [nodeDescriptions, setNodeDescriptions] = useState<Record<string, { name: string }>>({});
  const { user } = useAuth();
  
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
    setAdminMode(isAdmin());
    loadQuest();
  }, [loadQuest]);

  async function handleComplete() {
    if (!quest) return;
    setShowCompleteDialog(true);
  }

  async function confirmComplete() {
    if (!quest) return;
    setShowCompleteDialog(false);
    try {
      await completeQuest(quest.id);
      loadQuest(); // Перезагружаем квест для обновления статуса
      toast.showToast('Квест завершён', 'success');
    } catch (error) {
      toast.showToast('Ошибка при завершении квеста', 'error');
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-main p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-ui-text-muted">Загрузка...</div>
        </div>
      </main>
    );
  }

  if (error || !quest) {
    return (
      <main className="min-h-screen bg-bg-main p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-bg-panel border border-system-critical rounded-lg shadow-panel p-6">
            <h2 className="text-xl font-semibold text-system-critical mb-2">Ошибка</h2>
            <p className="text-ui-text-main">{error || 'Квест не найден'}</p>
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => loadQuest()}
                className="px-4 py-2 bg-system-critical text-ui-text-main rounded hover:bg-system-critical/80 transition-colors focus:ring-2 focus:ring-system-critical focus:ring-offset-2 focus:ring-offset-bg-main"
              >
                Попробовать снова
              </button>
              <Link
                href="/quests"
                className="px-4 py-2 bg-bg-secondary border border-ui-border-soft text-ui-text-main rounded hover:bg-bg-hover transition-colors"
              >
                Вернуться к квестам
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showCompleteDialog}
        title="Завершить квест?"
        message="Вы уверены, что хотите завершить этот квест? Это действие нельзя отменить."
        confirmText="Завершить"
        cancelText="Отмена"
        onConfirm={confirmComplete}
        onCancel={() => setShowCompleteDialog(false)}
        variant="default"
      />
      <main className="min-h-screen bg-bg-main p-8">
        <div className="max-w-4xl mx-auto">
        {/* Навигация */}
        <div className="mb-6">
          <button 
            onClick={() => {
              // Проверяем, откуда пришли
              const referrer = typeof window !== 'undefined' ? document.referrer : '';
              const savedTab = typeof window !== 'undefined' ? localStorage.getItem('experiments_active_tab') : null;
              
              if (referrer.includes('/experiments') || savedTab) {
                // Возвращаемся на страницу экспериментов с сохранением вкладки
                const tab = savedTab || 'active';
                router.push(`/experiments?tab=${tab}`);
              } else {
                // Иначе используем стандартную навигацию назад
                router.back();
              }
            }}
            className="text-system-focus hover:text-system-focus/80 mb-4 inline-block transition-colors"
          >
            ← Назад к квестам
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-ui-text-main">{quest.title}</h1>
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
            <span
              className={`px-3 py-1 rounded text-sm border ${
                quest.status === 'active'
                  ? 'bg-bg-secondary border-system-growth text-system-growth'
                  : quest.status === 'done'
                  ? 'bg-bg-secondary border-ui-border-soft text-ui-text-muted'
                  : quest.status === 'backlog'
                  ? 'bg-bg-secondary border-system-warning text-system-warning'
                  : 'bg-bg-secondary border-ui-border-soft text-ui-text-muted'
              }`}
            >
              {quest.status === 'active' ? 'Активный' : 
               quest.status === 'done' ? 'Завершён' : 
               quest.status === 'backlog' ? 'Отложен' : 
               quest.status === 'archived' ? 'Архивирован' : quest.status}
            </span>
          </div>
        </div>

        {/* Отладочная информация для админа */}
        {adminMode && (
          <>
            <AdminDebugPanel
              data={{
                questId: quest.id,
                quest: {
                  id: quest.id,
                  title: quest.title,
                  description: quest.description,
                  type: quest.type,
                  status: quest.status,
                  criteria: quest.criteria,
                  hasTheory: !!(quest.criteria as any)?.theory_and_examples,
                  theoryLength: (quest.criteria as any)?.theory_and_examples?.length || 0,
                  linked_nodes: quest.linked_nodes,
                  reward: quest.reward,
                  source: quest.source,
                  tags: quest.tags,
                },
              }}
              title="Отладка: Данные квеста"
            />
            {error && (
              <AdminDebugPanel
                data={{ error }}
                title="Отладка: Ошибка"
              />
            )}
          </>
        )}

        {/* Описание - первая секция, согласно QUEST_CONTENT_STRUCTURE.md
            Должно содержать только краткое описание цели (1-3 предложения),
            без информации о шагах, критериях, теории или наградах */}
        <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4 flex-1">
              <span className="px-3 py-1 bg-bg-secondary border border-system-focus text-system-focus rounded text-sm font-medium">
                {quest.type === 'micro' ? 'Micro' : 
                 quest.type === 'weekly' ? 'Weekly' : 
                 quest.type === 'story' ? 'Story' : 
                 quest.type === 'in-person' ? 'In-person' : quest.type}
              </span>
              {quest.reward && (
                <span className="px-3 py-1 bg-bg-secondary border border-system-stable text-system-stable rounded text-sm font-medium">
                  {quest.reward.xp || 0} XP
                </span>
              )}
            </div>
            {/* Кнопка активации в правом верхнем углу */}
            {quest.status === 'backlog' && (
              <button
                onClick={async () => {
                  try {
                    await activateQuest(quest.id);
                    toast.showToast('Квест активирован', 'success');
                    loadQuest();
                  } catch (error) {
                    toast.showToast('Ошибка при активации квеста', 'error');
                  }
                }}
                className="px-4 py-2 bg-system-focus text-ui-text-main rounded hover:bg-system-focus/80 transition-colors text-sm font-medium focus:ring-2 focus:ring-system-focus focus:ring-offset-2 focus:ring-offset-bg-main"
              >
                Активировать квест
              </button>
            )}
          </div>

          <h2 className="text-2xl font-semibold mb-4 text-ui-text-main">Описание</h2>
          <div className="prose prose-invert max-w-none">
            {/* Согласно QUEST_CONTENT_STRUCTURE.md, описание должно быть только кратким описанием цели,
                без информации о шагах, критериях или теории */}
            <div className="text-ui-text-main leading-relaxed text-base space-y-3">
              {(() => {
                // Для weekly квестов обрезаем description до "Действия на неделю" или других маркеров
                let descriptionText = quest.description;
                if (quest.type === 'weekly' || quest.description.includes('Действия на неделю')) {
                  const markers = [
                    'Действия на неделю:',
                    'Действия на неделю',
                    'Шаги выполнения:',
                    'Этап 1:',
                    'День 1:',
                    'Критерии успеха:',
                    'Награда:'
                  ];
                  let minIndex = descriptionText.length;
                  for (const marker of markers) {
                    const index = descriptionText.indexOf(marker);
                    if (index !== -1 && index < minIndex) {
                      minIndex = index;
                    }
                  }
                  if (minIndex < descriptionText.length) {
                    descriptionText = descriptionText.substring(0, minIndex).trim();
                  }
                }
                return descriptionText.split('\n\n').map((paragraph: string, idx: number) => (
                  <p key={idx} className="whitespace-pre-wrap">{paragraph}</p>
                ));
              })()}
            </div>
          </div>
        </section>

        {/* Теория и примеры - после описания, согласно QUEST_CONTENT_STRUCTURE.md */}
        <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-ui-text-main">Теория</h2>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 bg-bg-secondary border border-ui-border-soft text-ui-text-main rounded hover:bg-bg-hover transition-colors text-sm font-medium"
            >
              {showDetails ? 'Скрыть' : 'Показать'}
            </button>
          </div>
          
          {showDetails && mounted && (
            <QuestTheory 
              theory={(quest.criteria as any)?.theory_and_examples || (quest as any)?.theory_and_examples}
              steps={quest.steps}
            />
          )}
        </section>

        {/* Hypothesis - если есть в данных */}
        {(quest as any).hypothesis && (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3 text-ui-text-main">Гипотеза</h2>
            <div className="p-4 bg-bg-secondary rounded-lg border border-ui-border-soft">
              <p className="text-ui-text-main leading-relaxed">{(quest as any).hypothesis}</p>
            </div>
          </section>
        )}


        {/* Шаги выполнения - после теории, согласно QUEST_CONTENT_STRUCTURE.md
            Содержат только конкретные действия, без объяснений "почему" */}
        {(() => {
          // Правильная обработка шагов согласно QUEST_CONTENT_STRUCTURE.md
          if (!quest.steps || !Array.isArray(quest.steps) || quest.steps.length === 0) {
            return null;
          }
          
          const validSteps = quest.steps
            .map((step: any, originalIndex: number) => {
              // Правильная обработка шага
              let stepText: string | null = null;
              let stepTitle: string | null = null;
              
              if (typeof step === 'string') {
                // Простой текст шага
                stepText = step.trim();
              } else if (step && typeof step === 'object') {
                // Объект с title и description
                stepTitle = step.title?.trim() || null;
                stepText = step.description?.trim() || step.text?.trim() || null;
              }
              
              // Пропускаем мусор (пустые строки, одиночные символы, нечитаемые данные)
              if (!stepText || stepText.length < 3 || /^[A-Z]$/.test(stepText)) {
                return null;
              }
              
              // Фильтруем шаги "Начать выполнение" с дублированием всего контента квеста
              // Согласно QUEST_CONTENT_STRUCTURE.md, шаги должны содержать только конкретные действия,
              // а не описание, этапы, критерии, награду или теорию
              if (stepTitle === 'Начать выполнение' && stepText) {
                // Проверяем, содержит ли описание шага признаки дублирования контента
                const suspiciousPatterns = [
                  /Этап\s+\d+/i,           // "Этап 1", "Этап 2" и т.д.
                  /Критерии\s*:/i,         // "Критерии:"
                  /Награда\s*:/i,          // "Награда:"
                  /Связанные узлы\s*:/i,   // "Связанные узлы:"
                  /Подробнее.*теория/i,    // "Подробнее (теория и примеры)"
                  /Действия на неделю/i,   // "Действия на неделю"
                ];
                
                // Если найдено 2 или более паттерна - это дублирование контента
                const patternCount = suspiciousPatterns.filter(pattern => pattern.test(stepText)).length;
                if (patternCount >= 2) {
                  // Пропускаем этот шаг - это дублирование всего контента квеста
                  return null;
                }
              }
              
              const stepCompleted = step.completed || step.status === 'completed' || step.status === 'done';
              const stepInProgress = step.status === 'in_progress' || step.status === 'active';
              
              return { stepText, stepTitle, stepCompleted, stepInProgress, originalIndex };
            })
            .filter((step: any) => step !== null);
          
          if (validSteps.length === 0) {
            return null;
          }
          
          return (
            <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Шаги выполнения</h2>
              <div className="space-y-3">
                {validSteps.map((step: any, displayIndex: number) => (
                  <div 
                    key={displayIndex} 
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                      step.stepCompleted 
                        ? 'bg-bg-secondary/50 border-system-growth/20' 
                        : step.stepInProgress
                        ? 'bg-bg-secondary/30 border-system-focus/30'
                        : 'bg-bg-panel border-ui-border-soft'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-7 h-7 rounded border-2 flex items-center justify-center transition-colors ${
                        step.stepCompleted
                          ? 'bg-system-growth border-system-growth'
                          : step.stepInProgress
                          ? 'border-system-focus bg-system-focus/10'
                          : 'border-ui-border-soft bg-bg-secondary'
                      }`}>
                        {step.stepCompleted && (
                          <svg className="w-4 h-4 text-ui-text-main" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {step.stepInProgress && !step.stepCompleted && (
                          <div className="w-3 h-3 rounded-full bg-system-focus animate-pulse" />
                        )}
                        {!step.stepInProgress && !step.stepCompleted && (
                          <span className="text-xs text-ui-text-muted font-semibold">{displayIndex + 1}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      {step.stepTitle ? (
                        <>
                          <h3 className={`text-base font-semibold mb-1 text-ui-text-main ${step.stepCompleted ? 'line-through opacity-50' : ''}`}>
                            {step.stepTitle}
                          </h3>
                          <p className={`text-sm text-ui-text-muted leading-relaxed ${step.stepCompleted ? 'line-through opacity-50' : ''}`}>
                            {step.stepText}
                          </p>
                        </>
                      ) : (
                        <p className={`text-base text-ui-text-main leading-relaxed ${step.stepCompleted ? 'line-through opacity-50' : ''}`}>
                          <span className="font-semibold">Шаг {displayIndex + 1}:</span> {step.stepText}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        {step.stepInProgress && !step.stepCompleted && (
                          <span className="text-xs px-2 py-1 bg-system-focus/20 text-system-focus rounded">В процессе</span>
                        )}
                        {step.stepCompleted && (
                          <span className="text-xs px-2 py-1 bg-system-growth/20 text-system-growth rounded">Выполнено</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* Критерии успеха - после шагов, согласно QUEST_CONTENT_STRUCTURE.md
            Проверяемые условия выполнения, без дублирования шагов или теории */}
        {quest.criteria && (() => {
          // Правильная обработка критериев
          let criteriaItems: string[] = [];
          let criteriaDescription: string | null = null;
          
          if (typeof quest.criteria === 'string') {
            const trimmed = quest.criteria.trim();
            if (trimmed.length > 0) {
              criteriaDescription = trimmed;
            }
          } else if (quest.criteria && typeof quest.criteria === 'object') {
            if (quest.criteria.items && Array.isArray(quest.criteria.items)) {
              // Фильтруем мусор: только строки длиннее 3 символов
              criteriaItems = quest.criteria.items
                .map((item) => {
                  if (typeof item === 'string') {
                    return item.trim();
                  }
                  if (item && typeof item === 'object' && typeof item.text === 'string') {
                    return item.text.trim();
                  }
                  return '';
                })
                .filter((text) => text.length > 3 && !/^[A-Z]$/.test(text));
            }
            if (quest.criteria.description && typeof quest.criteria.description === 'string') {
              const trimmed = quest.criteria.description.trim();
              if (trimmed.length > 0) {
                criteriaDescription = trimmed;
              }
            }
          }
          
          // Показываем секцию только если есть реальные данные
          if (criteriaItems.length === 0 && !criteriaDescription) {
            return null;
          }
          
          return (
            <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Критерии успеха</h2>
              <div className="space-y-3">
                {criteriaItems.length > 0 ? (
                  <ul className="space-y-2">
                    {criteriaItems.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-bg-secondary rounded-lg border border-ui-border-soft">
                        <svg className="w-5 h-5 text-system-stable mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-ui-text-main leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : criteriaDescription ? (
                  <div className="p-4 bg-bg-secondary rounded-lg border border-ui-border-soft">
                    <p className="text-ui-text-main leading-relaxed">{criteriaDescription}</p>
                  </div>
                ) : null}
              </div>
            </section>
          );
        })()}

        {/* Награда - после критериев, согласно QUEST_CONTENT_STRUCTURE.md */}
        {quest.reward && (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Награда</h2>
            <div className="space-y-4">
              {quest.reward.xp && (
                <div className="flex items-center gap-3 p-4 bg-bg-secondary rounded-lg border border-ui-border-soft">
                  <div className="w-12 h-12 rounded-lg bg-system-stable/20 border border-system-stable flex items-center justify-center">
                    <span className="text-lg font-bold text-system-stable">XP</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-ui-text-main">{quest.reward.xp}</p>
                    <p className="text-sm text-ui-text-muted">Опыт за выполнение</p>
                  </div>
                </div>
              )}
              {quest.reward.nodes && Object.keys(quest.reward.nodes).length > 0 && (
                <div className="p-4 bg-bg-secondary rounded-lg border border-ui-border-soft">
                  <p className="text-sm font-semibold text-ui-text-main mb-3">Прогресс по способностям:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(quest.reward.nodes).map(([nodeId, points]: [string, number]) => (
                      <div key={nodeId} className="px-4 py-2 bg-bg-panel border border-system-stable text-system-stable rounded-lg">
                        <span className="font-bold text-lg">+{points as number}</span>
                        <span className="text-sm ml-2">к {getNodeName(nodeId, nodeDescriptions)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {quest.reward.skill_xp && (
                <div className="p-4 bg-bg-secondary rounded-lg border border-ui-border-soft">
                  <p className="text-sm font-semibold text-ui-text-main mb-2">Прогресс по способностям:</p>
                  <p className="text-ui-text-main">+{quest.reward.skill_xp} к связанным способностям</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Связанные способности - после награды, согласно QUEST_CONTENT_STRUCTURE.md
            Всегда показываем все связанные способности здесь,
            в "Почему появился" показываем только если это причина появления */}
        {quest.linked_nodes && quest.linked_nodes.length > 0 && (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Связанные способности</h2>
            <div className="flex flex-wrap gap-3">
              {quest.linked_nodes.map((nodeId: string) => (
                <span
                  key={nodeId}
                  className="px-4 py-2 bg-bg-secondary border border-system-stable text-system-stable rounded-lg text-sm font-medium hover:bg-bg-hover transition-colors"
                >
                  {getNodeName(nodeId, nodeDescriptions)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Почему появился этот квест - последняя секция, согласно QUEST_CONTENT_STRUCTURE.md
            Показываем только если есть session_id, source или linked_nodes как причина появления.
            Связанные способности показываем здесь только если это причина появления квеста,
            иначе они показываются в отдельной секции выше. */}
        {(quest.session_id || quest.source) && (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Почему появился этот квест</h2>
            <div className="space-y-4">
              {quest.session_id && (
                <div className="p-4 bg-bg-secondary rounded-lg border border-ui-border-soft">
                  <p className="text-sm text-ui-text-muted mb-2">Связан с ситуацией:</p>
                  <Link 
                    href={`/sessions/${quest.session_id}`}
                    className="inline-flex items-center gap-2 text-system-focus hover:text-system-focus/80 hover:underline font-medium"
                  >
                    Просмотреть ситуацию
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
              {quest.source && (
                <div className="p-4 bg-bg-secondary rounded-lg border border-ui-border-soft">
                  <p className="text-sm text-ui-text-muted mb-2">Источник:</p>
                  <p className="text-ui-text-main">{translateSource(quest.source)}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Possible trade-offs - если есть в данных */}
        {(quest as any).trade_offs || (quest as any).possible_trade_offs ? (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Возможные компромиссы</h2>
            <div className="p-4 bg-bg-secondary rounded-lg border border-ui-border-soft">
              <p className="text-ui-text-main leading-relaxed whitespace-pre-wrap">
                {(quest as any).trade_offs || (quest as any).possible_trade_offs}
              </p>
            </div>
          </section>
        ) : null}

        {/* Доказательства */}
        <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-ui-text-main">Доказательства</h2>
            <Link
              href={`/evidence/new?quest_id=${quest.id}`}
              className="px-4 py-2 bg-system-focus text-ui-text-main rounded hover:bg-system-focus/80 transition-colors text-sm"
            >
              + Добавить доказательство
            </Link>
          </div>
          {evidence.length === 0 ? (
            <div className="text-center py-8 text-ui-text-muted">
              <p className="mb-2">Нет прикрепленных доказательств</p>
              <p className="text-sm">Добавьте доказательства выполнения шагов квеста</p>
            </div>
          ) : (
            <div className="space-y-3">
              {evidence.map((ev: Evidence) => (
                <div
                  key={ev.id}
                  className="p-4 bg-bg-secondary rounded-lg border border-ui-border-soft"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-ui-text-muted">
                      {new Date(ev.created_at).toLocaleDateString('ru-RU')}
                    </span>
                    <Link
                      href={`/evidence/${ev.id}`}
                      className="text-xs text-system-focus hover:underline"
                    >
                      Подробнее →
                    </Link>
                  </div>
                  <p className="text-ui-text-main text-sm line-clamp-3">{ev.text}</p>
                  {ev.tags && ev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ev.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-bg-panel border border-ui-border-soft rounded text-xs text-ui-text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Действия для активных квестов (завершение) */}
        {quest.status === 'active' && (
          <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6">
            <div className="flex justify-end">
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-system-growth text-ui-text-main rounded hover:bg-system-growth/80 transition-colors focus:ring-2 focus:ring-system-growth focus:ring-offset-2 focus:ring-offset-bg-main"
              >
                Завершить квест
              </button>
            </div>
          </section>
        )}
        </div>
      </main>
    </>
  );
}

