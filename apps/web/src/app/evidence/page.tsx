'use client';

import { useState, useEffect } from 'react';
import { getEvidence, createEvidence, Evidence } from '@/lib/api';
import { isAdmin, toggleAdminMode } from '@/lib/admin';
import { AdminDebugPanel, AdminLabel } from '@/components/AdminDebugPanel';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/hooks/useAuth';

export default function EvidencePage() {
  const toast = useToast();
  const { user } = useAuth();
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [formData, setFormData] = useState({
    type: 'situation',
    text: '',
    quest_id: '',
    ability_node_id: '',
    tags: [] as string[],
  });

  useEffect(() => {
    setAdminMode(isAdmin());
    loadEvidence();
  }, []);

  async function loadEvidence() {
    setLoading(true);
    try {
      const data = await getEvidence();
      setEvidences(data.evidences);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createEvidence({
        ...formData,
        quest_id: formData.quest_id || undefined,
        ability_node_id: formData.ability_node_id || undefined,
      });
      setShowForm(false);
      setFormData({
        type: 'situation',
        text: '',
        quest_id: '',
        ability_node_id: '',
        tags: [],
      });
      toast.showToast('Доказательство успешно создано', 'success');
      loadEvidence();
    } catch (error: any) {
      toast.showToast(error?.message || 'Ошибка при создании доказательства', 'error');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-ui-text-muted">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-ui-text-main">Журнал доказательств</h1>
            <AdminLabel />
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  toggleAdminMode();
                  setAdminMode(isAdmin());
                }}
                className="ml-4 px-2 py-1 text-xs bg-bg-secondary border border-ui-border-soft text-ui-text-muted rounded hover:border-ui-border-strong hover:text-ui-text-main transition-colors"
                title="Переключить режим админа"
              >
                {adminMode ? '🔓 Админ' : '🔒 Обычный'}
              </button>
            )}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 text-sm text-ui-text-muted hover:text-ui-text-main border border-ui-border-soft rounded hover:border-ui-border-strong hover:bg-bg-secondary transition-colors"
          >
            {showForm ? 'Отмена' : '+ Добавить вручную'}
          </button>
        </div>

        {/* Отладочная информация для админа */}
        {adminMode && (
          <AdminDebugPanel
            data={{
              totalEvidence: evidences.length,
              byType: {
                situation: evidences.filter(e => e.type === 'situation').length,
                observation: evidences.filter(e => e.type === 'observation').length,
                reflection: evidences.filter(e => e.type === 'reflection').length,
                feedback: evidences.filter(e => e.type === 'feedback').length,
              },
              evidences: evidences.map(e => ({
                id: e.id,
                type: e.type,
                hasQuest: !!e.quest_id,
                hasNode: !!e.ability_node_id,
                createdAt: e.created_at,
              })),
            }}
            title="Отладка: Доказательства"
          />
        )}

        <div className="bg-bg-panel border border-system-focus/30 rounded-lg p-6 mb-8 shadow-panel">
          <p className="text-ui-text-muted mb-4">
            <strong className="text-ui-text-main">Журнал доказательств</strong> — это коллекция конкретных примеров применения ваших способностей в реальных ситуациях. 
            <strong className="text-system-focus"> Доказательства собираются автоматически при выполнении квестов</strong> — система фиксирует, 
            когда вы применяете способности в процессе выполнения заданий. Добавление доказательств вручную — это необязательная опция 
            для случаев, когда вы хотите зафиксировать проявление способности вне контекста квеста.
          </p>
          
          <h3 className="font-semibold text-ui-text-main mb-2">Чем доказательства отличаются от записей:</h3>
          <ul className="space-y-2 text-ui-text-muted mb-4">
            <li>
              <strong className="text-ui-text-main">Записи (ситуации)</strong> — это полное описание ситуации: контекст, участники, что произошло, 
              какие были вызовы. Они используются для анализа и генерации квестов.
            </li>
            <li>
              <strong className="text-ui-text-main">Доказательства</strong> — это конкретные примеры применения способности: &laquo;В этой ситуации я удержал напряжение 10 минут&raquo;, 
              &laquo;Я дал обратную связь по структуре факт-влияние-предложение&raquo;, &laquo;Я нарисовал карту системы с 8 элементами&raquo;. 
              Они привязываются к конкретным квестам и способностям и собираются автоматически.
            </li>
          </ul>
        </div>

        {/* Форма создания */}
        {showForm && (
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 mb-8 bg-panel-gradient">
            <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Новое доказательство</h2>
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
                  className="w-full bg-bg-secondary border border-ui-border-soft rounded px-3 py-2 min-h-[150px] text-ui-text-main placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-system-focus focus:border-system-focus"
                  placeholder="Опишите доказательство применения способности..."
                  required
                />
              </div>

              {/* Технические поля скрыты от игрока - связывание происходит автоматически */}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-bg-secondary border border-system-focus text-system-focus rounded hover:border-system-focus/70 hover:bg-bg-panel transition-colors"
                >
                  Создать
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-bg-secondary border border-ui-border-soft text-ui-text-muted rounded hover:border-ui-border-strong hover:text-ui-text-main transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Список доказательств */}
        {evidences.length === 0 ? (
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-8 text-center text-ui-text-muted">
            Нет доказательств
          </div>
        ) : (
          <div className="space-y-4">
            {evidences.map((evidence) => (
              <div key={evidence.id} className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 bg-panel-gradient">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs bg-bg-secondary border border-system-focus/30 text-system-focus px-2 py-1 rounded">
                    {evidence.type === 'situation' ? 'Ситуация' : 
                     evidence.type === 'observation' ? 'Наблюдение' : 
                     evidence.type === 'reflection' ? 'Рефлексия' : 
                     evidence.type === 'feedback' ? 'Обратная связь' : evidence.type}
                  </span>
                  <span className="text-xs text-ui-text-dim">
                    {new Date(evidence.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-ui-text-main mb-3">{evidence.text}</p>
                {evidence.quest_id && (
                  <div className="text-sm text-ui-text-muted">
                    Связано с квестом
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

