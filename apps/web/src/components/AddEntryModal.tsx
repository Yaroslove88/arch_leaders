'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEntry } from '../lib/api';
import { useToast } from './ToastProvider';
import { useQueryClient } from '@tanstack/react-query';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddEntryModal({ isOpen, onClose }: AddEntryModalProps) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
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

      // Обновляем кэш записей
      queryClient.invalidateQueries({ queryKey: ['entries'] });

      toast.showToast('Ситуация успешно создана', 'success');
      onClose();
      // Перенаправляем в журнал
      router.push('/traces');
    } catch (error: any) {
      toast.showToast(error?.message || 'Ошибка при создании ситуации', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        type: 'situation',
        source: 'web',
        text: '',
        participants: [],
        tags: [],
      });
      setParticipantInput('');
      setTagInput('');
      onClose();
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-graphite-structure border-b border-ui-border-soft p-6 flex justify-between items-center">
          <h2 id="modal-title" className="text-2xl font-bold text-ash-light">
            Добавить ситуацию
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-ui-text-muted hover:text-ash-light focus:outline-none focus:ring-2 focus:ring-strategic-blue rounded p-1 disabled:opacity-50"
            aria-label="Закрыть модальное окно"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Описание типов */}
          <div className="bg-obsidian-core border border-ui-border-soft rounded-lg">
            <button
              type="button"
              onClick={() => setShowDescription(!showDescription)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-graphite-structure transition-colors rounded-lg"
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
                  Опишите ситуацию, которая произошла в вашей практике лидерства. 
                  После создания запись будет автоматически проанализирована, и система предложит квесты для развития.
                </p>
                
                <h3 className="font-semibold text-ash-light mb-2">Типы записей:</h3>
                <ul className="space-y-2 text-ui-text-muted">
                  <li>
                    <strong className="text-ash-light">Ситуация</strong> — описание конкретной ситуации, где вы проявили лидерство или столкнулись с вызовом.
                  </li>
                  <li>
                    <strong className="text-ash-light">Рефлексия</strong> — размышление о том, что произошло, что получилось, что не получилось, какие уроки вы извлекли.
                  </li>
                  <li>
                    <strong className="text-ash-light">Обратная связь</strong> — запись о том, как вы дали или получили обратную связь.
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Тип */}
          <div>
            <label htmlFor="entry-type" className="block text-sm font-medium mb-2 text-ash-light">
              Тип
            </label>
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
            <label htmlFor="entry-text" className="block text-sm font-medium mb-2 text-ash-light">
              Описание ситуации
            </label>
            <textarea
              id="entry-text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="w-full bg-obsidian-core border border-ui-border-soft rounded px-3 py-2 min-h-[200px] text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-strategic-blue"
              placeholder="Опишите ситуацию, что произошло, кто участвовал, какие были вызовы..."
              required
              aria-required="true"
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
                className="flex-1 bg-obsidian-core border border-ui-border-soft rounded px-3 py-2 text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-strategic-blue"
                placeholder="Добавить участника"
              />
              <button
                type="button"
                onClick={addParticipant}
                className="px-4 py-2 bg-obsidian-core border border-strategic-blue text-strategic-blue rounded hover:border-strategic-blue/70 hover:bg-graphite-structure focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-strategic-blue transition-colors"
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
                className="flex-1 bg-obsidian-core border border-ui-border-soft rounded px-3 py-2 text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue focus:border-strategic-blue"
                placeholder="Добавить тег"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-obsidian-core border border-ui-border-strong text-ui-text-muted rounded hover:border-ui-border-strong hover:text-ash-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-strategic-blue transition-colors"
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
                    className="text-ui-text-dim hover:text-ui-text-muted focus:outline-none focus:ring-2 focus:ring-strategic-blue rounded"
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
              disabled={loading || !formData.text.trim()}
              className="px-6 py-2 bg-system-focus text-ash-light rounded hover:bg-system-focus/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-strategic-blue transition-colors font-medium"
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 bg-obsidian-core border border-ui-border-soft text-ui-text-muted rounded hover:border-ui-border-strong hover:text-ash-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-strategic-blue transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

