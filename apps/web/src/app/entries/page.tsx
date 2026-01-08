'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEntries } from '../../hooks/useEntries';
import { useSessions } from '../../hooks/useSessions';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AddEntryModal } from '../../components/AddEntryModal';

export default function EntriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: entriesData, isLoading: entriesLoading } = useEntries();
  const { data: sessionsData } = useSessions({});

  const entries = entriesData?.entries || [];
  const sessions = sessionsData?.sessions || [];

  // Создаем карту сессий по entry_id для быстрого доступа
  const sessionsByEntryId = new Map(
    sessions.map((session: any) => [session.entry_id, session])
  );

  // Группируем записи по датам для хроники
  const groupedEntries = entries.reduce((acc: any, entry: any) => {
    const date = new Date(entry.created_at).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (entriesLoading) {
    return <LoadingSpinner fullScreen text="Загрузка ситуаций..." />;
  }

  return (
    <main className="min-h-screen bg-bg-main p-8">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок с кнопкой добавления */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-ui-text-main" id="page-title">
              Ситуации
            </h1>
            <p className="text-ui-text-muted">
              Хроника вашего опыта и развития
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-system-focus text-ui-text-main rounded-lg hover:bg-system-focus/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-system-focus font-medium shadow-panel"
            aria-label="Добавить новую ситуацию"
          >
            ➕ Добавить ситуацию
          </button>
        </div>

        {/* Лента ситуаций */}
        {entries.length === 0 ? (
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-12 text-center">
            <p className="text-ui-text-muted mb-4">У вас пока нет ситуаций</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-system-focus text-ui-text-main rounded-lg hover:bg-system-focus/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-system-focus font-medium"
            >
              Создать первую ситуацию
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <div key={date} className="relative">
                {/* Дата */}
                <div className="sticky top-0 z-10 mb-4">
                  <div className="inline-flex items-center gap-2 bg-bg-panel border border-ui-border-soft rounded-lg px-4 py-2 shadow-panel">
                    <span className="text-sm font-semibold text-ui-text-main">{date}</span>
                  </div>
                </div>

                {/* Ситуации за эту дату */}
                <div className="space-y-4 ml-4 border-l-2 border-ui-border-soft pl-6">
                  {groupedEntries[date].map((entry: any) => {
                    const session = sessionsByEntryId.get(entry.id);
                    return (
                      <Link
                        key={entry.id}
                        href={`/entries/${entry.id}`}
                        className="block bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 hover:border-system-focus hover:shadow-panel-lg transition-all group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {/* Тип и статус */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className="px-3 py-1 bg-bg-secondary border border-ui-border-soft text-ui-text-main rounded text-sm">
                                {entry.type === 'situation' ? 'Ситуация' : 
                                 entry.type === 'reflection' ? 'Рефлексия' : 
                                 entry.type === 'feedback' ? 'Обратная связь' : entry.type}
                              </span>
                              {session && (
                                <span className="px-3 py-1 bg-bg-secondary border border-system-growth text-system-growth rounded text-sm">
                                  Проанализировано
                                </span>
                              )}
                              {!session && (
                                <span className="px-3 py-1 bg-bg-secondary border border-ui-border-soft text-ui-text-muted rounded text-sm">
                                  Не проанализировано
                                </span>
                              )}
                            </div>

                            {/* Текст ситуации */}
                            <p className="text-ui-text-main line-clamp-3 mb-3 group-hover:text-system-focus transition-colors">
                              {entry.text}
                            </p>

                            {/* Метаданные */}
                            <div className="flex items-center gap-4 text-xs text-ui-text-muted">
                              <span>
                                {new Date(entry.created_at).toLocaleTimeString('ru-RU', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {entry.participants && entry.participants.length > 0 && (
                                <span>{entry.participants.length} участников</span>
                              )}
                              {entry.tags && entry.tags.length > 0 && (
                                <span>{entry.tags.length} тегов</span>
                              )}
                            </div>
                          </div>

                          {/* Стрелка */}
                          <div className="text-ui-text-dim group-hover:text-system-focus transition-colors">
                            →
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно добавления ситуации */}
      <AddEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}

