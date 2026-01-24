'use client';

import { useState } from 'react';
import { activatePrompt, Prompt } from '../../../lib/admin-api';

interface ConfirmActivationModalProps {
  prompt: Prompt;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConfirmActivationModal({
  prompt,
  onClose,
  onSuccess,
}: ConfirmActivationModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Укажите причину активации');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await activatePrompt(prompt.prompt_id, prompt.version, reason.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Не удалось активировать версию');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-floating max-w-md w-full">
        <div className="p-6 border-b border-ui-border-soft">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-ash-light">
              Активировать версию
            </h3>
            <button
              onClick={onClose}
              className="text-ui-text-muted hover:text-ash-light text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info */}
          <div className="bg-obsidian-core border border-ui-border-soft rounded-lg p-4">
            <div className="text-sm text-ui-text-muted mb-1">Промпт</div>
            <div className="font-mono text-ash-light">{prompt.prompt_id}</div>
            <div className="mt-3 text-sm text-ui-text-muted mb-1">Версия</div>
            <div className="text-ash-light">v{prompt.version}</div>
            <div className="mt-3 text-sm text-ui-text-muted mb-1">Назначение</div>
            <div className="text-ash-light">{prompt.purpose}</div>
          </div>

          {/* Warning */}
          <div className="bg-catalyst-gold/10 border border-catalyst-gold/30 rounded-lg p-4 text-sm text-catalyst-gold">
            <strong>Внимание:</strong> Активация этой версии сделает её основной для всех пользователей. 
            Текущая активная версия будет помечена как deprecated.
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-ash-light mb-1">
              Причина активации <span className="text-tension-red">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Например: Исправлена ошибка в парсинге, улучшены результаты..."
              rows={3}
              className="w-full px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-tension-red/10 border border-tension-red/30 rounded-lg text-sm text-tension-red">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-obsidian-core border border-ui-border-soft rounded-lg text-ui-text-muted hover:text-ash-light hover:border-ui-border-strong transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="flex-1 py-2 px-4 bg-sage-green hover:bg-sage-green/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Активация...' : 'Активировать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
