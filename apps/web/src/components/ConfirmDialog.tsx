'use client';

import { useEffect, useRef } from 'react';
import { Modal, Button } from '@leadership-architect/ui';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'default';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered before focusing
      const timeoutId = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  const isDanger = variant === 'danger';
  const iconColorClass = isDanger ? 'text-tension-red' : 'text-strategic-blue';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      showCloseButton={false}
      contentClassName="rounded-lg"
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${iconColorClass}`}>
          {isDanger ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-ash-light mb-2">
            {title}
          </h3>
          <p className="text-sm text-ui-text-muted">
            {message}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="secondary"
          size="md"
          onClick={onCancel}
        >
          {cancelText}
        </Button>
        <button
          ref={confirmButtonRef}
          onClick={onConfirm}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isDanger
              ? 'bg-obsidian-core border border-tension-red hover:border-tension-red/70 text-tension-red focus:ring-tension-red'
              : 'bg-obsidian-core border border-strategic-blue hover:border-strategic-blue/70 text-strategic-blue focus:ring-strategic-blue'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
