'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea, Field } from '@leadership-architect/ui';

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
 * Использует единый Modal компонент с focus trap
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

  const title = (
    <div>
      <span className="flex items-center gap-2">
        <span>➕</span>
        <span>Добавить ситуацию</span>
      </span>
      {nodeName && (
        <p className="text-xs text-ui-text-muted mt-1 font-normal">
          Связано с: {nodeName}
        </p>
      )}
    </div>
  );

  const footer = (
    <div className="flex gap-3">
      <Button
        variant="secondary"
        onClick={onClose}
        disabled={isLoading}
      >
        Отмена
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        loading={isLoading}
      >
        Сохранить
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
        {/* Подсказка */}
        <div className="bg-obsidian-core p-3 rounded-lg">
          <p className="text-xs text-ui-text-muted">
            💡 <strong>Совет:</strong> Опишите конкретную ситуацию из вашей практики.
            Чем детальнее — тем полезнее для рефлексии.
          </p>
        </div>

        {/* Краткое описание */}
        <Field
          label="Краткое описание"
          htmlFor="title"
          required
          error={errors.title}
        >
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="О чём ситуация?"
            hasError={!!errors.title}
            maxLength={100}
          />
        </Field>

        {/* Подробное описание */}
        <Field
          label="Что произошло?"
          htmlFor="description"
          required
          error={errors.description}
        >
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Опишите ситуацию подробнее..."
            rows={4}
            hasError={!!errors.description}
          />
          <p className="text-xs text-ui-text-muted mt-1">
            {formData.description.length}/500 символов
          </p>
        </Field>

        {/* Дата */}
        <Field
          label="Когда это было?"
          htmlFor="date"
        >
          <Input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
          />
        </Field>

        {/* Дополнительные поля (сворачиваемые) */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-strategic-blue hover:text-strategic-blue/80 transition-colors"
          >
            <span>{showAdvanced ? '▼' : '▶'}</span>
            <span>Дополнительные поля (необязательно)</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-4">
              {/* Контекст */}
              <Field
                label="Контекст"
                htmlFor="context"
              >
                <Input
                  id="context"
                  name="context"
                  value={formData.context}
                  onChange={handleChange}
                  placeholder="Где, с кем, при каких обстоятельствах?"
                />
              </Field>

              {/* Что сделал */}
              <Field
                label="Что вы сделали?"
                htmlFor="action"
              >
                <Textarea
                  id="action"
                  name="action"
                  value={formData.action}
                  onChange={handleChange}
                  placeholder="Ваши действия в этой ситуации..."
                  rows={2}
                />
              </Field>

              {/* Результат */}
              <Field
                label="Результат"
                htmlFor="result"
              >
                <Textarea
                  id="result"
                  name="result"
                  value={formData.result}
                  onChange={handleChange}
                  placeholder="К чему это привело?"
                  rows={2}
                />
              </Field>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default AddSituationModal;
