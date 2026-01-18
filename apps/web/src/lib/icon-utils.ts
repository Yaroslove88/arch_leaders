/**
 * Утилиты для работы с иконками
 * Маппинг названий веток, квестов, кейсов к иконкам
 */

import type { BranchIconName, QuestIconName, CaseIconName, BuildIconName, StatusIconName } from '@/components/icons/Icon';

/**
 * Маппинг ID веток к иконкам
 * Поддерживает английские и русские названия
 */
export const branchIconMap: Record<string, BranchIconName> = {
  // Английские ID
  'subjectivity': 'subjectivity',
  'architectural-thinking': 'architectural-thinking',
  'architectural_thinking': 'architectural-thinking', // с подчеркиванием
  'responsibility': 'responsibility',
  'environment-maturity': 'environment-maturity',
  'environment_maturity': 'environment-maturity', // с подчеркиванием
  'resilience': 'resilience',
  'feedback': 'feedback',
  // Русские названия
  'субъектность': 'subjectivity',
  'архитектурное-мышление': 'architectural-thinking',
  'архитектурное мышление': 'architectural-thinking',
  'архитектурное_мышление': 'architectural-thinking',
  'ответственность': 'responsibility',
  'среда-зрелости': 'environment-maturity',
  'среда зрелости': 'environment-maturity',
  'среда_зрелости': 'environment-maturity',
  'устойчивость': 'resilience',
  'обратная-связь': 'feedback',
  'обратная связь': 'feedback',
  'обратная_связь': 'feedback',
};

/**
 * Получить иконку ветки по ID
 * Поддерживает поиск по точному совпадению и по частичному совпадению (case-insensitive)
 * Также ищет по ключевым словам в названии
 */
export function getBranchIcon(branchId: string): BranchIconName | null {
  // Прямое совпадение
  if (branchIconMap[branchId]) {
    return branchIconMap[branchId];
  }
  
  // Нормализуем ID: убираем пробелы, приводим к нижнему регистру
  const normalizedId = branchId.toLowerCase().trim().replace(/\s+/g, '-').replace(/_/g, '-');
  
  // Проверяем нормализованный вариант
  if (branchIconMap[normalizedId]) {
    return branchIconMap[normalizedId];
  }
  
  // Поиск по ключевым словам
  const lowerId = normalizedId;
  
  // Маппинг ключевых слов к иконкам
  const keywordMap: Record<string, BranchIconName> = {
    'subjectivity': 'subjectivity',
    'субъектность': 'subjectivity',
    'architectural': 'architectural-thinking',
    'мышление': 'architectural-thinking',
    'thinking': 'architectural-thinking',
    'responsibility': 'responsibility',
    'ответственность': 'responsibility',
    'environment': 'environment-maturity',
    'maturity': 'environment-maturity',
    'зрелости': 'environment-maturity',
    'среда': 'environment-maturity',
    'resilience': 'resilience',
    'устойчивость': 'resilience',
    'feedback': 'feedback',
    'обратная': 'feedback',
    'связь': 'feedback',
  };
  
  // Ищем ключевые слова в ID
  for (const [keyword, icon] of Object.entries(keywordMap)) {
    if (lowerId.includes(keyword)) {
      return icon;
    }
  }
  
  // Поиск по частичному совпадению (case-insensitive)
  for (const [key, icon] of Object.entries(branchIconMap)) {
    const normalizedKey = key.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
    if (normalizedKey === lowerId || lowerId.includes(normalizedKey) || normalizedKey.includes(lowerId)) {
      return icon;
    }
  }
  
  return null;
}

/**
 * Маппинг типов квестов к иконкам
 */
export const questIconMap: Record<string, QuestIconName> = {
  'micro': 'quest-micro',
  'weekly': 'quest-weekly',
  'story': 'quest-story',
  'default': 'quest-default',
};

/**
 * Получить иконку квеста по типу
 */
export function getQuestIcon(questType: string): QuestIconName {
  return questIconMap[questType] || 'quest-default';
}

/**
 * Маппинг стилей лидерства к иконкам
 */
export const buildIconMap: Record<string, BuildIconName> = {
  'architect': 'architect',
  'strategist': 'strategist',
};

/**
 * Получить иконку стиля лидерства по ID
 */
export function getBuildIcon(buildId: string): BuildIconName | null {
  return buildIconMap[buildId] || null;
}

/**
 * Получить иконку кейса (всегда case-default)
 */
export function getCaseIcon(): CaseIconName {
  return 'case-default';
}

/**
 * Маппинг статусов к иконкам
 */
export const statusIconMap: Record<string, StatusIconName> = {
  'backlog': 'backlog',
  'available': 'backlog', // Доступен = отложен
  'active': 'active',
  'in_progress': 'active', // В процессе = активный
  'done': 'done',
  'completed': 'done', // Завершён = done
  'archived': 'archived',
  'locked': 'archived', // Заблокирован = архивирован
};

/**
 * Получить иконку статуса
 */
export function getStatusIcon(status: string): StatusIconName {
  return statusIconMap[status] || 'backlog';
}

/**
 * Получить цвет для иконки статуса
 */
export function getStatusIconColor(status: string): string {
  switch (status) {
    case 'backlog':
    case 'available':
      return 'text-system-warning'; // Желтый #F2A03D
    case 'active':
    case 'in_progress':
      return 'text-system-growth'; // Зеленый #5FA38D
    case 'done':
    case 'completed':
      return 'text-ui-text-muted'; // Серый #9AA4B2
    case 'archived':
    case 'locked':
      return 'text-ui-text-dim'; // Темно-серый #6C7684
    default:
      return 'text-ui-text-main';
  }
}
