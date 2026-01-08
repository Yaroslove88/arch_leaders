'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createEvidence } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';

export default function NewEvidencePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const questId = searchParams.get('quest_id') || '';
  
  const [formData, setFormData] = useState({
    type: 'situation',
    text: '',
    quest_id: questId,
    ability_node_id: '',
    tags: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Обновляем quest_id если он изменился в URL
    if (questId) {
      setFormData(prev => ({ ...prev, quest_id: questId }));
    }
  }, [questId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createEvidence({
        ...formData,
        quest_id: formData.quest_id || undefined,
        ability_node_id: formData.ability_node_id || undefined,
      });
      toast.showToast('Доказательство успешно создано', 'success');
      // Возвращаемся на страницу квеста, если был quest_id
      if (questId) {
        router.push(`/quests/${questId}`);
      } else {
        router.push('/evidence');
      }
    } catch (error: any) {
      toast.showToast(error?.message || 'Ошибка при создании доказательства', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-main p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link 
            href={questId ? `/quests/${questId}` : '/evidence'}
            className="text-system-focus hover:text-system-focus/80 mb-4 inline-block transition-colors"
          >
            ← Назад
          </Link>
          <h1 className="text-3xl font-bold text-ui-text-main">Новое доказательство</h1>
          {questId && (
            <p className="text-ui-text-muted mt-2">
              Добавление доказательства для квеста
            </p>
          )}
        </div>

        <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-ui-text-main">Тип</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-bg-secondary border border-ui-border-soft rounded px-3 py-2 text-ui-text-main focus:outline-none focus:ring-2 focus:ring-system-focus focus:border-system-focus"
              >
                <option value="situation">Ситуация</option>
                <option value="observation">Наблюдение</option>
                <option value="reflection">Рефлексия</option>
                <option value="feedback">Обратная связь</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-ui-text-main">Описание</label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="w-full bg-bg-secondary border border-ui-border-soft rounded px-3 py-2 min-h-[200px] text-ui-text-main placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-system-focus focus:border-system-focus"
                placeholder="Опишите доказательство применения способности..."
                required
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Link
                href={questId ? `/quests/${questId}` : '/evidence'}
                className="px-6 py-2 bg-bg-secondary border border-ui-border-soft text-ui-text-muted rounded hover:border-ui-border-strong hover:text-ui-text-main transition-colors"
              >
                Отмена
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-system-focus text-ui-text-main rounded hover:bg-system-focus/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

