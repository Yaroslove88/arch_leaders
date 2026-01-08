import { NotFoundException } from '@nestjs/common';

/**
 * Утилита для проверки существования значения
 * Выбрасывает NotFoundException если значение null или undefined
 */
export function assertExists<T>(
  value: T | null | undefined,
  message: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundException(message);
  }
}

/**
 * Утилита для безопасного получения значения с дефолтом
 */
export function getOrDefault<T>(value: T | null | undefined, defaultValue: T): T {
  return value ?? defaultValue;
}

/**
 * Утилита для проверки и получения свойства объекта
 */
export function getProperty<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  errorMessage: string,
): T[K] {
  if (!obj) {
    throw new NotFoundException(errorMessage);
  }
  const value = obj[key];
  if (value === null || value === undefined) {
    throw new NotFoundException(errorMessage);
  }
  return value;
}

