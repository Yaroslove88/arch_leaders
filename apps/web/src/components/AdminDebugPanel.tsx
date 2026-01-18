'use client';

import { useState } from 'react';
import { isAdminDebugMode } from '@/lib/admin';
import { useAuth } from '@/hooks/useAuth';

interface AdminDebugPanelProps {
  data: any;
  title?: string;
}

export function AdminDebugPanel({ data, title = 'Отладка' }: AdminDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  if (!isAdminDebugMode(user)) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-obsidian-core border border-catalyst-gold rounded text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left font-semibold text-catalyst-gold"
      >
        <span>{isOpen ? '▼' : '▶'}</span>
        <span>{title}</span>
        <span className="ml-auto text-catalyst-gold/70">[ADMIN DEBUG]</span>
      </button>
      {isOpen && (
        <div className="mt-2 p-2 bg-graphite-structure rounded border border-ui-border-soft">
          <pre className="text-xs overflow-auto max-h-96 text-ash-light">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function AdminLabel() {
  const { user } = useAuth();
  
  if (!isAdminDebugMode(user)) {
    return null;
  }

  return (
    <span className="ml-2 px-2 py-1 bg-sage-green border border-sage-green text-ash-light text-xs rounded font-semibold">
      ADMIN
    </span>
  );
}
