import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEvidenceDto {
  @ApiProperty({
    description: 'Тип доказательства',
    enum: ['situation', 'observation', 'reflection', 'feedback', 'external_feedback'],
    example: 'situation',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['situation', 'observation', 'reflection', 'feedback', 'external_feedback'])
  type!: 'situation' | 'observation' | 'reflection' | 'feedback' | 'external_feedback';

  @ApiProperty({
    description: 'Текст доказательства',
    example: 'Применение способности архитектурного мышления в ситуации...',
  })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiPropertyOptional({
    description: 'Источник доказательства',
    enum: ['web', 'telegram'],
    example: 'web',
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

