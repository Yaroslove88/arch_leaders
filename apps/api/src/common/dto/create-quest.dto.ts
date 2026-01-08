import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn, MaxLength, ArrayMaxSize, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestStep } from '../schemas/quest.schema';

class QuestCriteriaDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['count', 'evidence', 'streak', 'custom'])
  type!: 'count' | 'evidence' | 'streak' | 'custom';

  @IsOptional()
  target?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description!: string;

  @IsOptional()
  @IsString()
  theory_and_examples?: string;
}

class QuestRewardDto {
  @IsOptional()
  xp?: number;

  @IsOptional()
  skill_xp?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  artifact?: string;
}

export class CreateQuestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['micro', 'weekly', 'story', 'in-person'])
  type!: 'micro' | 'weekly' | 'story' | 'in-person';

  @IsOptional()
  @IsString()
  @IsIn(['active', 'backlog', 'done', 'completed', 'failed', 'archived'])
  status?: 'backlog' | 'active' | 'completed' | 'failed' | 'archived';

  @IsOptional()
  @IsArray()
  steps?: QuestStep[];

  @IsObject()
  @ValidateNested()
  @Type(() => QuestCriteriaDto)
  criteria!: QuestCriteriaDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => QuestRewardDto)
  reward?: QuestRewardDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Maximum 10 linked nodes allowed' })
  @IsString({ each: true })
  linked_nodes?: string[];

  @IsOptional()
  @IsArray()
  evidence_links?: any[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  due_hint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  source?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20, { message: 'Maximum 20 tags allowed' })
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  session_id?: string;
}

