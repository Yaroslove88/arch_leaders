'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { setToken, setUser } from '../lib/api';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  colorScheme: 'light' | 'dark';
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
}

interface TelegramWebAppContextType {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  isInTelegram: boolean;
  isReady: boolean;
}

const TelegramWebAppContext = createContext<TelegramWebAppContextType>({
  webApp: null,
  user: null,
  isInTelegram: false,
  isReady: false,
});

export function useTelegramWebApp() {
  return useContext(TelegramWebAppContext);
}

interface Props {
  children: ReactNode;
}

export function TelegramWebAppProvider({ children }: Props) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setTgUser] = useState<TelegramUser | null>(null);
  const [isInTelegram, setIsInTelegram] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Проверяем, запущено ли приложение в Telegram
    const tg = (window as any).Telegram?.WebApp as TelegramWebApp | undefined;
    
    if (tg && tg.initData) {
      setWebApp(tg);
      setIsInTelegram(true);
      
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setTgUser(tgUser);
      }

      // Сообщаем Telegram что приложение готово
      tg.ready();
      
      // Раскрываем на весь экран
      tg.expand();

      // Автоматическая авторизация через API
      const autoAuth = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/telegram-webapp`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ initData: tg.initData }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            // Сохраняем токен и пользователя
            setToken(data.access_token);
            setUser(data.user);
            console.log('✅ Telegram WebApp auth success:', data.user.telegramUsername);
          } else {
            console.error('❌ Telegram WebApp auth failed:', await response.text());
          }
        } catch (error) {
          console.error('❌ Telegram WebApp auth error:', error);
        } finally {
          setIsReady(true);
        }
      };

      autoAuth();
    } else {
      // Не в Telegram - обычный режим
      setIsReady(true);
    }
  }, []);

  return (
    <TelegramWebAppContext.Provider value={{ webApp, user, isInTelegram, isReady }}>
      {children}
    </TelegramWebAppContext.Provider>
  );
}
