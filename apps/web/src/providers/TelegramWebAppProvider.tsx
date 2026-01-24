'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { setToken, setUser, getToken } from '../lib/api';
import { initTelegramDevMock, isTelegramDevMock } from '../lib/telegram-dev-mock';

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
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
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
  authError: string | null;
  clearAuthError: () => void;
}

const TelegramWebAppContext = createContext<TelegramWebAppContextType>({
  webApp: null,
  user: null,
  isInTelegram: false,
  isReady: false,
  authError: null,
  clearAuthError: () => {},
});

export function useTelegramWebApp() {
  return useContext(TelegramWebAppContext);
}

interface Props {
  children: ReactNode;
}

export function TelegramWebAppProvider({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setTgUser] = useState<TelegramUser | null>(null);
  const [isInTelegram, setIsInTelegram] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  useEffect(() => {
    // Dev mode: инициализируем mock если включен
    const mockEnabled = initTelegramDevMock();
    if (mockEnabled) {
      console.log('[TelegramWebAppProvider] Dev mock active');
    }
    
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

      // Проверяем, есть ли уже токен (уже авторизован)
      const existingToken = getToken();
      if (existingToken) {
        setIsReady(true);
        return;
      }

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
            
            // Haptic feedback при успешной авторизации
            try {
              tg.HapticFeedback?.notificationOccurred('success');
            } catch {
              // HapticFeedback might not be available
            }
            
            // Редирект на dashboard после успешной авторизации
            // Только если мы на странице логина или корневой странице
            if (pathname === '/login' || pathname === '/') {
              router.push('/dashboard');
            }
          } else {
            const errorText = await response.text();
            const errorMessage = `Ошибка авторизации: ${response.status}`;
            setAuthError(errorMessage);
            
            // Haptic feedback при ошибке
            try {
              tg.HapticFeedback?.notificationOccurred('error');
            } catch {
              // HapticFeedback might not be available
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? `Ошибка сети: ${error.message}` 
            : 'Не удалось подключиться к серверу';
          setAuthError(errorMessage);
          
          // Haptic feedback при ошибке
          try {
            tg.HapticFeedback?.notificationOccurred('error');
          } catch {
            // HapticFeedback might not be available
          }
        } finally {
          setIsReady(true);
        }
      };

      autoAuth();
    } else {
      // Не в Telegram - обычный режим
      setIsReady(true);
    }
  }, [pathname, router]);

  return (
    <TelegramWebAppContext.Provider value={{ webApp, user, isInTelegram, isReady, authError, clearAuthError }}>
      {children}
      {/* Показываем ошибку авторизации как toast/banner */}
      {authError && isInTelegram && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-tension-red/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between">
          <span className="text-sm">{authError}</span>
          <button 
            onClick={clearAuthError}
            className="ml-2 text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </TelegramWebAppContext.Provider>
  );
}
