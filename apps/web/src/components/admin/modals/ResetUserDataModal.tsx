'use client';

import { useState } from 'react';
import { resetUserData, ResetScope } from '../../../lib/admin-api';

interface ResetUserDataModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SCOPES: { value: ResetScope; label: string; description: string; danger: number }[] = [
  {
    value: 'progress',
    label: 'Прогресс квестов',
    description: 'Сбросить все квесты пользователя',
    danger: 1,
  },
  {
    value: 'tree',
    label: 'Дерево способностей',
    description: 'Удалить все evidence и раскрытые способности',
    danger: 2,
  },
  {
    value: 'all',
    label: 'Все данные',
    description: 'Полный сброс: записи, сессии, квесты, evidence',
    danger: 3,
  },
];

export function ResetUserDataModal({
  userId,
  userName,
  onClose,
  onSuccess,
}: ResetUserDataModalProps) {
  const [scope, setScope] = useState<ResetScope>('progress');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedScope = SCOPES.find(s => s.value === scope)!;
  const confirmRequired = scope === 'all' ? userName : 'СБРОСИТЬ';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (step === 1) {
      if (!reason.trim() || reason.trim().length < 5) {
        setError('Укажите причину (минимум 5 символов)');
        return;
      }
      setError(null);
      setStep(2);
      return;
    }

    // Step 2: confirm
    if (confirmText !== confirmRequired) {
      setError(`Введите "${confirmRequired}" для подтверждения`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await resetUserData(userId, { scope, reason: reason.trim() });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Не удалось сбросить данные');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-floating max-w-md w-full">
        <div className="p-6 border-b border-ui-border-soft">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-semibold text-ash-light">
                Сброс данных пользователя
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-ui-text-muted hover:text-ash-light text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {step === 1 ? (
            <>
              {/* User Info */}
              <div className="bg-obsidian-core border border-ui-border-soft rounded-lg p-4">
                <div className="text-sm text-ui-text-muted mb-1">Пользователь</div>
                <div className="font-medium text-ash-light">@{userName}</div>
                <div className="text-xs text-ui-text-dim font-mono mt-1">{userId}</div>
              </div>

              {/* Scope Selection */}
              <div>
                <label className="block text-sm font-medium text-ash-light mb-2">
                  Что сбросить?
                </label>
                <div className="space-y-2">
                  {SCOPES.map((s) => (
                    <label
                      key={s.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        scope === s.value
                          ? s.danger === 3
                            ? 'border-tension-red bg-tension-red/10'
                            : s.danger === 2
                            ? 'border-catalyst-gold bg-catalyst-gold/10'
                            : 'border-strategic-blue bg-strategic-blue/10'
                          : 'border-ui-border-soft hover:border-ui-border-strong'
                      }`}
                    >
                      <input
                        type="radio"
                        name="scope"
                        value={s.value}
                        checked={scope === s.value}
                        onChange={(e) => setScope(e.target.value as ResetScope)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          scope === s.value
                            ? s.danger === 3
                              ? 'border-tension-red'
                              : s.danger === 2
                              ? 'border-catalyst-gold'
                              : 'border-strategic-blue'
                            : 'border-ui-border-soft'
                        }`}
                      >
                        {scope === s.value && (
                          <div
                            className={`w-2 h-2 rounded-full ${
                              s.danger === 3
                                ? 'bg-tension-red'
                                : s.danger === 2
                                ? 'bg-catalyst-gold'
                                : 'bg-strategic-blue'
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-ash-light">{s.label}</div>
                        <div className="text-xs text-ui-text-muted">{s.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-ash-light mb-1">
                  Причина сброса <span className="text-tension-red">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Например: Запрос пользователя на перезапуск..."
                  rows={3}
                  className="w-full px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-transparent resize-none"
                  required
                />
              </div>
            </>
          ) : (
            <>
              {/* Warning */}
              <div className={`p-4 rounded-lg border ${
                scope === 'all'
                  ? 'bg-tension-red/10 border-tension-red/30'
                  : 'bg-catalyst-gold/10 border-catalyst-gold/30'
              }`}>
                <div className={`text-sm ${scope === 'all' ? 'text-tension-red' : 'text-catalyst-gold'}`}>
                  <strong>ВНИМАНИЕ!</strong> Это действие необратимо.
                  {scope === 'all' && (
                    <span> Все данные пользователя будут удалены без возможности восстановления.</span>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-obsidian-core border border-ui-border-soft rounded-lg p-4 space-y-2">
                <div>
                  <span className="text-sm text-ui-text-muted">Пользователь:</span>
                  <span className="text-ash-light ml-2">@{userName}</span>
                </div>
                <div>
                  <span className="text-sm text-ui-text-muted">Область сброса:</span>
                  <span className="text-ash-light ml-2">{selectedScope.label}</span>
                </div>
                <div>
                  <span className="text-sm text-ui-text-muted">Причина:</span>
                  <span className="text-ash-light ml-2">{reason}</span>
                </div>
              </div>

              {/* Confirmation */}
              <div>
                <label className="block text-sm font-medium text-ash-light mb-1">
                  Введите <code className="bg-obsidian-core px-1 rounded">{confirmRequired}</code> для подтверждения
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={confirmRequired}
                  className="w-full px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-tension-red focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-tension-red/10 border border-tension-red/30 rounded-lg text-sm text-tension-red">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2 px-4 bg-obsidian-core border border-ui-border-soft rounded-lg text-ui-text-muted hover:text-ash-light hover:border-ui-border-strong transition-colors"
              >
                Назад
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-obsidian-core border border-ui-border-soft rounded-lg text-ui-text-muted hover:text-ash-light hover:border-ui-border-strong transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting || (step === 2 && confirmText !== confirmRequired)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                step === 1
                  ? 'bg-catalyst-gold hover:bg-catalyst-gold/80 text-black'
                  : 'bg-tension-red hover:bg-tension-red/80 text-white'
              }`}
            >
              {submitting ? 'Сброс...' : step === 1 ? 'Продолжить' : 'Сбросить данные'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
