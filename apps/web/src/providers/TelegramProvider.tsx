'use client';

import { useEffect, createContext, useContext, useState, ReactNode } from 'react';
import {
  isTelegramWebApp,
  getTelegramWebApp,
  getTelegramUser,
  initTelegramWebApp,
  getPlatformInfo,
} from '../lib/telegram';

interface TelegramContextValue {
  isReady: boolean;
  isTelegram: boolean;
  user: ReturnType<typeof getTelegramUser>;
  platform: ReturnType<typeof getPlatformInfo>;
}

const TelegramContext = createContext<TelegramContextValue>({
  isReady: false,
  isTelegram: false,
  user: null,
  platform: { isTelegram: false, platform: 'web', version: null },
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    const inTelegram = isTelegramWebApp();
    setIsTelegram(inTelegram);

    if (inTelegram) {
      initTelegramWebApp();
    }

    setIsReady(true);
  }, []);

  const value: TelegramContextValue = {
    isReady,
    isTelegram,
    user: getTelegramUser(),
    platform: getPlatformInfo(),
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegramContext() {
  return useContext(TelegramContext);
}

export default TelegramProvider;
