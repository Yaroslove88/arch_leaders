/**
 * Telegram WebApp utilities
 * Provides detection and graceful degradation for Telegram Mini Apps
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          auth_date?: number;
          hash?: string;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        onEvent: (eventType: string, callback: () => void) => void;
        offEvent: (eventType: string, callback: () => void) => void;
        sendData: (data: string) => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{
            id?: string;
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
            text?: string;
          }>;
        }, callback?: (buttonId: string) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        platform: string;
        version: string;
      };
    };
  }
}

/**
 * Check if app is running inside Telegram WebApp
 */
export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.Telegram?.WebApp?.initData);
}

/**
 * Get Telegram WebApp instance (returns null if not in Telegram)
 */
export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

/**
 * Get Telegram user info (returns null if not in Telegram)
 */
export function getTelegramUser() {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user ?? null;
}

/**
 * Initialize Telegram WebApp (call on app mount)
 * Safe to call outside Telegram - will do nothing
 */
export function initTelegramWebApp() {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  // Signal that app is ready
  webApp.ready();

  // Expand to full height
  webApp.expand();

  // Set theme colors to match our design system
  try {
    webApp.setHeaderColor('#0F1216'); // obsidian-core
    webApp.setBackgroundColor('#0F1216');
  } catch {
    // Some versions may not support these methods
  }
}

/**
 * Trigger haptic feedback (safe to call outside Telegram)
 */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') {
  const webApp = getTelegramWebApp();
  if (!webApp?.HapticFeedback) return;

  try {
    if (type === 'success' || type === 'error' || type === 'warning') {
      webApp.HapticFeedback.notificationOccurred(type);
    } else if (type === 'selection') {
      webApp.HapticFeedback.selectionChanged();
    } else {
      webApp.HapticFeedback.impactOccurred(type);
    }
  } catch {
    // Silently fail if haptic not available
  }
}

/**
 * Open external link (uses Telegram's openLink in TWA, regular window.open otherwise)
 */
export function openExternalLink(url: string, options?: { tryInstantView?: boolean }) {
  const webApp = getTelegramWebApp();
  
  if (webApp) {
    webApp.openLink(url, { try_instant_view: options?.tryInstantView });
  } else if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Show confirmation dialog (uses Telegram's showConfirm in TWA, regular confirm otherwise)
 */
export function showConfirmDialog(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const webApp = getTelegramWebApp();
    
    if (webApp) {
      webApp.showConfirm(message, (confirmed) => {
        resolve(confirmed);
      });
    } else if (typeof window !== 'undefined') {
      resolve(window.confirm(message));
    } else {
      resolve(false);
    }
  });
}

/**
 * Show alert dialog (uses Telegram's showAlert in TWA, regular alert otherwise)
 */
export function showAlertDialog(message: string): Promise<void> {
  return new Promise((resolve) => {
    const webApp = getTelegramWebApp();
    
    if (webApp) {
      webApp.showAlert(message, () => {
        resolve();
      });
    } else if (typeof window !== 'undefined') {
      window.alert(message);
      resolve();
    } else {
      resolve();
    }
  });
}

/**
 * Get current platform info
 */
export function getPlatformInfo() {
  const webApp = getTelegramWebApp();
  
  return {
    isTelegram: isTelegramWebApp(),
    platform: webApp?.platform ?? 'web',
    version: webApp?.version ?? null,
  };
}
