/**
 * Переводы навыков (skill_used) на русский язык
 * Используется для отображения навыков в кейсах
 */

export const skillTranslations: Record<string, string> = {
  // Основные стили действий
  'Direct Order': 'Прямой приказ',
  'Context Share': 'Передача контекста',
  'Let It Break': 'Дать сломаться',
  'Containment': 'Удержание',
  'Avoidance': 'Избегание',
  'Subjectivity': 'Субъектность',
  'Hero Mode': 'Режим героя',
  'Delegation': 'Делегирование',
  'Delegation with Risk': 'Делегирование с риском',
  'Rule Creation': 'Создание правил',
  'Compromise': 'Компромисс',
  'Architecture Coupling': 'Архитектурная связка',
  'Scenario Thinking': 'Сценарное мышление',
  'Delay': 'Откладывание',
  
  // Дополнительные навыки
  'Intuitive Decision': 'Интуитивное решение',
  'Firefighting': 'Тушение пожаров',
  'Standardization': 'Стандартизация',
  'Separation': 'Разделение',
  'Micro-management': 'Микроменеджмент',
  'Dumping': 'Сброс ответственности',
  'Direct Fix': 'Прямое исправление',
  'Both/And': 'И то, и другое',
  'Blame': 'Обвинение',
  'Control': 'Контроль',
  'Selective Autonomy': 'Селективная автономия',
  
  // Комбинированные
  'Let It Break + Containment': 'Дать сломаться + Удержание',
};

/**
 * Переводит навык на русский язык
 * @param skill - название навыка на английском
 * @returns переведённое название или оригинал, если перевода нет
 */
export function translateSkill(skill: string): string {
  if (!skill) return '';
  
  // Очищаем от переносов строк
  const cleanSkill = skill.split('\n')[0].trim();
  
  return skillTranslations[cleanSkill] || cleanSkill;
}

/**
 * Проверяет, есть ли перевод для навыка
 */
export function hasSkillTranslation(skill: string): boolean {
  if (!skill) return false;
  const cleanSkill = skill.split('\n')[0].trim();
  return cleanSkill in skillTranslations;
}
