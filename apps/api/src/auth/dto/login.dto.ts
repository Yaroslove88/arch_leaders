import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, ValidateIf } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    description: 'API ключ для аутентификации (legacy)',
    example: 'your-api-key',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({
    description: 'Telegram username (без @)',
    example: 'username',
  })
  @ValidateIf((o) => !o.apiKey)
  @IsString()
  telegramUsername?: string;

  @ApiPropertyOptional({
    description: 'Пароль',
    example: 'SecurePassword123!',
  })
  @ValidateIf((o) => !o.apiKey)
  @IsString()
  password?: string;
}

