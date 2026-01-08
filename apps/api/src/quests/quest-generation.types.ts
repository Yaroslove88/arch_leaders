import { QuestCriteria } from '../common/types/json-types';

/**
 * Результат анализа сессии для генерации квестов
 */
export interface SessionAnalysisResult {
  userId: string;
  abilitySignals: Array<{ node_id: string; signal: string }>;
  themes: string[];
  patterns: string[];
  focus: Array<{ area: string; priority: 'high' | 'medium' | 'low' }>;
}

/**
 * Сгенерированный квест (DTO/Domain)
 * Не содержит логики сохранения в БД
 */
export interface GeneratedQuest {
  userId: string;
  title: string;
  description: string;
  type: 'micro' | 'weekly' | 'story' | 'in-person';
  criteria: QuestCriteria;
  reward?: {
    xp?: number;
    skill_xp?: number;
    artifact?: string;
  };
  linked_nodes?: string[];
  session_id?: string;
  source: string;
  tags: string[];
}

