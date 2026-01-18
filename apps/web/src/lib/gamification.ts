/**
 * Gamification system types and utilities
 * Система мотивации: серии, достижения, уровни
 */

// Серия (streak)
export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakDays: boolean[]; // Last 7 days
}

// Достижение
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'first_steps' | 'quantity' | 'streaks' | 'depth' | 'balance' | 'patterns';
  unlockedAt?: string;
  isUnlocked: boolean;
}

// Уровень способности
export interface NodeLevel {
  nodeId: string;
  level: number; // 1-10
  currentXP: number;
  xpToNextLevel: number;
  progress: number; // 0-100%
}

// Полное состояние gamification для пользователя
export interface UserGamification {
  streak: Streak;
  achievements: Achievement[];
  nodeLevels: Record<string, NodeLevel>;
  totalXP: number;
}

// Определения достижений
export const ACHIEVEMENTS: Omit<Achievement, 'isUnlocked' | 'unlockedAt'>[] = [
  // Первые шаги
  { id: 'first_situation', title: 'Первая ситуация', description: 'Описал первую ситуацию', icon: '📝', category: 'first_steps' },
  { id: 'first_quest', title: 'Первый квест', description: 'Завершил первый квест', icon: '⚔️', category: 'first_steps' },
  { id: 'first_case', title: 'Первый кейс', description: 'Решил первый кейс', icon: '📊', category: 'first_steps' },
  { id: 'first_evidence', title: 'Первый след', description: 'Добавил первое доказательство', icon: '👁️', category: 'first_steps' },
  
  // Количество
  { id: 'quests_10', title: '10 квестов', description: 'Завершил 10 квестов', icon: '🎯', category: 'quantity' },
  { id: 'quests_25', title: '25 квестов', description: 'Завершил 25 квестов', icon: '🏆', category: 'quantity' },
  { id: 'cases_10', title: '10 кейсов', description: 'Решил 10 кейсов', icon: '📚', category: 'quantity' },
  { id: 'cases_25', title: '25 кейсов', description: 'Решил 25 кейсов', icon: '🎓', category: 'quantity' },
  
  // Серии
  { id: 'streak_7', title: 'Неделя подряд', description: '7 дней активности подряд', icon: '🔥', category: 'streaks' },
  { id: 'streak_30', title: 'Месяц подряд', description: '30 дней активности подряд', icon: '💪', category: 'streaks' },
  { id: 'streak_100', title: 'Сотня', description: '100 дней активности подряд', icon: '⭐', category: 'streaks' },
  
  // Глубина
  { id: 'advanced_case', title: 'Сложный кейс', description: 'Решил advanced кейс', icon: '🧠', category: 'depth' },
  { id: 'all_node_cases', title: 'Мастер узла', description: 'Решил все кейсы одного узла', icon: '🌟', category: 'depth' },
  { id: 'branch_complete', title: 'Ветка освоена', description: 'Все узлы ветки активны', icon: '🌳', category: 'depth' },
  
  // Баланс
  { id: 'balance_3', title: 'Баланс', description: '3+ ветки активны', icon: '⚖️', category: 'balance' },
  { id: 'no_imbalance', title: 'Гармония', description: 'Нет перекосов в развитии', icon: '☯️', category: 'balance' },
  
  // Паттерны
  { id: 'all_styles', title: 'Все стили', description: 'Попробовал все стили решений в кейсах', icon: '🎭', category: 'patterns' },
];

// XP необходимый для каждого уровня
export const XP_PER_LEVEL = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];

/**
 * Расчёт уровня из XP
 */
export function calculateLevel(xp: number): { level: number; currentXP: number; xpToNextLevel: number; progress: number } {
  let level = 1;
  for (let i = 1; i < XP_PER_LEVEL.length; i++) {
    if (xp >= XP_PER_LEVEL[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  
  const currentLevelXP = XP_PER_LEVEL[level - 1] || 0;
  const nextLevelXP = XP_PER_LEVEL[level] || XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
  const xpInCurrentLevel = xp - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  const progress = level >= 10 ? 100 : Math.round((xpInCurrentLevel / xpNeededForLevel) * 100);
  
  return {
    level,
    currentXP: xpInCurrentLevel,
    xpToNextLevel: xpNeededForLevel - xpInCurrentLevel,
    progress,
  };
}

/**
 * Проверка серии (streak)
 */
export function checkStreak(lastActivityDate: string | null): { isActive: boolean; daysUntilLost: number } {
  if (!lastActivityDate) {
    return { isActive: false, daysUntilLost: 0 };
  }
  
  const last = new Date(lastActivityDate);
  const now = new Date();
  const diffTime = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) {
    return { isActive: true, daysUntilLost: diffDays === 0 ? 1 : 0 };
  }
  
  return { isActive: false, daysUntilLost: 0 };
}

/**
 * Получение данных gamification из localStorage (временное решение до backend)
 */
export function getGamificationData(): UserGamification {
  if (typeof window === 'undefined') {
    return getDefaultGamification();
  }
  
  try {
    const stored = localStorage.getItem('gamification');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  
  return getDefaultGamification();
}

/**
 * Сохранение данных gamification
 */
export function saveGamificationData(data: UserGamification): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('gamification', JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Значения по умолчанию
 */
export function getDefaultGamification(): UserGamification {
  return {
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      streakDays: [false, false, false, false, false, false, false],
    },
    achievements: ACHIEVEMENTS.map(a => ({ ...a, isUnlocked: false })),
    nodeLevels: {},
    totalXP: 0,
  };
}

/**
 * Обновить streak при активности
 */
export function updateStreak(data: UserGamification): UserGamification {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  if (data.streak.lastActivityDate === today) {
    // Уже была активность сегодня
    return data;
  }
  
  const { isActive } = checkStreak(data.streak.lastActivityDate);
  
  const newStreak = isActive ? data.streak.currentStreak + 1 : 1;
  const newLongest = Math.max(newStreak, data.streak.longestStreak);
  
  // Update streak days (shift left and add today)
  const newDays = [...data.streak.streakDays.slice(1), true];
  
  return {
    ...data,
    streak: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityDate: today,
      streakDays: newDays,
    },
  };
}

/**
 * Разблокировать достижение
 */
export function unlockAchievement(data: UserGamification, achievementId: string): { data: UserGamification; unlocked: Achievement | null } {
  const index = data.achievements.findIndex(a => a.id === achievementId);
  if (index === -1 || data.achievements[index].isUnlocked) {
    return { data, unlocked: null };
  }
  
  const newAchievements = [...data.achievements];
  newAchievements[index] = {
    ...newAchievements[index],
    isUnlocked: true,
    unlockedAt: new Date().toISOString(),
  };
  
  return {
    data: { ...data, achievements: newAchievements },
    unlocked: newAchievements[index],
  };
}
