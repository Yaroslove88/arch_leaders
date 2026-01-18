'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { QuestType, QuestDifficulty } from './QuestCard';

export interface QuestStep {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  note?: string;
}

export interface SuccessCriterion {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface TreeImpact {
  nodeName: string;
  percentage: number;
}

export interface EvidenceItem {
  id: string;
  text: string;
  created_at: string;
}

export interface QuestDetailCardProps {
  /** ID квеста */
  questId: string;
  /** Название квеста */
  title: string;
  /** Описание квеста */
  description?: string;
  /** Гипотеза квеста (главная идея) */
  hypothesis?: string;
  /** Теория (можно свернуть/развернуть) */
  theory?: string;
  /** Тип квеста */
  questType: QuestType;
  /** Сложность квеста */
  difficulty: QuestDifficulty;
  /** Шаги квеста */
  steps: QuestStep[];
  /** Критерии успеха */
  successCriteria?: SuccessCriterion[];
  /** Влияние на дерево */
  treeImpact?: TreeImpact[];
  /** Награда XP */
  xpReward?: number;
  /** Время на выполнение (в минутах) */
  estimatedMinutes?: number;
  /** Обработчик клика по шагу (отмечает выполнение) */
  onStepToggle?: (stepId: string, isCompleted: boolean) => void;
  /** Обработчик изменения критерия успеха */
  onCriterionToggle?: (criterionId: string, isCompleted: boolean) => void;
  /** Обработчик сохранения заметки к шагу */
  onStepNoteChange?: (stepId: string, note: string) => void;
  /** Обработчик завершения квеста */
  onComplete?: () => void;
  /** Обработчик закрытия */
  onClose?: () => void;
  /** Квест уже завершён */
  isCompleted?: boolean;
  /** Доказательства прикреплённые к квесту */
  evidence?: EvidenceItem[];
  /** Обработчик добавления доказательства */
  onAddEvidence?: () => void;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Детальная карточка квеста с кликабельными шагами
 */
export function QuestDetailCard({
  questId,
  title,
  description,
  hypothesis,
  theory,
  questType,
  difficulty,
  steps,
  successCriteria,
  treeImpact,
  xpReward,
  estimatedMinutes,
  onStepToggle,
  onCriterionToggle,
  onStepNoteChange,
  onComplete,
  onClose,
  isCompleted = false,
  evidence,
  onAddEvidence,
  className,
}: QuestDetailCardProps) {
  const [showTheory, setShowTheory] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Получаем стили для типа квеста
  const getQuestTypeLabel = () => {
    switch (questType) {
      case 'micro':
        return { label: 'Микро-квест', icon: '⚡', color: 'bg-catalyst-gold/20 text-catalyst-gold' };
      case 'weekly':
        return { label: 'Недельный', icon: '📅', color: 'bg-strategic-blue/20 text-strategic-blue' };
      case 'story':
        return { label: 'Сюжетный', icon: '📖', color: 'bg-inner-violet/20 text-inner-violet' };
      default:
        return { label: 'Квест', icon: '⚔️', color: 'bg-ui-border-soft text-ui-text-muted' };
    }
  };

  // Получаем стили для сложности
  const getDifficultyLabel = () => {
    switch (difficulty) {
      case 'basic':
        return { label: 'Базовый', color: 'text-sage-green' };
      case 'intermediate':
        return { label: 'Средний', color: 'text-catalyst-gold' };
      case 'advanced':
        return { label: 'Сложный', color: 'text-tension-red' };
      default:
        return { label: difficulty, color: 'text-ash-light' };
    }
  };

  const questTypeInfo = getQuestTypeLabel();
  const difficultyInfo = getDifficultyLabel();
  const completedSteps = steps.filter((s) => s.isCompleted).length;
  const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;
  const allStepsCompleted = completedSteps === steps.length && steps.length > 0;

  // Обработчик клика по шагу
  const handleStepClick = (step: QuestStep) => {
    if (isCompleted) return;
    onStepToggle?.(step.id, !step.isCompleted);
  };

  // Начало редактирования заметки
  const startEditingNote = (step: QuestStep) => {
    setEditingNoteId(step.id);
    setNoteText(step.note || '');
  };

  // Сохранение заметки
  const saveNote = () => {
    if (editingNoteId) {
      onStepNoteChange?.(editingNoteId, noteText);
      setEditingNoteId(null);
      setNoteText('');
    }
  };

  return (
    <div
      className={cn(
        'bg-graphite-structure rounded-xl shadow-active border border-ui-border-soft',
        'max-w-lg w-full mx-auto',
        className
      )}
    >
      {/* Заголовок */}
      <div className="p-4 border-b border-ui-border-soft">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{questTypeInfo.icon}</span>
              <span className={cn('text-xs px-2 py-0.5 rounded', questTypeInfo.color)}>
                {questTypeInfo.label}
              </span>
            </div>
            <h2 className="font-bold text-lg text-ash-light">{title}</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Закрыть карточку квеста"
              className="text-ui-text-muted hover:text-ash-light p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Метаинформация */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={difficultyInfo.color}>{difficultyInfo.label}</span>
          {/* Теги способностей */}
          {treeImpact && treeImpact.slice(0, 2).map((impact, index) => (
            <span key={index} className="px-2 py-0.5 bg-obsidian-core text-ash-light rounded-lg">
              🏷️ {impact.nodeName}
            </span>
          ))}
          {estimatedMinutes && (
            <>
              <span className="text-ui-text-dim">•</span>
              <span className="text-ash-light">~{estimatedMinutes} мин.</span>
            </>
          )}
          {xpReward && (
            <>
              <span className="text-ui-text-dim">•</span>
              <span className="text-catalyst-gold font-medium">+{xpReward} XP</span>
            </>
          )}
          {isCompleted && (
            <>
              <span className="text-ui-text-dim">•</span>
              <span className="text-sage-green">✅ Выполнен</span>
            </>
          )}
        </div>
      </div>

      {/* Гипотеза - показываем только если есть осмысленный текст */}
      {hypothesis && hypothesis.trim().length > 10 && (
        <div className="px-4 py-3 border-b border-ui-border-soft bg-obsidian-core/30">
          <div className="flex items-start gap-2">
            <span className="text-lg">📝</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-ui-text-muted uppercase tracking-wide mb-2">Гипотеза</p>
              <p className="text-sm text-ash-light italic leading-relaxed">
                «{hypothesis}»
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Теория (сворачиваемая) */}
      {theory && (
        <div className="px-4 py-3 border-b border-ui-border-soft bg-inner-violet/5">
          <button
            onClick={() => setShowTheory(!showTheory)}
            className="flex items-center justify-between w-full text-left p-2 rounded hover:bg-inner-violet/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">📚</span>
              <span className="text-sm font-bold text-inner-violet uppercase tracking-wider">
                Теория и контекст
              </span>
            </div>
            <span className="text-xs text-inner-violet font-bold">
              {showTheory ? 'СВЕРНУТЬ ▲' : 'РАЗВЕРНУТЬ ▼'}
            </span>
          </button>
          {showTheory && (
            <div className="mt-2 text-sm text-ash-light leading-relaxed bg-obsidian-core/50 p-4 rounded-lg border border-inner-violet/20 shadow-inner">
              {theory}
            </div>
          )}
        </div>
      )}

      {/* Прогресс */}
      <div className="px-4 py-3 border-b border-ui-border-soft">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-ash-light">Прогресс</span>
          <span className="text-xs text-ash-light">
            {completedSteps} из {steps.length} шагов
          </span>
        </div>
        <div className="w-full bg-obsidian-core rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              allStepsCompleted ? 'bg-system-growth' : 'bg-system-focus'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Шаги */}
      <div className="px-4 py-3 border-b border-ui-border-soft">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🗺️</span>
          <p className="text-xs font-semibold text-ui-text-muted uppercase tracking-wide">Путь выполнения</p>
        </div>
        <div className="space-y-2">
          {steps.map((step, index) => {
            // Определяем текущий активный шаг (первый незавершённый)
            const isActive = !step.isCompleted && (index === 0 || steps[index - 1]?.isCompleted);
            
            return (
              <div key={step.id} className="group">
                {/* Шаг */}
                <button
                  onClick={() => handleStepClick(step)}
                  disabled={isCompleted}
                  className={cn(
                    'w-full text-left flex items-start gap-3 p-3 rounded-lg transition-all',
                    'bg-obsidian-core hover:bg-obsidian-core/60',
                    !isCompleted && 'cursor-pointer',
                    isCompleted && 'cursor-default opacity-80',
                    isActive && !isCompleted && 'ring-2 ring-system-focus/50'
                  )}
                >
                  {/* Иконка статуса */}
                  <div className="flex-shrink-0 mt-0.5">
                    {step.isCompleted ? (
                      <span className="text-lg">✅</span>
                    ) : isActive ? (
                      <span className="text-lg">🔵</span>
                    ) : (
                      <span className="text-lg text-ash-light opacity-50">○</span>
                    )}
                  </div>

                  {/* Текст */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        step.isCompleted
                          ? 'text-ui-text-dim line-through'
                          : isActive
                          ? 'text-ash-light'
                          : 'text-ui-text-muted'
                      )}
                    >
                      Шаг {index + 1}: {step.title}
                      {isActive && !isCompleted && <span className="ml-2 text-xs text-strategic-blue font-normal">← ТЫ ЗДЕСЬ</span>}
                    </p>
                    {step.description && (
                      <p className="text-xs text-ui-text-muted mt-1">{step.description}</p>
                    )}
                    {/* Заметка */}
                    {step.note && editingNoteId !== step.id && (
                      <p className="text-xs text-strategic-blue mt-1 italic">
                        📝 {step.note}
                      </p>
                    )}
                  </div>
                </button>

              {/* Редактирование заметки */}
              {editingNoteId === step.id ? (
                <div className="mt-2 ml-8">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Добавьте заметку..."
                    className="w-full text-sm p-2 rounded border border-ui-border-soft bg-obsidian-core text-ash-light resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={saveNote}
                      className="text-xs px-2 py-1 bg-system-focus text-white rounded"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => setEditingNoteId(null)}
                      className="text-xs px-2 py-1 text-ui-text-muted hover:text-ash-light transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                !isCompleted && (
                  <button
                    onClick={() => startEditingNote(step)}
                    className="mt-1 ml-8 text-xs text-ash-light opacity-70 hover:text-strategic-blue hover:opacity-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    + Добавить заметку
                  </button>
                )
              )}
            </div>
          );
        })}
        </div>
        <div className="mt-3 text-xs text-ui-text-dim p-2 bg-obsidian-core rounded">
          💡 Подсказка: Шаги можно отмечать как выполненные. Добавление записей — опционально.
        </div>
      </div>

      {/* Критерии успеха */}
      {successCriteria && successCriteria.length > 0 && (
        <div className="px-4 py-3 border-b border-ui-border-soft">
          <p className="text-sm font-medium text-ash-light mb-3">🎯 КРИТЕРИИ УСПЕХА</p>
          <div className="space-y-2">
            {successCriteria.map((criterion) => (
              <button
                key={criterion.id}
                onClick={() => !isCompleted && onCriterionToggle?.(criterion.id, !criterion.isCompleted)}
                disabled={isCompleted}
                className={cn(
                  'w-full text-left flex items-center gap-3 p-2 rounded transition-colors',
                  'hover:bg-obsidian-core',
                  !isCompleted && 'cursor-pointer'
                )}
              >
                <div className="flex-shrink-0 flex items-center justify-center">
                  {criterion.isCompleted ? (
                    <span className="text-xl text-sage-green leading-none">☑</span>
                  ) : (
                    <span className="text-xl text-ash-light opacity-50 leading-none">☐</span>
                  )}
                </div>
                <p
                  className={cn(
                    'text-sm leading-tight',
                    criterion.isCompleted ? 'text-ash-light opacity-60 line-through' : 'text-ash-light'
                  )}
                >
                  {criterion.text}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}


      {/* Доказательства - кнопка как рефлексия в кейсах */}
      {onAddEvidence && !isCompleted && (
        <div className="px-4 py-3 border-b border-ui-border-soft">
          <button
            onClick={onAddEvidence}
            className="w-full py-3 px-4 bg-catalyst-gold/10 border-2 border-catalyst-gold/30 rounded-lg hover:border-catalyst-gold hover:bg-catalyst-gold/15 transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📎</span>
              <span className="text-sm font-semibold text-catalyst-gold">Доказательства</span>
              {evidence && evidence.length > 0 && (
                <span className="text-xs text-catalyst-gold/60">({evidence.length})</span>
              )}
            </div>
            <p className="text-xs text-catalyst-gold/80">
              {evidence && evidence.length > 0 
                ? `У тебя ${evidence.length} ${evidence.length === 1 ? 'доказательство' : evidence.length < 5 ? 'доказательства' : 'доказательств'}`
                : 'Зафиксируй следы практики'}
            </p>
          </button>
        </div>
      )}
      
      {/* Показать существующие доказательства, если есть и квест завершён */}
      {isCompleted && evidence && evidence.length > 0 && (
        <div className="px-4 py-3 border-b border-ui-border-soft">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📎</span>
            <p className="text-xs font-semibold text-ui-text-muted uppercase tracking-wide">Доказательства</p>
            <span className="text-xs text-ui-text-dim">({evidence.length})</span>
          </div>
          <div className="space-y-2">
            {evidence.slice(0, 3).map((ev) => (
              <div
                key={ev.id}
                className="p-3 bg-obsidian-core rounded-lg"
              >
                <p className="text-sm text-ash-light line-clamp-2">{ev.text}</p>
                <p className="text-xs text-ui-text-dim mt-1">
                  {new Date(ev.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            ))}
            {evidence.length > 3 && (
              <p className="text-xs text-ui-text-dim">
                ... и ещё {evidence.length - 3}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Кнопки */}
      {!isCompleted && (
        <div className="p-4">
          {onComplete && (
            <button
              onClick={onComplete}
              disabled={!allStepsCompleted}
              className={cn(
                'w-full py-3 rounded-lg font-semibold transition-colors text-sm',
                allStepsCompleted
                  ? 'bg-system-growth text-white hover:bg-system-growth/90 shadow-sm'
                  : 'bg-obsidian-core text-ash-light opacity-60 cursor-not-allowed'
              )}
            >
              {allStepsCompleted ? '✓ Завершить квест' : `Выполни все шаги (${completedSteps}/${steps.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestDetailCard;
