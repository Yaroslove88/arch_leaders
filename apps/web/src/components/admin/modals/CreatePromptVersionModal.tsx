'use client';

import { useState } from 'react';
import { createPromptVersion, Prompt } from '../../../lib/admin-api';
import { PromptEditor, JsonEditor } from '../PromptEditor';

interface CreatePromptVersionModalProps {
  prompt: Prompt;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePromptVersionModal({
  prompt,
  onClose,
  onSuccess,
}: CreatePromptVersionModalProps) {
  const [template, setTemplate] = useState(prompt.template || '');
  const [purpose, setPurpose] = useState(prompt.purpose || '');
  const [schemaText, setSchemaText] = useState(
    prompt.schema ? JSON.stringify(prompt.schema, null, 2) : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useMonaco, setUseMonaco] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!template.trim() || !purpose.trim()) {
      setError('Заполните обязательные поля');
      return;
    }

    let schema: Record<string, unknown> | undefined;
    if (schemaText.trim()) {
      try {
        schema = JSON.parse(schemaText);
      } catch {
        setError('Некорректный JSON в схеме');
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      await createPromptVersion(prompt.prompt_id, {
        template: template.trim(),
        purpose: purpose.trim(),
        schema,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Не удалось создать версию');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-floating max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-ui-border-soft flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-ash-light">
                Создать версию промпта
              </h3>
              <p className="text-sm text-ui-text-muted mt-1">
                {prompt.prompt_id} • Текущая версия: {prompt.version}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-ui-text-muted hover:text-ash-light text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-ash-light mb-1">
                Назначение <span className="text-tension-red">*</span>
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Например: Анализ записи пользователя"
                className="w-full px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-transparent"
                required
              />
            </div>

            {/* Template */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-ash-light">
                  Шаблон <span className="text-tension-red">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setUseMonaco(!useMonaco)}
                  className="text-xs text-ui-text-muted hover:text-ash-light"
                >
                  {useMonaco ? 'Простой режим' : 'Редактор кода'}
                </button>
              </div>
              {useMonaco ? (
                <PromptEditor
                  value={template}
                  onChange={setTemplate}
                  height="300px"
                />
              ) : (
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="Введите шаблон промпта..."
                  rows={12}
                  className="w-full px-4 py-3 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-transparent font-mono text-sm resize-none"
                  required
                />
              )}
              <p className="text-xs text-ui-text-muted mt-1">
                Используйте {'{{variable}}'} для переменных
              </p>
            </div>

            {/* Schema */}
            <div>
              <label className="block text-sm font-medium text-ash-light mb-1">
                Ожидаемая схема ответа
                <span className="text-ui-text-muted font-normal ml-1">(JSON, опционально)</span>
              </label>
              {useMonaco ? (
                <JsonEditor
                  value={schemaText}
                  onChange={setSchemaText}
                  height="200px"
                />
              ) : (
                <textarea
                  value={schemaText}
                  onChange={(e) => setSchemaText(e.target.value)}
                  placeholder='{"type": "object", "properties": {...}}'
                  rows={6}
                  className="w-full px-4 py-3 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-transparent font-mono text-sm resize-none"
                />
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-tension-red/10 border border-tension-red/30 rounded-lg text-sm text-tension-red">
                {error}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-ui-border-soft flex gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-obsidian-core border border-ui-border-soft rounded-lg text-ui-text-muted hover:text-ash-light hover:border-ui-border-strong transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting || !template.trim() || !purpose.trim()}
              className="flex-1 py-2 px-4 bg-strategic-blue hover:bg-strategic-blue/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Создание...' : 'Создать версию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
