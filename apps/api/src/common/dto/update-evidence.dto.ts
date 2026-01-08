import { IsString, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEvidenceDto {
  @ApiPropertyOptional({
    description: 'Тип доказательства',
    enum: ['situation', 'observation', 'reflection', 'feedback', 'external_feedback'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['situation', 'observation', 'reflection', 'feedback', 'external_feedback'])
  type?: 'situation' | 'observation' | 'reflection' | 'feedback' | 'external_feedback';

  @ApiPropertyOptional({
    description: 'Текст доказательства',
    example: 'Обновленный текст доказательства...',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'Источник доказательства',
    enum: ['web', 'telegram'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['web', 'telegram'])
  source?: string;

  @ApiPropertyOptional({
    description: 'ID связанного квеста',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  quest_id?: string;

  @ApiPropertyOptional({
    description: 'ID узла способности',
    example: 'node_architecture_coupling',
  })
  @IsOptional()
  @IsString()
  ability_node_id?: string;

  @ApiPropertyOptional({
    description: 'ID сессии',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  session_id?: string;

  @ApiPropertyOptional({
    description: 'Теги для категоризации',
    type: [String],
    example: ['лидерство', 'архитектура', 'решение'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

