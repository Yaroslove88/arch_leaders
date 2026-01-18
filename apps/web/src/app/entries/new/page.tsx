'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEntry } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

export default function NewEntryPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [formData, setFormData] = useState({
    type: 'situation',
    source: 'web',
    text: '',
    participants: [] as string[],
    tags: [] as string[],
  });
  const [participantInput, setParticipantInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const entry = await createEntry({
        ...formData,
        participants: formData.participants.filter((p) => p.trim()),
        tags: formData.tags.filter((t) => t.trim()),
      });

      toast.showToast('Запись добавлена в журнал', 'success');
      // Перенаправляем в журнал
      router.push('/traces');
    } catch (error: any) {
      toast.showToast(error?.message || 'Ошибка при создании записи', 'error');
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-obsidian-core p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-ash-light" id="page-title">Добавить ситуацию</h1>
        
        <div className="bg-bg-panel border border-strategic-blue/30 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => setShowDescription(!showDescription)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-obsidian-core transition-colors rounded-lg"
          >
            <span className="font-medium text-ash-light">
              {showDescription ? 'Скрыть описание' : 'Показать описание типов записей'}
            </span>
            <span className="text-ui-text-muted">
              {showDescription ? '▲' : '▼'}
            </span>
          </button>
          
          {showDescription && (
            <div className="px-6 pb-6 pt-2">
              <p className="text-ui-text-muted mb-4">
                На этой странице вы можете создать запись о ситуации, которая произошла в вашей практике лидерства. 
                После создания запись будет автоматически проанализирована, и система предложит квесты для развития.
              </p>
              
              <h3 className="font-semibold text-ash-light mb-2">Типы записей:</h3>
              <ul className="space-y-2 text-ui-text-muted">
                <li>
                  <strong className="text-ash-light">Ситуация</strong> — описание конкретной ситуации, где вы проявили лидерство или столкнулись с вызовом. 
                  Например: "Провел сложную встречу с командой", "Принял решение в условиях неопределенности", "Разрешил конфликт между коллегами".
                </li>
                <li>
                  <strong className="text-ash-light">Рефлексия</strong> — размышление о том, что произошло, что получилось, что не получилось, какие уроки вы извлекли. 
                  Это более глубокий анализ ситуации с фокусом на вашем опыте и развитии.
                </li>
                <li>
                  <strong className="text-ash-light">Обратная связь</strong> — запись о том, как вы дали или получили обратную связь. 
                  Это может быть обратная связь от коллеги, ментора, или которую вы дали кому-то.
                </li>
              </ul>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 space-y-6 bg-panel-gradient" aria-labelledby="page-title">
          {/* Тип */}
          <div>
            <label htmlFor="entry-type" className="block text-sm font-medium mb-2 text-ash-light">Тип</label>
            <select
              id="entry-type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-obsidian-core border border-ui-border-soft rounded px-3 py-2 text-ash-light focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-strategic-blue"
              aria-required="true"
            >
              <option value="situation">Ситуация</option>
              <option value="reflection">Рефлексия</option>
              <option value="feedback">Обратная связь</option>
            </select>
          </div>

          {/* Текст */}
          <div>
            <label htmlFor="entry-text" className="block text-sm font-medium mb-2 text-ash-light">Описание ситуации</label>
            <textarea
              id="entry-text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="w-full bg-obsidian-core border border-ui-border-soft rounded px-3 py-2 min-h-[200px] text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-strategic-blue"
              placeholder="Опишите ситуацию, что произошло, кто участвовал, какие были вызовы..."
              required
              aria-required="true"
              aria-describedby="entry-text-description"
            />
            <p id="entry-text-description" className="sr-only">Обязательное поле для описания ситуации</p>
          </div>

          {/* Участники */}
          <div>
            <label htmlFor="participant-input" className="block text-sm font-medium mb-2 text-ash-light">Участники</label>
            <div className="flex gap-2 mb-2">
              <input
                id="participant-input"
                type="text"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
                className="flex-1 bg-obsidian-core border border-ui-border-soft rounded px-3 py-2 text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-strategic-blue"
                placeholder="Добавить участника"
                aria-label="Введите имя участника и нажмите Enter или кнопку Добавить"
              />
              <button
                type="button"
                onClick={addParticipant}
                className="px-4 py-2 bg-obsidian-core border border-strategic-blue text-strategic-blue rounded hover:border-strategic-blue/70 hover:bg-bg-panel focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-strategic-blue transition-colors"
                aria-label="Добавить участника"
              >
                Добавить
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.participants.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-obsidian-core border border-strategic-blue/30 text-strategic-blue px-3 py-1 rounded"
                >
                  {p}
                  <button
                    type="button"
                    onClick={() => removeParticipant(i)}
                    className="text-strategic-blue hover:text-strategic-blue/80 focus:outline-none focus:ring-2 focus:ring-strategic-blue rounded"
                    aria-label={`Удалить участника ${p}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Теги */}
          <div>
            <label htmlFor="tag-input" className="block text-sm font-medium mb-2 text-ash-light">Теги</label>
            <div className="flex gap-2 mb-2">
              <input
                id="tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 bg-obsidian-core border border-ui-border-soft rounded px-3 py-2 text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-strategic-blue"
                placeholder="Добавить тег"
                aria-label="Введите тег и нажмите Enter или кнопку Добавить"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-obsidian-core border border-ui-border-strong text-ui-text-muted rounded hover:border-ui-border-strong hover:text-ash-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-strategic-blue transition-colors"
                aria-label="Добавить тег"
              >
                Добавить
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((t, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-obsidian-core border border-ui-border-soft text-ui-text-muted px-3 py-1 rounded"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(i)}
                    className="text-ash-light opacity-50 hover:text-ui-text-muted focus:outline-none focus:ring-2 focus:ring-strategic-blue rounded"
                    aria-label={`Удалить тег ${t}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !formData.text.trim()}
              className="px-6 py-2 bg-obsidian-core border border-strategic-blue text-strategic-blue rounded hover:border-strategic-blue/70 hover:bg-bg-panel disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-strategic-blue transition-colors"
              aria-disabled={loading || !formData.text.trim()}
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-obsidian-core border border-ui-border-soft text-ui-text-muted rounded hover:border-ui-border-strong hover:text-ash-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-strategic-blue transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

