/**
 * Утилиты для работы с режимом админа
 * 
 * БЕЗОПАСНОСТЬ: Admin Mode теперь работает на основе роли пользователя из JWT,
 * а не localStorage. localStorage используется ТОЛЬКО для переключателя
 * "просмотр как обычный пользователь" для уже авторизованных админов.
 */

import type { User } from './api';

/**
 * Проверяет, является ли пользователь админом
 * @param user - объект пользователя из useAuth()
 * @returns true если пользователь имеет роль admin
 */
export function isUserAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * Проверяет, включен ли режим отладки для админа
 * Режим отладки показывает debug-панели на страницах
 * @param user - объект пользователя из useAuth()
 * @returns true если пользователь админ И не отключил режим отладки
 */
export function isAdminDebugMode(user: User | null): boolean {
  if (!isUserAdmin(user)) {
    return false;
  }
  
  // Админ может временно отключить debug view через localStorage
  if (typeof window !== 'undefined') {
    const debugDisabled = localStorage.getItem('admin_debug_disabled') === 'true';
    return !debugDisabled;
  }
  
  return true;
}

/**
 * Проверяет, должны ли показываться все узлы/квесты как открытые
 * @param user - объект пользователя из useAuth()
 * @returns true если админ И включен режим "видеть всё"
 */
export function isAdminViewAllMode(user: User | null): boolean {
  if (!isUserAdmin(user)) {
    return false;
  }
  
  if (typeof window !== 'undefined') {
    // По умолчанию админ видит всё, можно отключить
    const viewAllDisabled = localStorage.getItem('admin_view_all_disabled') === 'true';
    return !viewAllDisabled;
  }
  
  return true;
}

/**
 * Переключает режим отладки для админа
 * @param user - объект пользователя
 * @returns новое состояние debug mode
 */
export function toggleAdminDebugMode(user: User | null): boolean {
  if (!isUserAdmin(user)) {
    return false;
  }
  
  if (typeof window !== 'undefined') {
    const currentlyDisabled = localStorage.getItem('admin_debug_disabled') === 'true';
    if (currentlyDisabled) {
      localStorage.removeItem('admin_debug_disabled');
      return true;
    } else {
      localStorage.setItem('admin_debug_disabled', 'true');
      return false;
    }
  }
  
  return false;
}

/**
 * Переключает режим "видеть всё" для админа
 * @param user - объект пользователя
 * @returns новое состояние view all mode
 */
export function toggleAdminViewAllMode(user: User | null): boolean {
  if (!isUserAdmin(user)) {
    return false;
  }
  
  if (typeof window !== 'undefined') {
    const currentlyDisabled = localStorage.getItem('admin_view_all_disabled') === 'true';
    if (currentlyDisabled) {
      localStorage.removeItem('admin_view_all_disabled');
      return true;
    } else {
      localStorage.setItem('admin_view_all_disabled', 'true');
      return false;
    }
  }
  
  return false;
}

// ============================================
// DEPRECATED: Старые функции для обратной совместимости
// Будут удалены в следующих версиях
// ============================================

/**
 * @deprecated Используйте isUserAdmin(user) вместо этой функции
 * Эта функция оставлена для обратной совместимости и
 * теперь требует передачи user через window.__CURRENT_USER__
 */
export function isAdmin(): boolean {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_ADMIN_MODE === 'true';
  }
  
  // Пытаемся получить пользователя из глобального контекста
  const user = (window as any).__CURRENT_USER__ as User | null;
  if (user) {
    return isAdminDebugMode(user);
  }
  
  // Fallback для dev режима
  if (process.env.NEXT_PUBLIC_ADMIN_MODE === 'true') {
    return true;
  }
  
  return false;
}

/**
 * @deprecated Используйте toggleAdminDebugMode(user)
 */
export function toggleAdminMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const user = (window as any).__CURRENT_USER__ as User | null;
  return toggleAdminDebugMode(user);
}

/**
 * @deprecated Больше не используется
 */
export function enableAdminMode(): void {
  console.warn('enableAdminMode() is deprecated. Admin mode is now based on user role.');
}

/**
 * @deprecated Больше не используется
 */
export function disableAdminMode(): void {
  console.warn('disableAdminMode() is deprecated. Use toggleAdminDebugMode(user) instead.');
}
