/**
 * Утилиты для работы с режимом админа
 */

/**
 * Проверяет, является ли пользователь админом
 * Админ определяется через переменную окружения NEXT_PUBLIC_ADMIN_MODE
 * или через localStorage ключ 'admin_mode'
 */
export function isAdmin(): boolean {
  if (typeof window === 'undefined') {
    // На сервере проверяем только переменную окружения
    return process.env.NEXT_PUBLIC_ADMIN_MODE === 'true';
  }

  // На клиенте проверяем и переменную окружения, и localStorage
  const envAdmin = process.env.NEXT_PUBLIC_ADMIN_MODE === 'true';
  const localAdmin = localStorage.getItem('admin_mode') === 'true';
  
  return envAdmin || localAdmin;
}

/**
 * Включает режим админа (сохраняет в localStorage)
 */
export function enableAdminMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_mode', 'true');
  }
}

/**
 * Выключает режим админа
 */
export function disableAdminMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_mode');
  }
}

/**
 * Переключает режим админа
 */
export function toggleAdminMode(): boolean {
  if (isAdmin()) {
    disableAdminMode();
    return false;
  } else {
    enableAdminMode();
    return true;
  }
}

