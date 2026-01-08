import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Обертка для Prisma findUnique с проверкой существования
 */
export async function findUniqueOrThrow<T>(
  query: Promise<T | null>,
  errorMessage: string,
): Promise<T> {
  const result = await query;
  if (!result) {
    throw new NotFoundException(errorMessage);
  }
  return result;
}

/**
 * Обертка для Prisma findFirst с проверкой существования
 */
export async function findFirstOrThrow<T>(
  query: Promise<T | null>,
  errorMessage: string,
): Promise<T> {
  const result = await query;
  if (!result) {
    throw new NotFoundException(errorMessage);
  }
  return result;
}

/**
 * Обработка Prisma ошибок
 */
export function handlePrismaError(error: unknown, context: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new InternalServerErrorException(
          `${context}: Unique constraint violation`,
        );
      case 'P2025':
        throw new NotFoundException(`${context}: Record not found`);
      default:
        throw new InternalServerErrorException(
          `${context}: Database error (${error.code})`,
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new InternalServerErrorException(
      `${context}: Validation error - ${error.message}`,
    );
  }

  // Неизвестная ошибка
  throw new InternalServerErrorException(
    `${context}: Unexpected error - ${error instanceof Error ? error.message : 'Unknown error'}`,
  );
}

