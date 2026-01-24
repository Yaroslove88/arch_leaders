'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getEntry, updateEntry, Entry } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { useTelegramNavigation } from '@/hooks/useTelegramNavigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function EditEntryPageContent() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const entryId = params.id as string;
  
  // Telegram BackButton
  useTelegramNavigation(`/entries/${entryId}`, { hapticFeedback: true });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [formData, setFormData] = useState({
    type: 'situation',
    text: '',
    participants: [] as string[],
    tags: [] as string[],
  });
  const [participantInput, setParticipantInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Load entry data
  useEffect(() => {
    async function loadEntry() {
      try {
        const data = await getEntry(entryId);
        setEntry(data);
        setFormData({
          type: data.type || 'situation',
          text: data.text || '',
          participants: data.participants || [],
          tags: data.tags || [],
        });
      } catch (error) {
        toast.showToast('Не удалось загрузить запись', 'error');
        router.push('/traces');
      } finally {
        setLoading(false);
      }
    }
    loadEntry();
  }, [entryId, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateEntry(entryId, {
        type: formData.type,
        text: formData.text,
        participants: formData.participants.filter((p) => p.trim()),
        tags: formData.tags.filter((t) => t.trim()),
      });

      toast.showToast('Запись обновлена', 'success');
      router.push(`/entries/${entryId}`);
    } catch (error: any) {
      toast.showToast(error?.message || 'Ошибка при обновлении записи', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addParticipant = () => {
    if (participantInput.trim()) {
      setFormData({
        ...formData,
        participants: [...formData.participants, participantInput.trim()],
      });
      setParticipantInput('');
    }
  };

  const removeParticipant = (index: number) => {
    setFormData({
      ...formData,
      participants: formData.participants.filter((_, i) => i !== index),
    });
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-core p-4 md:p-8">
        <div className="max-w-3xl mx-auto text-center text-ui-text-muted">
          Загрузка...
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-obsidian-core p-4 md:p-8">
        <div className="max-w-3xl mx-auto text-center text-tension-red">
          Запись не найдена
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-core p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/entries/${entryId}`}
            className="text-strategic-blue hover:text-strategic-blue/80 text-sm"
          >
            ← Назад к записи
          </Link>
          <h1 className="text-xl font-bold text-ash-light">Редактирование</h1>
          <div className="w-24" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6 space-y-6"
        >
          {/* Тип */}
          <div>
            <label htmlFor="entry-type" className="block text-sm font-medium mb-2 text-ash-light">
              Тип записи
            </label>
            <select
              id="entry-type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-obsidian-core border border-ui-border-soft rounded px-3 py-2 text-ash-light focus:outline-none focus:ring-2 focus:ring-strategic-blue"
            >
              <option value="situation">Ситуация</option>
              <option value="reflection">Рефлексия</option>
              <option value="feedback">Обратная связь</option>
            </select>
          </div>

          {/* Текст */}
          <div>
            <label htmlFor="entry-text" className="block text-sm font-medium mb-2 text-ash-light">
              Описание
            </label>
            <textarea
              id="entry-text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="w-full bg-obsidian-core border border-ui-border-soft rounded px-3 py-2 min-h-[200px] text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue"
              placeholder="Опишите ситуацию..."
              required
            />
          </div>

          {/* Участники */}
          <div>
            <label htmlFor="participant-input" className="block text-sm font-medium mb-2 text-ash-light">
              Участники
            </label>
            <div className="flex gap-2 mb-2">
              <input
                id="participant-input"
                type="text"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
                className="flex-1 bg-obsidian-core border border-ui-border-soft rounded px-3 py-2 text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue"
                placeholder="Добавить участника"
              />
              <button
                type="button"
                onClick={addParticipant}
                className="px-4 py-2 bg-obsidian-core border border-strategic-blue text-strategic-blue rounded hover:bg-strategic-blue/10 transition-colors"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.participants.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-obsidian-core border border-strategic-blue/30 text-strategic-blue px-3 py-1 rounded text-sm"
                >
                  @{p}
                  <button
                    type="button"
                    onClick={() => removeParticipant(i)}
                    className="text-strategic-blue hover:text-strategic-blue/80"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Теги */}
          <div>
            <label htmlFor="tag-input" className="block text-sm font-medium mb-2 text-ash-light">
              Теги
            </label>
            <div className="flex gap-2 mb-2">
              <input
                id="tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 bg-obsidian-core border border-ui-border-soft rounded px-3 py-2 text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue"
                placeholder="Добавить тег"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-obsidian-core border border-ui-border-soft text-ui-text-muted rounded hover:border-ui-border-strong transition-colors"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((t, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-obsidian-core border border-ui-border-soft text-ui-text-muted px-3 py-1 rounded text-sm"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => removeTag(i)}
                    className="text-ui-text-muted hover:text-ash-light"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-4 pt-4 border-t border-ui-border-soft">
            <button
              type="submit"
              disabled={saving || !formData.text.trim()}
              className="flex-1 px-6 py-3 bg-strategic-blue text-white rounded-lg hover:bg-strategic-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/entries/${entryId}`)}
              className="px-6 py-3 bg-obsidian-core border border-ui-border-soft text-ui-text-muted rounded-lg hover:border-ui-border-strong hover:text-ash-light transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditEntryPage() {
  return (
    <ProtectedRoute>
      <EditEntryPageContent />
    </ProtectedRoute>
  );
}
