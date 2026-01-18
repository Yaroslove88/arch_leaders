/**
 * Перевод навыков на русский язык
 */
const skillTranslations: Record<string, string> = {
  delegation: 'Делегирование',
  feedback: 'Обратная связь',
  conflict_resolution: 'Разрешение конфликтов',
  decision_making: 'Принятие решений',
  strategic_thinking: 'Стратегическое мышление',
  communication: 'Коммуникация',
  team_building: 'Командообразование',
  motivation: 'Мотивация',
  time_management: 'Управление временем',
  prioritization: 'Приоритизация',
  negotiation: 'Переговоры',
  emotional_intelligence: 'Эмоциональный интеллект',
  coaching: 'Коучинг',
  mentoring: 'Менторство',
  planning: 'Планирование',
};

export function translateSkill(skill: string): string {
  // Проверяем прямое соответствие
  if (skillTranslations[skill]) {
    return skillTranslations[skill];
  }

  // Проверяем с нижним регистром
  const lowerSkill = skill.toLowerCase().replace(/\s+/g, '_');
  if (skillTranslations[lowerSkill]) {
    return skillTranslations[lowerSkill];
  }

  // Fallback: форматируем строку
  return skill
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
