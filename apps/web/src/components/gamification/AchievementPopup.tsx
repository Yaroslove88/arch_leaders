'use client';

import { useEffect, useState } from 'react';
import { Achievement } from '@/lib/gamification';

interface AchievementPopupProps {
  achievement: Achievement | null;
  onClose: () => void;
}

/**
 * Popup при получении достижения
 */
export function AchievementPopup({ achievement, onClose }: AchievementPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);
  
  if (!achievement) return null;
  
  return (
    <div 
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-graphite-structure border border-sage-green rounded-xl shadow-lg p-6 max-w-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-system-growth/20 border-2 border-sage-green flex items-center justify-center text-3xl animate-bounce">
            {achievement.icon}
          </div>
          <div>
            <p className="text-xs text-sage-green font-medium mb-1">🏆 Достижение разблокировано!</p>
            <h3 className="text-lg font-bold text-ash-light">{achievement.title}</h3>
            <p className="text-sm text-ui-text-muted">{achievement.description}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="absolute top-2 right-2 text-ui-text-dim hover:text-ui-text-muted"
        >
          ×
        </button>
      </div>
    </div>
  );
}
