'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Логируем только в development режиме
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-bg-main">
            <div className="max-w-md w-full bg-bg-panel border border-ui-border-soft shadow-floating rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-bg-secondary border border-system-critical/30 rounded-full">
                <svg
                  className="w-6 h-6 text-system-critical"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-center text-xl font-semibold text-ui-text-main">
                Что-то пошло не так
              </h2>
              <p className="mt-2 text-center text-sm text-ui-text-muted">
                Произошла ошибка при загрузке страницы. Пожалуйста, попробуйте обновить страницу.
              </p>
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-bg-secondary border border-ui-border-soft rounded text-xs text-ui-text-dim font-mono overflow-auto">
                  {this.state.error.message}
                </div>
              )}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined });
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-bg-secondary border border-system-focus text-system-focus rounded-md hover:border-system-focus/70 hover:bg-bg-panel focus:outline-none focus:ring-2 focus:ring-system-focus transition-colors"
                >
                  Обновить страницу
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

