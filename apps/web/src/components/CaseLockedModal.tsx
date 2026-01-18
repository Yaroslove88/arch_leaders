'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface CaseLockedModalProps {
  show: boolean;
  message: string;
  nodeId?: string;
  onClose: () => void;
}

export default function CaseLockedModal({ show, message, nodeId, onClose }: CaseLockedModalProps) {
  useEffect(() => {
    if (show) {
      // Автозакрытие через 6 секунд (увеличено для прочтения и нажатия кнопки)
      const timer = setTimeout(() => {
        onClose();
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  // Проверяем, связано ли сообщение с необходимостью выполнить квест
  const needsQuest = message.includes('квест') || message.includes('Квест');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-graphite-structure border border-ui-border-soft rounded-xl shadow-panel p-6 max-w-lg w-full my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Иконка замка */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-catalyst-gold/20 border border-system-warning/30 flex items-center justify-center">
            <span className="text-lg">🔒</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-ash-light mb-2">Кейс недоступен</h3>
            <p className="text-ui-text-muted text-sm leading-relaxed mb-4">{message}</p>
            
            {/* Кнопка перехода к квестам, если нужен квест */}
            {needsQuest && nodeId && (
              <div className="flex gap-2">
                <Link
                  href={`/experiments?tab=base-quests`}
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-strategic-blue text-ash-light rounded hover:bg-strategic-blue/80 transition-colors text-sm font-medium"
                >
                  <span>📋</span>
                  Перейти к квестам
                </Link>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-obsidian-core border border-ui-border-soft text-ui-text-muted rounded hover:bg-bg-hover transition-colors text-sm"
                >
                  Закрыть
                </button>
              </div>
            )}
            
            {/* Просто кнопка закрытия, если квест не требуется */}
            {(!needsQuest || !nodeId) && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-obsidian-core border border-ui-border-soft text-ui-text-muted rounded hover:bg-bg-hover transition-colors text-sm"
              >
                Понятно
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
