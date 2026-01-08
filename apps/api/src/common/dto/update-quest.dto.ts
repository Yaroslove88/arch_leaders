import { IsString, IsOptional, IsArray, IsIn, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QuestStep, QuestCriteria, QuestReward } from '../schemas/quest.schema';

export class UpdateQuestDto {
  @ApiPropertyOptional({
    description: 'Название квеста',
    example: 'Применить архитектурное мышление',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Описание квеста',
    example: 'Описание квеста...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Тип квеста',
    enum: ['micro', 'weekly', 'story', 'in-person'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['micro', 'weekly', 'story', 'in-person'])
  type?: 'micro' | 'weekly' | 'story' | 'in-person';

  @ApiPropertyOptional({
    description: 'Статус квеста',
    enum: ['backlog', 'active', 'completed', 'failed', 'archived'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['backlog', 'active', 'completed', 'failed', 'archived'])
  status?: 'backlog' | 'active' | 'completed' | 'failed' | 'archived';

  @ApiPropertyOptional({
    description: 'Ветка способностей',
    example: 'LEADER_ARCHITECTURE',
  })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({
    description: 'Шаги квеста в формате JSON',
    example: [{ id: 'step1', description: 'Шаг 1', completed: false }],
  })
  @IsOptional()
  @IsArray()
  steps?: QuestStep[];

  @ApiPropertyOptional({
    description: 'Критерии выполнения в формате JSON',
    example: { type: 'evidence', target: 2, description: 'Собрать доказательства' },
  })
  @IsOptional()
  @IsObject()
  criteria?: QuestCriteria;

  @ApiPropertyOptional({
    description: 'Награда в формате JSON',
    example: { xp: 100, skill_xp: 50 },
  })
  @IsOptional()
  @IsObject()
  reward?: QuestReward;

  @ApiPropertyOptional({
    description: 'Связанные узлы способностей',
    type: [String],
    example: ['node_architecture_coupling', 'node_system_thinking'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  linked_nodes?: string[];

  @ApiPropertyOptional({
    description: 'Связи с доказательствами в формате JSON',
    example: [{ evidence_id: '...', type: 'proof' }],
  })
  @IsOptional()
  @IsObject()
  evidence_links_json?: any;

  @ApiPropertyOptional({
    description: 'Подсказка о сроке выполнения',
    example: 'В течение недели',
  })
  @IsOptional()
  @IsString()
  due_hint?: string;

  @ApiPropertyOptional({
    description: 'Источник квеста',
    example: 'session_analysis',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: 'Теги',
    type: [String],
    example: ['лидерство', 'архитектура'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

