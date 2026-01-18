'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface AddSituationModalProps {
  /** Открыто ли модальное окно */
  isOpen: boolean;
  /** Название связанного узла */
  nodeName?: string;
  /** ID связанного узла */
  nodeId?: string;
  /** Обработчик закрытия */
  onClose: () => void;
  /** Обработчик сохранения */
  onSave: (data: SituationFormData) => void;
  /** Загрузка */
  isLoading?: boolean;
}

export interface SituationFormData {
  /** Краткое описание ситуации */
  title: string;
  /** Подробное описание */
  description: string;
  /** Дата ситуации */
  date?: string;
  /** Контекст (где произошло) */
  context?: string;
  /** Что сделал */
  action?: string;
  /** Результат */
  result?: string;
  /** Связанный узел */
  nodeId?: string;
}

/**
 * Модальное окно для добавления ситуации
 * Используется для записи практического опыта
 */
export function AddSituationModal({
  isOpen,
  nodeName,
  nodeId,
  onClose,
  onSave,
  isLoading = false,
}: AddSituationModalProps) {
  const [formData, setFormData] = useState<SituationFormData>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    context: '',
    action: '',
    result: '',
    nodeId,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SituationFormData, string>>>({});
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Закрытие поEscape
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
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        context: '',
        action: '',
        result: '',
        nodeId,
      });
      setErrors({});
      setShowAdvanced(false);
    }
  }, [isOpen, nodeId]);

  // Валидация
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SituationFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Введите краткое описание';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Опишите ситуацию подробнее';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Минимум 20 символов';
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
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Убираем ошибку при изменении
    if (errors[name as keyof SituationFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

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
        aria-labelledby="situation-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="p-4 border-b border-ui-border-soft">
          <div className="flex justify-between items-start">
            <div>
              <h2 id="situation-modal-title" className="font-bold text-lg text-ash-light">
                ➕ Добавить ситуацию
              </h2>
              {nodeName && (
                <p className="text-xs text-ui-text-muted mt-1">
                  Связано с: {nodeName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-ui-text-muted hover:text-ash-light p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              aria-label="Закрыть модальное окно добавления ситуации"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {/* Подсказка */}
            <div className="bg-obsidian-core p-3 rounded-lg">
              <p className="text-xs text-ui-text-muted">
                💡 <strong>Совет:</strong> Опишите конкретную ситуацию из вашей практики.
                Чем детальнее — тем полезнее для рефлексии.
              </p>
            </div>

            {/* Краткое описание */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-ash-light mb-1">
                Краткое описание *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="О чём ситуация?"
                className={cn(
                  'w-full p-3 rounded-lg border bg-obsidian-core text-ash-light',
                  errors.title ? 'border-system-critical' : 'border-ui-border-soft'
                )}
                maxLength={100}
              />
              {errors.title && (
                <p className="text-xs text-system-critical mt-1">{errors.title}</p>
              )}
            </div>

            {/* Подробное описание */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-ash-light mb-1">
                Что произошло? *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Опишите ситуацию подробнее..."
                rows={4}
                className={cn(
                  'w-full p-3 rounded-lg border bg-obsidian-core text-ash-light resize-none',
                  errors.description ? 'border-system-critical' : 'border-ui-border-soft'
                )}
              />
              {errors.description && (
                <p className="text-xs text-system-critical mt-1">{errors.description}</p>
              )}
              <p className="text-xs text-ui-text-muted mt-1">
                {formData.description.length}/500 символов
              </p>
            </div>

            {/* Дата */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-ash-light mb-1">
                Когда это было?
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-ui-border-soft bg-obsidian-core text-ash-light"
              />
            </div>

            {/* Дополнительные поля (сворачиваемые) */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-system-focus"
              >
                <span>{showAdvanced ? '▼' : '▶'}</span>
                <span>Дополнительные поля (необязательно)</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-4">
                  {/* Контекст */}
                  <div>
                    <label htmlFor="context" className="block text-sm font-medium text-ash-light mb-1">
                      Контекст
                    </label>
                    <input
                      type="text"
                      id="context"
                      name="context"
                      value={formData.context}
                      onChange={handleChange}
                      placeholder="Где, с кем, при каких обстоятельствах?"
                      className="w-full p-3 rounded-lg border border-ui-border-soft bg-obsidian-core text-ash-light"
                    />
                  </div>

                  {/* Что сделал */}
                  <div>
                    <label htmlFor="action" className="block text-sm font-medium text-ash-light mb-1">
                      Что вы сделали?
                    </label>
                    <textarea
                      id="action"
                      name="action"
                      value={formData.action}
                      onChange={handleChange}
                      placeholder="Ваши действия в этой ситуации..."
                      rows={2}
                      className="w-full p-3 rounded-lg border border-ui-border-soft bg-obsidian-core text-ash-light resize-none"
                    />
                  </div>

                  {/* Результат */}
                  <div>
                    <label htmlFor="result" className="block text-sm font-medium text-ash-light mb-1">
                      Результат
                    </label>
                    <textarea
                      id="result"
                      name="result"
                      value={formData.result}
                      onChange={handleChange}
                      placeholder="К чему это привело?"
                      rows={2}
                      className="w-full p-3 rounded-lg border border-ui-border-soft bg-obsidian-core text-ash-light resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Кнопки */}
          <div className="p-4 border-t border-ui-border-soft flex gap-3">
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
              className="flex-1 py-3 rounded-lg bg-system-focus text-white hover:bg-system-focus/90 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSituationModal;
