'use client';

import { useState } from 'react';

interface ReflectionContext {
  type: 'case' | 'quest';
  id: string;
  title: string;
  selectedOption?: string;
  selectedOptionTitle?: string;
}

interface ReflectionModalProps {
  isOpen: boolean;
  context: ReflectionContext;
  reflectionQuestion?: string;
  onClose: () => void;
  onSave: (data: { reflection: string; context: ReflectionContext }) => Promise<void>;
  onSkip: () => void;
}

export function ReflectionModal({
  isOpen,
  context,
  reflectionQuestion,
  onClose,
  onSave,
  onSkip,
}: ReflectionModalProps) {
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!reflection.trim()) return;
    setSaving(true);
    try {
      await onSave({ reflection, context });
      setReflection('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ui-text-main flex items-center gap-2">
            <span>🪞</span>
            <span>Рефлексия</span>
          </h2>
          <button
            onClick={onClose}
            className="text-ui-text-muted hover:text-ui-text-main"
          >
            ✕
          </button>
        </div>

        {reflectionQuestion && (
          <p className="text-sm text-ui-text-main mb-4 p-3 bg-obsidian-core rounded-lg">
            {reflectionQuestion}
          </p>
        )}

        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Запиши свои мысли и инсайты..."
          className="w-full h-32 p-3 bg-obsidian-core border border-ui-border-soft rounded-lg text-ui-text-main placeholder-ui-text-muted resize-none focus:outline-none focus:border-strategic-blue"
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onSkip}
            className="flex-1 py-2 px-4 border border-ui-border-soft rounded-lg text-ui-text-muted hover:text-ui-text-main hover:border-ui-border-strong transition-colors"
          >
            Пропустить
          </button>
          <button
            onClick={handleSave}
            disabled={!reflection.trim() || saving}
            className="flex-1 py-2 px-4 bg-strategic-blue text-white rounded-lg hover:bg-strategic-blue/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
