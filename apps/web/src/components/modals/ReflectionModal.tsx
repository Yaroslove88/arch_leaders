'use client';

import { useState, useRef, useEffect } from 'react';
import { Modal, Button, Textarea } from '@leadership-architect/ui';

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
 * Использует единый Modal компонент с focus trap
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
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const title = (
    <span className="flex items-center gap-2">
      <span>🪞</span>
      <span>РЕФЛЕКСИЯ (опционально)</span>
    </span>
  );

  const footer = (
    <div className="flex gap-3">
      {onSkip && (
        <Button
          variant="secondary"
          onClick={onSkip}
          disabled={isLoading}
        >
          Пропустить
        </Button>
      )}
      <div className="flex-1" />
      <Button
        variant="primary"
        onClick={handleSubmit}
        loading={isLoading}
      >
        <span>💾</span>
        <span>Сохранить и продолжить</span>
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <Textarea
            ref={textareaRef}
            value={formData.text}
            onChange={handleChange}
            placeholder={exampleText}
            rows={6}
            hasError={!!errors.text}
            className="placeholder:italic"
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
      </form>
    </Modal>
  );
}

export default ReflectionModal;
