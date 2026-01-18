'use client';

import { NodeLevel, calculateLevel } from '@/lib/gamification';

interface LevelIndicatorProps {
  nodeName: string;
  level: NodeLevel;
  compact?: boolean;
}

/**
 * Индикатор уровня способности
 */
export function LevelIndicator({ nodeName, level, compact = false }: LevelIndicatorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-ui-text-muted">{nodeName}</span>
        <div className="flex items-center gap-1">
          <div className="w-12 h-1.5 bg-obsidian-core rounded-full">
            <div 
              className="h-full bg-system-focus rounded-full"
              style={{ width: `${level.progress}%` }}
            />
          </div>
          <span className="text-xs text-ui-text-muted">Ур. {level.level}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-ash-light">{nodeName}</span>
        <span className="text-sm font-bold text-strategic-blue">Уровень {level.level}</span>
      </div>
      <div className="w-full h-2 bg-obsidian-core rounded-full mb-2">
        <div 
          className="h-full bg-system-focus rounded-full transition-all"
          style={{ width: `${level.progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-ui-text-muted">
        <span>{level.currentXP} XP</span>
        <span>до следующего: {level.xpToNextLevel} XP</span>
      </div>
    </div>
  );
}

interface LevelUpPopupProps {
  nodeName: string;
  newLevel: number;
  onClose: () => void;
}

/**
 * Popup при повышении уровня
 */
export function LevelUpPopup({ nodeName, newLevel, onClose }: LevelUpPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-graphite-structure border border-strategic-blue rounded-xl shadow-lg p-8 max-w-sm text-center animate-pulse">
        <div className="text-5xl mb-4">📈</div>
        <h2 className="text-xl font-bold text-ash-light mb-2">Уровень вырос!</h2>
        <p className="text-lg text-strategic-blue font-semibold mb-2">{nodeName}</p>
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-ui-text-muted">Уровень</span>
          <span className="text-3xl font-bold text-strategic-blue">{newLevel}</span>
        </div>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-system-focus hover:bg-system-focus/90 text-white rounded-lg font-medium transition-colors"
        >
          Отлично!
        </button>
      </div>
    </div>
  );
}
