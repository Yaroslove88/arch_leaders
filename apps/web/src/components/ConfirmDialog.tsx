'use client';

import { useEffect, useRef } from 'react';

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
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Фокус на кнопке подтверждения при открытии
      confirmButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Блокируем скролл body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      confirmButton: 'bg-bg-secondary border border-system-critical hover:border-system-critical/70 text-system-critical focus:ring-system-critical',
      icon: 'text-system-critical',
    },
    default: {
      confirmButton: 'bg-bg-secondary border border-system-focus hover:border-system-focus/70 text-system-focus focus:ring-system-focus',
      icon: 'text-system-focus',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="relative bg-bg-panel border border-ui-border-soft rounded-lg shadow-floating max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${styles.icon}`}>
              {variant === 'danger' ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3
                id="confirm-dialog-title"
                className="text-lg font-medium text-ui-text-main mb-2"
              >
                {title}
              </h3>
              <p
                id="confirm-dialog-message"
                className="text-sm text-ui-text-muted mb-4"
              >
                {message}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              ref={cancelButtonRef}
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-ui-text-muted bg-bg-secondary border border-ui-border-soft rounded-lg hover:border-ui-border-strong hover:text-ui-text-main focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-system-focus transition-colors"
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.confirmButton} transition-colors`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10" />
    </div>
  );
}

