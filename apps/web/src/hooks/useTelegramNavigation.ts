'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegramWebApp } from '../providers/TelegramWebAppProvider';

/**
 * Hook for Telegram WebApp native navigation
 * Shows BackButton in Telegram Mini App and handles navigation
 * 
 * @param backPath - Path to navigate to when BackButton is clicked
 * @param options - Additional options
 */
export function useTelegramNavigation(
  backPath: string,
  options?: {
    /** Show MainButton with custom text */
    mainButtonText?: string;
    /** Callback when MainButton is clicked */
    onMainButtonClick?: () => void;
    /** Enable haptic feedback on button clicks */
    hapticFeedback?: boolean;
  }
) {
  const { webApp, isInTelegram, isReady } = useTelegramWebApp();
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (options?.hapticFeedback && webApp) {
      try {
        webApp.HapticFeedback?.impactOccurred('light');
      } catch {
        // HapticFeedback might not be available
      }
    }
    router.push(backPath);
  }, [backPath, router, webApp, options?.hapticFeedback]);

  // BackButton setup
  useEffect(() => {
    if (!isReady || !isInTelegram || !webApp) return;

    try {
      webApp.BackButton.show();
      webApp.BackButton.onClick(handleBack);
    } catch (error) {
      console.warn('Failed to setup Telegram BackButton:', error);
    }

    return () => {
      try {
        webApp.BackButton.hide();
        // Note: Telegram API doesn't have offClick, so we rely on component unmount
      } catch {
        // Cleanup might fail if webApp is not available
      }
    };
  }, [isReady, isInTelegram, webApp, handleBack]);

  // MainButton setup (optional)
  useEffect(() => {
    if (!isReady || !isInTelegram || !webApp) return;
    if (!options?.mainButtonText || !options?.onMainButtonClick) return;

    try {
      webApp.MainButton.text = options.mainButtonText;
      webApp.MainButton.show();
      webApp.MainButton.onClick(() => {
        if (options?.hapticFeedback) {
          try {
            webApp.HapticFeedback?.impactOccurred('medium');
          } catch {
            // HapticFeedback might not be available
          }
        }
        options.onMainButtonClick?.();
      });
    } catch (error) {
      console.warn('Failed to setup Telegram MainButton:', error);
    }

    return () => {
      try {
        webApp.MainButton.hide();
      } catch {
        // Cleanup might fail
      }
    };
  }, [isReady, isInTelegram, webApp, options?.mainButtonText, options?.onMainButtonClick, options?.hapticFeedback]);

  return {
    /** Whether in Telegram Mini App */
    isInTelegram,
    /** Manual trigger for back navigation */
    goBack: handleBack,
    /** WebApp instance for advanced usage */
    webApp,
  };
}

export default useTelegramNavigation;
