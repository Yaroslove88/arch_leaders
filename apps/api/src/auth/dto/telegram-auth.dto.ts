import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class TelegramAuthDto {
  @ApiProperty({
    description: 'Telegram user ID',
    example: 123456789,
  })
  @IsNumber()
  @IsNotEmpty()
  id!: number;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  first_name!: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({
    description: 'Telegram username (without @)',
    example: 'johndoe',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'Photo URL',
    example: 'https://t.me/i/userpic/320/...',
  })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiProperty({
    description: 'Authentication date (Unix timestamp)',
    example: 1234567890,
  })
  @IsNumber()
  @IsNotEmpty()
  auth_date!: number;

  @ApiProperty({
    description: 'Hash for verification',
    example: 'abc123...',
  })
  @IsString()
  @IsNotEmpty()
  hash!: string;
}

