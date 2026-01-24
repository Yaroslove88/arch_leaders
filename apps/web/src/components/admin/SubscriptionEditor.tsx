'use client';

import { useState } from 'react';
import { updateUserSubscription, UserSubscription } from '../../lib/admin-api';

interface SubscriptionEditorProps {
  userId: string;
  currentSubscription: UserSubscription;
  onClose: () => void;
  onSuccess: () => void;
}

const PLANS = [
  { value: 'free', label: 'Free', description: 'Базовый доступ' },
  { value: 'basic', label: 'Basic', description: 'Расширенный функционал' },
  { value: 'premium', label: 'Premium', description: 'Полный доступ' },
] as const;

export function SubscriptionEditor({
  userId,
  currentSubscription,
  onClose,
  onSuccess,
}: SubscriptionEditorProps) {
  const [plan, setPlan] = useState<'free' | 'basic' | 'premium'>(
    currentSubscription.plan || 'free'
  );
  const [expiresAt, setExpiresAt] = useState(
    currentSubscription.expires_at
      ? new Date(currentSubscription.expires_at).toISOString().split('T')[0]
      : ''
  );
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Укажите причину изменения');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await updateUserSubscription(userId, {
        plan,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        reason: reason.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Не удалось обновить подписку');
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
              Изменить подписку
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
          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium text-ash-light mb-2">
              План подписки
            </label>
            <div className="space-y-2">
              {PLANS.map((p) => (
                <label
                  key={p.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    plan === p.value
                      ? 'border-strategic-blue bg-strategic-blue/10'
                      : 'border-ui-border-soft hover:border-ui-border-strong'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={p.value}
                    checked={plan === p.value}
                    onChange={(e) => setPlan(e.target.value as typeof plan)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      plan === p.value
                        ? 'border-strategic-blue'
                        : 'border-ui-border-soft'
                    }`}
                  >
                    {plan === p.value && (
                      <div className="w-2 h-2 rounded-full bg-strategic-blue" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-ash-light">{p.label}</div>
                    <div className="text-xs text-ui-text-muted">
                      {p.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-ash-light mb-1">
              Дата истечения
              <span className="text-ui-text-muted font-normal ml-1">
                (опционально)
              </span>
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-transparent"
            />
            <p className="text-xs text-ui-text-muted mt-1">
              Оставьте пустым для бессрочной подписки
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-ash-light mb-1">
              Причина изменения <span className="text-tension-red">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Например: Оплата через менеджера"
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
              className="flex-1 py-2 px-4 bg-strategic-blue hover:bg-strategic-blue/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
