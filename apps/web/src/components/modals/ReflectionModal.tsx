'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface ReflectionModalProps {
  /** Открыто ли модальное окно */
  isOpen: boolean;
  /** Контекст рефлексии */
  context?: {
    type: 'quest' | 'case' | 'situation' | 'node';
    id: string;
    title: string;
    /** Выбранный вариант (для кейсов) */
    selectedOption?: string;
    /** Название выбранного варианта (для кейсов) */
    selectedOptionTitle?: string;
  };
  /** Вопрос для размышления */
  reflectionQuestion?: string;
  /** Обработчик закрытия */
  onClose: () => void;
  /** Обработчик сохранения */
  onSave: (data: ReflectionFormData) => void;
  /** Пропустить рефлексию */
  onSkip?: () => void;
  /** Загрузка */
  isLoading?: boolean;
}

export interface ReflectionFormData {
  /** Текст рефлексии */
  text: string;
  /** Связанный контекст */
  contextType?: 'quest' | 'case' | 'situation' | 'node';
  contextId?: string;
}

/**
 * Модальное окно для рефлексии после кейса
 * Согласно DESIGN_ARCHITECTURE_CARDS_MODALS.md:771-814
 */
export function ReflectionModal({
  isOpen,
  context,
  reflectionQuestion,
  onClose,
  onSave,
  onSkip,
  isLoading = false,
}: ReflectionModalProps) {
  const [formData, setFormData] = useState<ReflectionFormData>({
    text: '',
    contextType: context?.type,
    contextId: context?.id,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ReflectionFormData, string>>>({});
  
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
        contextType: context?.type,
        contextId: context?.id,
      });
      setErrors({});
      // Фокус на textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, context]);

  // Валидация (опционально, но если заполнено, должно быть осмысленным)
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ReflectionFormData, string>> = {};

    // Рефлексия опциональна, но если заполнена, должна быть осмысленной
    if (formData.text.trim() && formData.text.trim().length < 10) {
      newErrors.text = 'Опишите подробнее (минимум 10 символов)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработчик отправки
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  // Обработчик изменения поля
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, text: value }));
    if (errors.text) {
      setErrors((prev) => ({ ...prev, text: undefined }));
    }
  };

  // Пример текста для placeholder
  const exampleText = reflectionQuestion 
    ? 'Часто. Я думаю, что задача очевидна, но забываю, что контекст помогает человеку понять приоритет.'
    : 'Твои мысли... 1-2 предложения';

  // Вопрос для отображения
  const displayQuestion = reflectionQuestion || 
    'Что ты узнал из этого опыта?';

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
        aria-labelledby="reflection-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="p-4 border-b border-ui-border-soft">
          <div className="flex justify-between items-start">
            <div>
              <h2 id="reflection-modal-title" className="font-bold text-lg text-ash-light flex items-center gap-2">
                <span>🪞</span>
                <span>РЕФЛЕКСИЯ (опционально)</span>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-ui-text-muted hover:text-ash-light p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              aria-label="Закрыть модальное окно рефлексии"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {/* Контекст */}
            {context && (
              <>
                <div>
                  <p className="text-sm text-ash-light flex items-center gap-2">
                    <span>📊</span>
                    <span>
                      {context.type === 'case' ? 'Кейс' : 
                       context.type === 'quest' ? 'Квест' : 
                       context.type === 'situation' ? 'Ситуация' : 'Узел'}: «{context.title}»
                    </span>
                  </p>
                  {context.type === 'case' && context.selectedOption && (
                    <p className="text-sm text-ui-text-muted mt-1 ml-6">
                      Твой выбор: {context.selectedOption} {context.selectedOptionTitle && `— ${context.selectedOptionTitle}`}
                    </p>
                  )}
                </div>

                {/* Разделитель */}
                <div className="border-t border-ui-border-soft"></div>
              </>
            )}

            {/* Вопрос для размышления */}
            <div>
              <label className="block text-sm font-medium text-ash-light mb-2 flex items-center gap-2">
                <span>💭</span>
                <span>Вопрос для размышления</span>
              </label>
              <p className="text-sm text-ash-light mb-3 italic">
                «{displayQuestion}»
              </p>
            </div>

            {/* Текстовое поле */}
            <div>
              <textarea
                ref={textareaRef}
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
                  Пример: «{exampleText}»
                </p>
              )}
            </div>

            {/* Мотивационный текст */}
            <div className="p-3 bg-obsidian-core rounded-lg">
              <p className="text-sm text-ui-text-muted flex items-start gap-2">
                <span>💡</span>
                <span>
                  Рефлексия помогает закрепить инсайты и создаёт личный журнал размышлений.
                </span>
              </p>
            </div>
          </div>

          {/* Разделитель */}
          <div className="border-t border-ui-border-soft"></div>

          {/* Кнопки */}
          <div className="p-4 flex gap-3">
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="py-3 px-4 rounded-lg border border-ui-border-soft text-ash-light hover:bg-obsidian-core transition-colors"
                disabled={isLoading}
              >
                Пропустить
              </button>
            )}
            <div className="flex-1" />
            <button
              type="submit"
              className="py-3 px-6 rounded-lg bg-system-focus text-white hover:bg-system-focus/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              disabled={isLoading}
            >
              <span>💾</span>
              <span>{isLoading ? 'Сохранение...' : 'Сохранить и продолжить'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReflectionModal;
