/**
 * Telegram WebApp Dev Mock
 * Enables browser testing without Telegram
 * 
 * Usage: Import this file early in development mode
 * The mock is only active when:
 * 1. NODE_ENV === 'development'
 * 2. Not already inside Telegram WebApp
 * 3. URL has ?dev_mock=true OR localStorage has 'telegram_dev_mock' = 'true'
 */

const DEV_MOCK_USER = {
  id: 999999999,
  first_name: 'Dev',
  last_name: 'User',
  username: 'dev_user',
  language_code: 'ru',
};

/**
 * Generate initData in Telegram WebApp format
 * Format: URL-encoded params with user as JSON string
 */
function generateMockInitData(): string {
  const authDate = Math.floor(Date.now() / 1000);
  const userJson = JSON.stringify(DEV_MOCK_USER);
  
  const params = new URLSearchParams();
  params.set('user', userJson);
  params.set('auth_date', authDate.toString());
  params.set('hash', 'dev_mock_hash_' + authDate);
  
  return params.toString();
}

function createMockWebApp() {
  let mainButtonCallback: (() => void) | null = null;
  let backButtonCallback: (() => void) | null = null;
  
  const initData = generateMockInitData();

  const mockWebApp = {
    initData,
    initDataUnsafe: {
      user: DEV_MOCK_USER,
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'dev_mock_hash',
    },
    ready: () => console.log('[TG Mock] ready()'),
    expand: () => console.log('[TG Mock] expand()'),
    close: () => console.log('[TG Mock] close()'),
    isExpanded: true,
    viewportHeight: window.innerHeight,
    viewportStableHeight: window.innerHeight,
    headerColor: '#1a1a1a',
    backgroundColor: '#1a1a1a',
    colorScheme: 'dark' as const,
    themeParams: {
      bg_color: '#1a1a1a',
      text_color: '#ffffff',
      hint_color: '#999999',
      link_color: '#4a9eff',
      button_color: '#4a9eff',
      button_text_color: '#ffffff',
      secondary_bg_color: '#2a2a2a',
    },
    MainButton: {
      text: '',
      color: '#4a9eff',
      textColor: '#ffffff',
      isVisible: false,
      isActive: true,
      show: function() { 
        this.isVisible = true; 
        console.log('[TG Mock] MainButton.show()'); 
      },
      hide: function() { 
        this.isVisible = false; 
        console.log('[TG Mock] MainButton.hide()'); 
      },
      enable: function() { this.isActive = true; },
      disable: function() { this.isActive = false; },
      setText: function(text: string) { this.text = text; },
      onClick: (callback: () => void) => { mainButtonCallback = callback; },
      offClick: () => { mainButtonCallback = null; },
    },
    BackButton: {
      isVisible: false,
      show: function() { 
        this.isVisible = true; 
        console.log('[TG Mock] BackButton.show()'); 
      },
      hide: function() { 
        this.isVisible = false; 
        console.log('[TG Mock] BackButton.hide()'); 
      },
      onClick: (callback: () => void) => { backButtonCallback = callback; },
      offClick: () => { backButtonCallback = null; },
    },
    HapticFeedback: {
      impactOccurred: (style: string) => console.log('[TG Mock] haptic:', style),
      notificationOccurred: (type: string) => console.log('[TG Mock] notification:', type),
      selectionChanged: () => console.log('[TG Mock] selection changed'),
    },
    setHeaderColor: (color: string) => console.log('[TG Mock] setHeaderColor:', color),
    setBackgroundColor: (color: string) => console.log('[TG Mock] setBackgroundColor:', color),
    enableClosingConfirmation: () => {},
    disableClosingConfirmation: () => {},
    onEvent: (eventType: string, callback: () => void) => {},
    offEvent: (eventType: string, callback: () => void) => {},
    sendData: (data: string) => console.log('[TG Mock] sendData:', data),
    openLink: (url: string) => window.open(url, '_blank'),
    openTelegramLink: (url: string) => window.open(url, '_blank'),
    showPopup: (params: any, callback?: (id: string) => void) => {
      const result = window.confirm(params.message);
      callback?.(result ? 'ok' : 'cancel');
    },
    showAlert: (message: string, callback?: () => void) => {
      window.alert(message);
      callback?.();
    },
    showConfirm: (message: string, callback?: (confirmed: boolean) => void) => {
      const result = window.confirm(message);
      callback?.(result);
    },
    platform: 'web',
    version: '7.0',
  };

  return mockWebApp;
}

export function initTelegramDevMock(): boolean {
  // Only in browser
  if (typeof window === 'undefined') return false;
  
  // Only in development
  if (process.env.NODE_ENV !== 'development') return false;
  
  // Already has real Telegram
  if (window.Telegram?.WebApp?.initData) return false;
  
  // Check if mock is enabled
  const urlParams = new URLSearchParams(window.location.search);
  const urlMock = urlParams.get('dev_mock') === 'true';
  const localMock = localStorage.getItem('telegram_dev_mock') === 'true';
  
  if (!urlMock && !localMock) return false;
  
  // Save preference
  if (urlMock) {
    localStorage.setItem('telegram_dev_mock', 'true');
  }
  
  console.log('%c[TG Mock] Telegram WebApp mock enabled', 'color: #4a9eff; font-weight: bold');
  console.log('[TG Mock] To disable, run: localStorage.removeItem("telegram_dev_mock")');
  
  // Create mock
  (window as any).Telegram = {
    WebApp: createMockWebApp(),
  };
  
  return true;
}

export function disableTelegramDevMock() {
  localStorage.removeItem('telegram_dev_mock');
  console.log('[TG Mock] Disabled. Reload page to apply.');
}

export function isTelegramDevMock(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('telegram_dev_mock') === 'true';
}
