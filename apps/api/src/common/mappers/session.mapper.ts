import { Prisma } from '@prisma/client';
import {
  SessionInsightsJsonSchema,
  SessionFocusJsonSchema,
  SessionAbilitySignalsJsonSchema,
} from '../schemas/session.schema';
import type { Insight, FocusPoint, AbilitySignal } from '../schemas/session.schema';

/**
 * Парсинг и валидация insights_json из Prisma
 */
export function parseInsightsJson(
  value: Prisma.JsonValue | null | undefined,
  requestId?: string,
): Insight[] {
  if (!value) {
    return [];
  }

  try {
    return SessionInsightsJsonSchema.parse(value);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId || 'unknown'}] Failed to parse insights_json:`, errorMessage);
    throw new Error(`Invalid insights_json format: ${errorMessage}`);
  }
}

/**
 * Парсинг и валидация focus_json из Prisma
 */
export function parseFocusJson(
  value: Prisma.JsonValue | null | undefined,
  requestId?: string,
): FocusPoint[] {
  if (!value) {
    return [];
  }

  try {
    return SessionFocusJsonSchema.parse(value);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId || 'unknown'}] Failed to parse focus_json:`, errorMessage);
    throw new Error(`Invalid focus_json format: ${errorMessage}`);
  }
}

/**
 * Парсинг и валидация ability_signals_json из Prisma
 */
export function parseAbilitySignalsJson(
  value: Prisma.JsonValue | null | undefined,
  requestId?: string,
): AbilitySignal[] {
  if (!value) {
    return [];
  }

  try {
    return SessionAbilitySignalsJsonSchema.parse(value);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId || 'unknown'}] Failed to parse ability_signals_json:`, errorMessage);
    throw new Error(`Invalid ability_signals_json format: ${errorMessage}`);
  }
}

/**
 * Валидация перед записью в БД
 */
export function validateInsightsJson(value: unknown, requestId?: string): Insight[] {
  try {
    return SessionInsightsJsonSchema.parse(value);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId || 'unknown'}] Failed to validate insights_json:`, errorMessage);
    throw new Error(`Invalid insights_json format: ${errorMessage}`);
  }
}

export function validateFocusJson(value: unknown, requestId?: string): FocusPoint[] {
  try {
    return SessionFocusJsonSchema.parse(value);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId || 'unknown'}] Failed to validate focus_json:`, errorMessage);
    throw new Error(`Invalid focus_json format: ${errorMessage}`);
  }
}

export function validateAbilitySignalsJson(value: unknown, requestId?: string): AbilitySignal[] {
  try {
    return SessionAbilitySignalsJsonSchema.parse(value);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId || 'unknown'}] Failed to validate ability_signals_json:`, errorMessage);
    throw new Error(`Invalid ability_signals_json format: ${errorMessage}`);
  }
}

