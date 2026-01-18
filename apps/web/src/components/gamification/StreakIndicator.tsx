'use client';

import { Streak } from '@/lib/gamification';

interface StreakIndicatorProps {
  streak: Streak;
  compact?: boolean;
}

/**
 * Компонент отображения серии (streak)
 */
export function StreakIndicator({ streak, compact = false }: StreakIndicatorProps) {
  const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-lg">🔥</span>
        <span className="text-sm font-bold text-ash-light">{streak.currentStreak}</span>
        <span className="text-xs text-ui-text-muted">дней</span>
      </div>
    );
  }
  
  return (
    <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <span className="text-lg font-bold text-ash-light">{streak.currentStreak}-дневная серия</span>
        </div>
        {streak.longestStreak > streak.currentStreak && (
          <span className="text-xs text-ui-text-muted">Рекорд: {streak.longestStreak}</span>
        )}
      </div>
      
      <div className="flex justify-between gap-1">
        {streak.streakDays.map((active, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <div 
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                active 
                  ? 'bg-system-growth text-white' 
                  : 'bg-obsidian-core text-ui-text-muted'
              }`}
            >
              {active ? '✓' : ''}
            </div>
            <span className="text-xs text-ui-text-dim">{dayLabels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
