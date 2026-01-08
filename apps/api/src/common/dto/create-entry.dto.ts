import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn, MaxLength, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEntryDto {
  @ApiProperty({
    description: 'Тип записи',
    enum: ['situation', 'reflection', 'feedback', 'voice', 'import'],
    example: 'situation',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['situation', 'reflection', 'feedback', 'voice', 'import'])
  type!: string;

  @ApiProperty({
    description: 'Источник записи',
    enum: ['file', 'telegram', 'web'],
    example: 'web',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['file', 'telegram', 'web'])
  source!: string;

  @ApiProperty({
    description: 'Текст записи',
    maxLength: 50000,
    example: 'Описание управленческой ситуации...',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000, { message: 'Text is too long. Maximum 50000 characters' })
  text!: string;

  @ApiPropertyOptional({
    description: 'Список участников',
    type: [String],
    maxItems: 20,
    example: ['Иван Иванов', 'Петр Петров'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20, { message: 'Maximum 20 participants allowed' })
  @IsString({ each: true })
  participants?: string[];

  @ApiPropertyOptional({
    description: 'Дополнительный контекст в формате JSON',
    example: { meeting: 'Еженедельный стендап', decision: 'Принято решение X' },
  })
  @IsOptional()
  context_json?: any;

  @ApiPropertyOptional({
    description: 'Ссылка на файл (S3 path или local file)',
    maxLength: 500,
    example: 's3://bucket/path/to/file.md',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_ref?: string;

  @ApiPropertyOptional({
    description: 'Теги для категоризации',
    type: [String],
    maxItems: 20,
    example: ['управление', 'команда', 'решение'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20, { message: 'Maximum 20 tags allowed' })
  @IsString({ each: true })
  @MaxLength(50, { each: true, message: 'Each tag must be max 50 characters' })
  tags?: string[];
}

