'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface SuccessCriterion {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface AddEvidenceModalProps {
  /** Открыто ли модальное окно */
  isOpen: boolean;
  /** ID связанного квеста */
  questId?: string;
  /** Название связанного квеста */
  questTitle?: string;
  /** Критерии успеха квеста (для чек-листа) */
  successCriteria?: SuccessCriterion[];
  /** ID связанной ситуации */
  situationId?: string;
  /** Название связанной ситуации */
  situationTitle?: string;
  /** ID связанного узла */
  nodeId?: string;
  /** Название связанного узла */
  nodeName?: string;
  /** Обработчик закрытия */
  onClose: () => void;
  /** Обработчик сохранения */
  onSave: (data: EvidenceFormData) => void;
  /** Загрузка */
  isLoading?: boolean;
}

export interface EvidenceFormData {
  /** Текст описания события */
  text: string;
  /** Дата события */
  eventDate: string;
  /** ID связанного квеста */
  questId?: string;
  /** ID связанной ситуации */
  situationId?: string;
  /** ID связанного узла */
  nodeId?: string;
  /** Отмеченные критерии успеха */
  completedCriteria?: string[];
}

/**
 * Модальное окно для добавления рефлексии
 * Согласно DESIGN_ARCHITECTURE_CARDS_MODALS.md:720-767
 */
export function AddEvidenceModal({
  isOpen,
  questId,
  questTitle,
  successCriteria = [],
  situationId,
  situationTitle,
  nodeId,
  nodeName,
  onClose,
  onSave,
  isLoading = false,
}: AddEvidenceModalProps) {
  const [formData, setFormData] = useState<EvidenceFormData>({
    text: '',
    eventDate: new Date().toISOString().split('T')[0], // Сегодня по умолчанию
    questId,
    situationId,
    nodeId,
    completedCriteria: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EvidenceFormData, string>>>({});
  const [selectedCriteria, setSelectedCriteria] = useState<Set<string>>(new Set());
  
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Сброс формы при открытии
  useEffect(() => {
    if (isOpen) {
      setFormData({
        text: '',
        eventDate: new Date().toISOString().split('T')[0],
        questId,
        situationId,
        nodeId,
        completedCriteria: [],
      });
      setSelectedCriteria(new Set());
      setErrors({});
      // Фокус на textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, questId, situationId, nodeId]);

  // Валидация
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EvidenceFormData, string>> = {};

    if (!formData.text.trim()) {
      newErrors.text = 'Опишите, что произошло';
    } else if (formData.text.trim().length < 20) {
      newErrors.text = 'Опишите подробнее (минимум 20 символов)';
    }

    if (!formData.eventDate) {
      newErrors.eventDate = 'Выберите дату события';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработчик отправки
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...formData,
        completedCriteria: Array.from(selectedCriteria),
      });
    }
  };

  // Обработчик изменения поля
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof EvidenceFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Переключение критерия успеха
  const toggleCriterion = (criterionId: string) => {
    setSelectedCriteria((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(criterionId)) {
        newSet.delete(criterionId);
      } else {
        newSet.add(criterionId);
      }
      return newSet;
    });
  };

  // Пример текста для placeholder
  const exampleText = questTitle 
    ? `Провёл встречу по планированию. Когда команда начала спорить о приоритетах, я выдержал паузу 15 секунд вместо того, чтобы сразу предложить решение. В итоге команда сама нашла компромисс.`
    : `Опиши, что ты сделал и что получилось...`;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-graphite-structure rounded-xl shadow-active border border-ui-border-soft max-w-lg w-full my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="p-4 border-b border-ui-border-soft">
          <div className="flex justify-between items-start">
            <div>
              <h2 id="evidence-modal-title" className="font-bold text-lg text-ash-light flex items-center gap-2">
                <span>💭</span>
                <span>Добавить рефлексию</span>
              </h2>
              {questTitle && (
                <p className="text-sm text-ui-text-muted mt-2 flex items-center gap-2">
                  <span>⚔️</span>
                  <span>Квест: "{questTitle}"</span>
                </p>
              )}
              {(situationTitle || nodeName) && !questTitle && (
                <p className="text-xs text-ui-text-muted mt-1">
                  {situationTitle ? `Ситуация: ${situationTitle}` : `Узел: ${nodeName}`}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-ui-text-muted hover:text-ash-light p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              aria-label="Закрыть модальное окно добавления рефлексии"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {/* Что произошло */}
            <div>
              <label htmlFor="text" className="block text-sm font-medium text-ash-light mb-2 flex items-center gap-2">
                <span>📝</span>
                <span>Что произошло?</span>
              </label>
              <textarea
                ref={textareaRef}
                id="text"
                name="text"
                value={formData.text}
                onChange={handleChange}
                placeholder={exampleText}
                rows={6}
                className={cn(
                  'w-full p-3 rounded-lg border bg-obsidian-core text-ash-light resize-none',
                  'placeholder:text-ui-text-dim placeholder:italic',
                  errors.text ? 'border-system-critical' : 'border-ui-border-soft'
                )}
              />
              {errors.text && (
                <p className="text-xs text-tension-red mt-1">{errors.text}</p>
              )}
              {!formData.text && (
                <p className="text-xs text-ui-text-muted mt-2 italic">
                  Пример: "{exampleText}"
                </p>
              )}
            </div>

            {/* Критерии успеха */}
            {successCriteria && successCriteria.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-ash-light mb-2 flex items-center gap-2">
                  <span>✅</span>
                  <span>Критерии успеха</span>
                </label>
                <div className="p-3 bg-obsidian-core rounded-lg border border-ui-border-soft space-y-2">
                  {successCriteria.map((criterion) => {
                    const isSelected = selectedCriteria.has(criterion.id);
                    const isCompleted = criterion.isCompleted;
                    return (
                      <button
                        key={criterion.id}
                        type="button"
                        onClick={() => toggleCriterion(criterion.id)}
                        className={cn(
                          'w-full text-left flex items-start gap-3 p-2 rounded transition-colors',
                          'hover:bg-obsidian-core',
                          isSelected && 'bg-system-focus/10'
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {isSelected || isCompleted ? (
                            <span className="text-base">☑</span>
                          ) : (
                            <span className="text-base text-ui-text-dim">☐</span>
                          )}
                        </div>
                        <p
                          className={cn(
                            'text-sm',
                            isSelected || isCompleted
                              ? 'text-ash-light'
                              : 'text-ui-text-muted'
                          )}
                        >
                          {criterion.text}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Дата события */}
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-ash-light mb-2 flex items-center gap-2">
                <span>📅</span>
                <span>Дата события</span>
              </label>
              <input
                type="date"
                id="eventDate"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]} // Нельзя выбрать будущую дату
                className={cn(
                  'w-full p-3 rounded-lg border bg-obsidian-core text-ash-light',
                  errors.eventDate ? 'border-system-critical' : 'border-ui-border-soft'
                )}
              />
              {errors.eventDate && (
                <p className="text-xs text-tension-red mt-1">{errors.eventDate}</p>
              )}
            </div>
          </div>

          {/* Разделитель */}
          <div className="border-t border-ui-border-soft"></div>

          {/* Кнопки */}
          <div className="p-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-ui-border-soft text-ash-light hover:bg-obsidian-core transition-colors"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-lg bg-system-focus text-white hover:bg-system-focus/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <span>💾</span>
              <span>{isLoading ? 'Сохранение...' : 'Сохранить'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEvidenceModal;
