import { Prisma } from '@prisma/client';
import {
  QuestStepsJsonSchema,
  QuestCriteriaJsonSchema,
  QuestRewardJsonSchema,
} from '../schemas/quest.schema';
import type { QuestStep, QuestCriteria, QuestReward } from '../schemas/quest.schema';

/**
 * Парсинг и валидация steps_json из Prisma
 * Безопасный парсинг: возвращает данные даже если валидация не прошла (для обратной совместимости)
 */
export function parseStepsJson(
  value: Prisma.JsonValue | null | undefined,
  requestId?: string,
): QuestStep[] {
  if (!value) {
    return [];
  }

  try {
    return QuestStepsJsonSchema.parse(value);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[${requestId || 'unknown'}] Failed to parse steps_json, returning raw value:`, errorMessage);
    // Возвращаем сырое значение для обратной совместимости
    if (Array.isArray(value)) {
      return value as QuestStep[];
    }
    return [];
  }
}

/**
 * Парсинг и валидация criteria_json из Prisma
 * Безопасный парсинг: возвращает данные даже если валидация не прошла (для обратной совместимости)
 */
export function parseCriteriaJson(
  value: Prisma.JsonValue | null | undefined,
  requestId?: string,
): QuestCriteria {
  if (!value) {
    // Возвращаем дефолтную структуру вместо ошибки
    return {
      type: 'custom',
      description: '',
    };
  }

  try {
    return QuestCriteriaJsonSchema.parse(value);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[${requestId || 'unknown'}] Failed to parse criteria_json, returning raw value:`, errorMessage);
    // Возвращаем сырое значение для обратной совместимости
    return value as QuestCriteria;
  }
}

/**
 * Парсинг и валидация reward_json из Prisma
 */
export function parseRewardJson(
  value: Prisma.JsonValue | null | undefined,
  requestId?: string,
): QuestReward | null {
  // Handle null, undefined, or Prisma.JsonNull
  if (!value || value === null) {
    return null;
  }

  try {
    const parsed = QuestRewardJsonSchema.parse(value);
    return parsed ?? null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId || 'unknown'}] Failed to parse reward_json:`, errorMessage);
    throw new Error(`Invalid reward_json format: ${errorMessage}`);
  }
}

/**
 * Валидация перед записью в БД
 */
export function validateStepsJson(value: unknown, requestId?: string): QuestStep[] {
  try {
    return QuestStepsJsonSchema.parse(value);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId || 'unknown'}] Failed to validate steps_json:`, errorMessage);
    throw new Error(`Invalid steps_json format: ${errorMessage}`);
  }
}

export function validateCriteriaJson(value: unknown, requestId?: string): QuestCriteria {
  try {
    return QuestCriteriaJsonSchema.parse(value);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId || 'unknown'}] Failed to validate criteria_json:`, errorMessage);
    throw new Error(`Invalid criteria_json format: ${errorMessage}`);
  }
}

export function validateRewardJson(value: unknown, requestId?: string): QuestReward | null {
  if (!value || value === null) {
    return null;
  }

  try {
    const parsed = QuestRewardJsonSchema.parse(value);
    return parsed ?? null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId || 'unknown'}] Failed to validate reward_json:`, errorMessage);
    throw new Error(`Invalid reward_json format: ${errorMessage}`);
  }
}

