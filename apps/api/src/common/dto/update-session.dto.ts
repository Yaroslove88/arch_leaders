import { IsString, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSessionDto {
  @ApiPropertyOptional({
    description: 'Краткое резюме анализа',
    example: 'Обновленное резюме анализа...',
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({
    description: 'Массив инсайтов в формате JSON',
    example: [{ type: 'pattern', description: 'Обнаружен паттерн...' }],
  })
  @IsOptional()
  @IsArray()
  insights_json?: Array<{ type: string; description: string; [key: string]: unknown }>;

  @ApiPropertyOptional({
    description: 'Массив фокусных точек в формате JSON',
    example: [{ area: 'decision-making', priority: 'high' }],
  })
  @IsOptional()
  @IsArray()
  focus_json?: Array<{ area: string; priority: string; [key: string]: unknown }>;

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
    example: [{ node_id: 'node_architecture_coupling', strength: 0.8 }],
  })
  @IsOptional()
  @IsArray()
  ability_signals_json?: Array<{ node_id: string; strength: number; [key: string]: unknown }>;

  @ApiPropertyOptional({
    description: 'Статус сессии',
    enum: ['pending', 'processing', 'succeeded', 'failed'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'processing', 'succeeded', 'failed'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Сообщение об ошибке анализа',
    example: 'Ошибка при обработке данных...',
  })
  @IsOptional()
  @IsString()
  analysis_error?: string;
}

