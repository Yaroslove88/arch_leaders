'use client';

import { useState } from 'react';
import { isAdmin } from '@/lib/admin';

interface AdminDebugPanelProps {
  data: any;
  title?: string;
}

export function AdminDebugPanel({ data, title = 'Отладка' }: AdminDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-bg-secondary border border-system-warning rounded text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left font-semibold text-system-warning"
      >
        <span>{isOpen ? '▼' : '▶'}</span>
        <span>{title}</span>
        <span className="ml-auto text-system-warning/70">[ADMIN]</span>
      </button>
      {isOpen && (
        <div className="mt-2 p-2 bg-bg-panel rounded border border-ui-border-soft">
          <pre className="text-xs overflow-auto max-h-96 text-ui-text-main">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function AdminLabel() {
  if (!isAdmin()) {
    return null;
  }

  return (
    <span className="ml-2 px-2 py-1 bg-system-stable border border-system-stable text-ui-text-main text-xs rounded font-semibold">
      ADMIN
    </span>
  );
}

