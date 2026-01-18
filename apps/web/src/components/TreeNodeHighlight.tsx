'use client';

import { useEffect, useState } from 'react';

interface TreeChange {
  node_id: string;
  node_name?: string;
  xpDelta: number;
  stateBefore: string;
  stateAfter: string;
  timestamp?: number;
}

interface TreeNodeHighlightProps {
  nodeId: string;
  recentChanges?: TreeChange[];
  /** Время в мс после которого highlight исчезает (default: 30000) */
  highlightDuration?: number;
}

/**
 * Компонент для подсветки недавно изменённых узлов дерева
 * Использует localStorage для персистентности между страницами
 */
export function TreeNodeHighlight({
  nodeId,
  recentChanges,
  highlightDuration = 30000,
}: TreeNodeHighlightProps) {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [change, setChange] = useState<TreeChange | null>(null);

  useEffect(() => {
    // Проверяем localStorage на недавние изменения
    const stored = localStorage.getItem('tree_recent_changes');
    if (stored) {
      try {
        const changes: TreeChange[] = JSON.parse(stored);
        const nodeChange = changes.find(c => c.node_id === nodeId);
        if (nodeChange && nodeChange.timestamp) {
          const elapsed = Date.now() - nodeChange.timestamp;
          if (elapsed < highlightDuration) {
            setIsHighlighted(true);
            setChange(nodeChange);
            
            // Убираем highlight через оставшееся время
            const timeout = setTimeout(() => {
              setIsHighlighted(false);
            }, highlightDuration - elapsed);
            
            return () => clearTimeout(timeout);
          }
        }
      } catch {
        // Игнорируем ошибки парсинга
      }
    }

    // Проверяем переданные изменения
    if (recentChanges) {
      const nodeChange = recentChanges.find(c => c.node_id === nodeId);
      if (nodeChange) {
        setIsHighlighted(true);
        setChange(nodeChange);
        
        const timeout = setTimeout(() => {
          setIsHighlighted(false);
        }, highlightDuration);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [nodeId, recentChanges, highlightDuration]);

  if (!isHighlighted || !change) {
    return null;
  }

  return (
    <div className="absolute -top-2 -right-2 z-10">
      <span 
        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sage-green text-obsidian-core text-[10px] font-bold rounded animate-pulse"
        title={`${change.stateBefore} → ${change.stateAfter}`}
      >
        +{change.xpDelta} XP
      </span>
    </div>
  );
}

/**
 * Сохранить изменения дерева в localStorage для отображения на странице дерева
 */
export function saveTreeChanges(changes: TreeChange[]) {
  const timestampedChanges = changes.map(c => ({
    ...c,
    timestamp: Date.now(),
  }));
  localStorage.setItem('tree_recent_changes', JSON.stringify(timestampedChanges));
}

/**
 * Очистить сохранённые изменения
 */
export function clearTreeChanges() {
  localStorage.removeItem('tree_recent_changes');
}
