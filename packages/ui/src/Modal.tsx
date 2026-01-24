'use client';

import React, { useEffect, useRef, useCallback, HTMLAttributes } from 'react';
import FocusTrap from 'focus-trap-react';

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Modal title (optional) */
  title?: React.ReactNode;
  /** Modal content */
  children: React.ReactNode;
  /** Size of the modal */
  size?: ModalSize;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Additional class for the modal content */
  contentClassName?: string;
  /** Disable closing on backdrop click */
  disableBackdropClick?: boolean;
  /** Disable closing on Escape key */
  disableEscapeKey?: boolean;
  /** Footer content (optional) */
  footer?: React.ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-4xl',
};

/**
 * Unified Modal component with focus trap and accessibility
 * 
 * Features:
 * - Focus trap (keeps focus within modal)
 * - Returns focus to trigger element on close
 * - Closes on Escape key
 * - Closes on backdrop click
 * - ARIA attributes for accessibility
 * - Consistent styling across the app
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  contentClassName,
  disableBackdropClick = false,
  disableEscapeKey = false,
  footer,
  className,
  ...rest
}: ModalProps) {
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`);

  // Store the previously focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Return focus to previous element when modal closes
  useEffect(() => {
    if (!isOpen && previousActiveElement.current) {
      // Small delay to ensure the modal is fully closed
      const timeoutId = setTimeout(() => {
        previousActiveElement.current?.focus();
      }, 10);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Handle Escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !disableEscapeKey) {
      onClose();
    }
  }, [onClose, disableEscapeKey]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (!disableBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <FocusTrap
      focusTrapOptions={{
        allowOutsideClick: true,
        fallbackFocus: () => modalRef.current || document.body,
      }}
    >
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          'bg-black/50 backdrop-blur-sm',
          'p-4 overflow-y-auto',
          className
        )}
        onClick={handleBackdropClick}
        role="presentation"
        {...rest}
      >
        <div
          ref={modalRef}
          className={cn(
            'relative w-full my-auto',
            'bg-graphite-structure border border-ui-border-soft',
            'rounded-xl shadow-active',
            sizeClasses[size],
            contentClassName
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId.current : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-4 border-b border-ui-border-soft">
              {title && (
                <h2
                  id={titleId.current}
                  className="text-lg font-bold text-ash-light pr-8"
                >
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'text-ui-text-muted hover:text-ash-light',
                    'p-2 min-w-[44px] min-h-[44px]',
                    'flex items-center justify-center',
                    'transition-colors rounded-lg',
                    'focus:outline-none focus:ring-2 focus:ring-strategic-blue/50',
                    !title && 'absolute top-2 right-2'
                  )}
                  aria-label="Закрыть модальное окно"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-4 border-t border-ui-border-soft">
              {footer}
            </div>
          )}
        </div>
      </div>
    </FocusTrap>
  );
}

export default Modal;
