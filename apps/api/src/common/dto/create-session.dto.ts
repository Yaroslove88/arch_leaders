import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Insight, FocusPoint, AbilitySignal } from '../schemas/session.schema';

export class CreateSessionDto {
  @ApiProperty({
    description: 'ID записи (entry) для которой создается сессия',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  entry_id!: string;

  @ApiProperty({
    description: 'Краткое резюме анализа',
    example: 'Ситуация демонстрирует применение архитектурного мышления...',
  })
  @IsString()
  @IsNotEmpty()
  summary!: string;

  @ApiPropertyOptional({
    description: 'Массив инсайтов в формате JSON',
    example: [{ title: 'Паттерн', description: 'Обнаружен паттерн...' }],
  })
  @IsOptional()
  @IsArray()
  insights_json?: Insight[];

  @ApiPropertyOptional({
    description: 'Массив фокусных точек в формате JSON',
    example: [{ area: 'decision-making', priority: 'high' }],
  })
  @IsOptional()
  @IsArray()
  focus_json?: FocusPoint[];

  @ApiPropertyOptional({
    description: 'Извлеченные темы',
    type: [String],
    example: ['управление командой', 'принятие решений'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  themes?: string[];

  @ApiPropertyOptional({
    description: 'Поведенческие паттерны',
    type: [String],
    example: ['делегирование', 'обратная связь'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  patterns?: string[];

  @ApiPropertyOptional({
    description: 'Конфликты и противоречия',
    type: [String],
    example: ['конфликт интересов', 'противоречие в подходах'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tensions?: string[];

  @ApiPropertyOptional({
    description: 'Сигналы способностей в формате JSON',
    example: [{ node_id: 'node_architecture_coupling', signal: 'Проявление способности' }],
  })
  @IsOptional()
  @IsArray()
  ability_signals_json?: AbilitySignal[];

  @ApiPropertyOptional({
    description: 'Статус сессии',
    enum: ['pending', 'processing', 'succeeded', 'failed'],
    default: 'pending',
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'processing', 'succeeded', 'failed'])
  status?: string;
}

