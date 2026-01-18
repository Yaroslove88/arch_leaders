/**
 * Типы для новой структуры кейсов (v2)
 * Соответствует wireframe из "ТУТ НОВЫЙ дизайн кейсов 1.md"
 */

export type CaseDifficulty = 'basic' | 'intermediate' | 'advanced' | 'executive';

export interface CaseMeta {
  case_id: string;
  node_id: string;
  branch_id: string;
  access_level: CaseDifficulty;
  maturity_level?: string;
  symbols?: string[];
  strategic_tags?: string[];
  pressure_level?: 'low' | 'medium' | 'high' | 'critical';
  uncertainty?: 'low' | 'medium' | 'high' | 'critical';
  subjectivity_load?: 'low' | 'medium' | 'high' | 'critical';
  systemic_regress_risk?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CasePortal {
  header_title: string;       // "КЕЙС"
  case_name: string;          // Заголовок
  subtitle: string;           // Подзаголовок
  marker_icons?: string[];
  access_bar?: string;
}

export interface CaseEvent {
  label: string;              // "СВЯЗЬ", "Триггер", "Событие"
  summary: string;            // Суть ситуации
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CaseSpaceMap {
  company: string;            // IT-компания, 2 продуктовые команды
  environment: string;        // Быстрый рост, расширение
  constraints: string;        // Не чётко описаны зоны ответственности
  people: string;             // Тимлиды двух команд
  mode: string;               // Проблемная коммуникация
}

export interface CaseFacts {
  strict_facts: string | string[];
}

export interface CaseBackground {
  story: string;
}

export interface CaseDilemma {
  question: string;           // Главный вопрос
  ambiance?: string;          // Атмосфера (курсив)
}

export interface CaseConsequence {
  immediate: string;          // СЕЙЧАС
  second_order: string;       // ПОТОМ
  systemic: string;           // СИСТЕМНО
  reflection_prompt?: string; // Вопрос для рефлексии (в JSON хранится здесь)
}

export interface CasePosition {
  id: string;                 // "А", "Б", "В" или "A", "B", "C"
  description: string;        // Текст позиции
  position_type: string;      // Тип (мелко) — "Прямое взаимодействие"
  consequence: CaseConsequence;
  reflection_prompt: string;  // Вопрос для рефлексии после выбора
}

export interface CaseIndicators {
  maturity?: string;
  uncertainty?: string;
  subjectivity?: string;
  regress_risk?: string;
}

export interface CaseReflection {
  questions?: string[];
  after_choice_insights?: string[];
}

/**
 * Полная структура данных кейса (v2)
 */
export interface CaseCardData {
  meta: CaseMeta;
  portal: CasePortal;
  event: CaseEvent;
  context: {
    space_map: CaseSpaceMap;
  };
  facts?: CaseFacts;
  background?: CaseBackground;
  dilemma: CaseDilemma;
  positions: CasePosition[];
  indicators?: CaseIndicators;
  reflection?: CaseReflection;
}

/**
 * Пропсы для детального компонента кейса v2
 */
export interface CaseDetailCardV2Props {
  /** Данные кейса */
  caseData: CaseCardData;
  /** Сложность (для отображения точек) */
  difficulty: CaseDifficulty;
  /** Выбранная позиция (если кейс пройден) */
  selectedPositionId?: string;
  /** Название ноды для бейджа "РАЗВИВАЕТ" */
  nodeName?: string;
  /** XP за прохождение */
  xpReward?: number;
  /** Обработчик выбора позиции */
  onSelectPosition?: (positionId: string) => void;
  /** Обработчик "К следующему кейсу" */
  onNextCase?: () => void;
  /** Обработчик "Вернуться к списку" */
  onBackToList?: () => void;
  /** Обработчик кнопки "Назад" */
  onBack?: () => void;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Конфигурация сложности
 */
export const DIFFICULTY_CONFIG: Record<CaseDifficulty, {
  label: string;
  filledDots: number;
  totalDots: number;
}> = {
  basic: { label: 'Базовый', filledDots: 1, totalDots: 3 },
  intermediate: { label: 'Средний', filledDots: 2, totalDots: 3 },
  advanced: { label: 'Сложный', filledDots: 3, totalDots: 3 },
  executive: { label: 'Экспертный', filledDots: 3, totalDots: 3 },
};

/**
 * Маппинг полей space_map на человекочитаемые названия
 */
export const SPACE_MAP_LABELS: Record<keyof CaseSpaceMap, string> = {
  company: 'Компания',
  environment: 'Среда',
  constraints: 'Ограничения',
  people: 'Участники',
  mode: 'Режим',
};
