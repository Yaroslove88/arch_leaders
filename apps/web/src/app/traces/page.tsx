'use client';

import { useState, useMemo } from 'react';
import { getEvidence, Evidence, getQuests, getSemanticTree, getEntries, getSessions, Entry, Session } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../components/LoadingSpinner';
import { JournalEntryCard } from '../../components/JournalEntryCard';
import { AddSituationModal, type SituationFormData } from '../../components/modals';
import { createEntry } from '../../lib/api';
import { useToast } from '../../components/ToastProvider';
import { useQueryClient } from '@tanstack/react-query';

type JournalFilter = 'all' | 'quests' | 'situations' | 'free';

// Типы объединённых записей
export interface JournalRecord {
  id: string;
  type: 'entry' | 'evidence';
  sourceType: 'quest' | 'situation' | 'free'; // Откуда запись
  text: string;
  created_at: string;
  // Связи
  questId?: string;
  questTitle?: string;
  nodeId?: string;
  nodeName?: string;
  sessionId?: string;
  entryId?: string;
  // Для entries
  entry?: Entry;
  session?: Session | null;
  // Для evidences
  evidence?: Evidence;
  // Состояние анализа (для ситуаций)
  analysisStatus?: 'none' | 'processing' | 'done' | 'failed';
}

export default function JournalPage() {
  const [filter, setFilter] = useState<JournalFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  // Загрузка данных
  const { data: evidenceData, isLoading: evidenceLoading } = useQuery({
    queryKey: ['evidence'],
    queryFn: () => getEvidence(),
  });

  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['entries'],
    queryFn: () => getEntries(),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => getSessions(),
  });

  const { data: questsData } = useQuery({
    queryKey: ['quests'],
    queryFn: () => getQuests(),
  });

  const { data: tree } = useQuery({
    queryKey: ['tree', 'semantic'],
    queryFn: getSemanticTree,
  });

  const isLoading = evidenceLoading || entriesLoading;
  const evidences = evidenceData?.evidences || [];
  const entries = entriesData?.entries || [];
  const sessions = sessionsData?.sessions || [];
  const quests = questsData?.quests || [];

  // Создаём карты для быстрого доступа
  const sessionsMap = useMemo(() => {
    const map = new Map<string, Session>();
    sessions.forEach((s: Session) => {
      if (s.entry_id) map.set(s.entry_id, s);
    });
    return map;
  }, [sessions]);

  const questsMap = useMemo(() => {
    const map = new Map<string, any>();
    quests.forEach((q: any) => {
      map.set(q.id, q);
    });
    return map;
  }, [quests]);

  const nodesMap = useMemo(() => {
    const map = new Map<string, any>();
    tree?.nodes?.forEach((n: any) => {
      map.set(n.node_id, n);
    });
    return map;
  }, [tree]);

  // Объединяем entries и evidences в единый список
  const journalRecords = useMemo(() => {
    const records: JournalRecord[] = [];

    // Добавляем entries (ситуации)
    entries.forEach((entry: Entry) => {
      const session = sessionsMap.get(entry.id);
      let analysisStatus: JournalRecord['analysisStatus'] = 'none';
      if (session) {
        if (session.status === 'processing' || session.status === 'pending') {
          analysisStatus = 'processing';
        } else if (session.status === 'succeeded' || session.status === 'done') {
          analysisStatus = 'done';
        } else if (session.status === 'failed') {
          analysisStatus = 'failed';
        }
      }

      records.push({
        id: `entry-${entry.id}`,
        type: 'entry',
        sourceType: 'situation',
        text: entry.text,
        created_at: entry.created_at,
        entryId: entry.id,
        entry,
        session,
        sessionId: session?.id,
        analysisStatus,
      });
    });

    // Добавляем evidences (рефлексии)
    evidences.forEach((evidence: Evidence) => {
      const quest = evidence.quest_id ? questsMap.get(evidence.quest_id) : null;
      const node = evidence.ability_node_id ? nodesMap.get(evidence.ability_node_id) : null;

      // Определяем источник
      let sourceType: JournalRecord['sourceType'] = 'free';
      if (evidence.quest_id) {
        sourceType = 'quest';
      } else if (evidence.session_id) {
        sourceType = 'situation';
      }

      records.push({
        id: `evidence-${evidence.id}`,
        type: 'evidence',
        sourceType,
        text: evidence.text,
        created_at: evidence.created_at,
        questId: evidence.quest_id || undefined,
        questTitle: quest?.title,
        nodeId: evidence.ability_node_id || undefined,
        nodeName: node?.name,
        sessionId: evidence.session_id || undefined,
        evidence,
      });
    });

    // Сортируем по дате (новые сначала)
    return records.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [entries, evidences, sessionsMap, questsMap, nodesMap]);

  // Фильтруем записи
  const filteredRecords = useMemo(() => {
    switch (filter) {
      case 'quests':
        return journalRecords.filter(r => r.sourceType === 'quest');
      case 'situations':
        return journalRecords.filter(r => r.sourceType === 'situation' || r.type === 'entry');
      case 'free':
        return journalRecords.filter(r => r.sourceType === 'free');
      default:
        return journalRecords;
    }
  }, [journalRecords, filter]);

  // Подсчёт для бейджей
  const counts = useMemo(() => ({
    all: journalRecords.length,
    quests: journalRecords.filter(r => r.sourceType === 'quest').length,
    situations: journalRecords.filter(r => r.sourceType === 'situation' || r.type === 'entry').length,
    free: journalRecords.filter(r => r.sourceType === 'free').length,
  }), [journalRecords]);

  // Обработчик сохранения новой ситуации
  const handleSaveSituation = async (data: SituationFormData) => {
    setIsSaving(true);
    try {
      await createEntry({
        type: 'situation',
        source: 'web',
        text: data.description || data.title,
        participants: [],
        tags: [],
      });
      
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      toast.showToast('Ситуация добавлена', 'success');
      setIsAddModalOpen(false);
    } catch (error: any) {
      toast.showToast(error?.message || 'Ошибка при создании', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка журнала..." />;
  }

  return (
    <main className="min-h-screen bg-obsidian-core p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-ash-light">Журнал</h1>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-strategic-blue hover:bg-strategic-blue/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Добавить
            </button>
          </div>
          <p className="text-sm text-ui-text-muted">
            Все записи: ситуации, рефлексии, наблюдения
          </p>
        </div>

        {/* Фильтры */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            count={counts.all}
          >
            Все
          </FilterButton>
          <FilterButton
            active={filter === 'situations'}
            onClick={() => setFilter('situations')}
            count={counts.situations}
          >
            Ситуации
          </FilterButton>
          <FilterButton
            active={filter === 'quests'}
            onClick={() => setFilter('quests')}
            count={counts.quests}
          >
            Из квестов
          </FilterButton>
          <FilterButton
            active={filter === 'free'}
            onClick={() => setFilter('free')}
            count={counts.free}
          >
            Свободные
          </FilterButton>
        </div>

        {/* Список записей */}
        {filteredRecords.length === 0 ? (
          <div className="bg-graphite-structure border border-ui-border-soft rounded-xl p-12 text-center">
            <p className="text-ui-text-muted mb-4">
              {filter === 'all' ? 'Журнал пуст' : 'Нет записей с таким фильтром'}
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-strategic-blue hover:underline"
            >
              Добавить первую запись
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <JournalEntryCard
                key={record.id}
                record={record}
                tree={tree}
                quests={quests}
                sessions={sessions}
              />
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно добавления ситуации */}
      <AddSituationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveSituation}
        isLoading={isSaving}
      />
    </main>
  );
}

// Кнопка фильтра
function FilterButton({ 
  active, 
  onClick, 
  count, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
        active
          ? 'bg-strategic-blue text-white'
          : 'bg-graphite-structure border border-ui-border-soft text-ui-text-muted hover:text-ash-light hover:border-ui-border-strong'
      }`}
    >
      {children}
      <span className={`text-xs ${active ? 'text-white/70' : 'text-ui-text-dim'}`}>
        {count}
      </span>
    </button>
  );
}
