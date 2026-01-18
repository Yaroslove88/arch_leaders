import { IsString, IsNotEmpty, IsOptional, IsObject, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyTreeChangeDto {
  @ApiProperty({
    description: 'Область изменения',
    enum: ['ability', 'quest', 'settings', 'system'],
    example: 'ability',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ability', 'quest', 'settings', 'system'])
  scope!: string;

  @ApiPropertyOptional({
    description: 'Тип сущности',
    example: 'node',
  })
  @IsOptional()
  @IsString()
  entity_type?: string;

  @ApiPropertyOptional({
    description: 'ID сущности',
    example: 'node_architecture_coupling',
  })
  @IsOptional()
  @IsString()
  entity_id?: string;

  @ApiProperty({
    description: 'Действие',
    enum: ['create', 'update', 'unlock', 'integrate', 'regenerate', 'undo'],
    example: 'unlock',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['create', 'update', 'unlock', 'integrate', 'regenerate', 'undo'])
  action!: string;

  @ApiProperty({
    description: 'Обоснование изменения',
    example: 'Узел разблокирован на основе анализа сессии',
  })
  @IsString()
  @IsNotEmpty()
  rationale!: string;

  @ApiPropertyOptional({
    description: 'Состояние до изменения в формате JSON',
  })
  @IsOptional()
  @IsObject()
  before?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Состояние после изменения в формате JSON',
  })
  @IsOptional()
  @IsObject()
  after?: Record<string, unknown>;

  @ApiProperty({
    description: 'Операции изменения',
    type: [Object],
  })
  @IsArray()
  @IsNotEmpty()
  ops!: Array<{ op: string; path: string; value?: unknown }>;

  @ApiProperty({
    description: 'Актор изменения',
    example: 'system',
  })
  @IsString()
  @IsNotEmpty()
  actor!: string;

  @ApiPropertyOptional({
    description: 'Связи в формате JSON (entry_ids, evidence_ids, session_id)',
    example: { entry_ids: ['...'], session_id: '...' },
  })
  @IsOptional()
  @IsObject()
  links?: { entry_ids?: string[]; evidence_ids?: string[]; session_id?: string };
}

