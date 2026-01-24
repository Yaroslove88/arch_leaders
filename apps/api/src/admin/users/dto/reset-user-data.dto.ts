import { IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ResetScope {
  PROGRESS = 'progress',  // Сбросить прогресс квестов
  TREE = 'tree',          // Сбросить дерево способностей
  ALL = 'all',            // Сбросить все данные
}

export class ResetUserDataDto {
  @ApiProperty({
    enum: ResetScope,
    description: 'Область сброса данных',
    example: 'progress',
  })
  @IsEnum(ResetScope)
  scope!: ResetScope;

  @ApiProperty({
    description: 'Причина сброса данных',
    example: 'Запрос пользователя на перезапуск',
    minLength: 5,
  })
  @IsString()
  @MinLength(5)
  reason!: string;
}
