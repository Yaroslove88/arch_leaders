import { useEffect, useState } from 'react';
import {
  isTelegramWebApp,
  getTelegramWebApp,
  getTelegramUser,
  initTelegramWebApp,
  hapticFeedback,
  getPlatformInfo,
} from '../lib/telegram';

/**
 * Hook for Telegram WebApp integration
 * Provides platform detection and Telegram-specific features
 */
export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    // Initialize on mount
    const inTelegram = isTelegramWebApp();
    setIsTelegram(inTelegram);

    if (inTelegram) {
      initTelegramWebApp();
    }

    setIsReady(true);
  }, []);

  return {
    /** Whether the hook has initialized */
    isReady,
    /** Whether running inside Telegram WebApp */
    isTelegram,
    /** Telegram WebApp instance (null if not in Telegram) */
    webApp: getTelegramWebApp(),
    /** Telegram user info (null if not in Telegram) */
    user: getTelegramUser(),
    /** Platform info */
    platform: getPlatformInfo(),
    /** Trigger haptic feedback */
    haptic: hapticFeedback,
  };
}

export default useTelegram;
