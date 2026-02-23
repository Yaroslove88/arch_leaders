import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    description: 'Логин',
    example: 'login',
  })
  @IsOptional()
  @IsString()
  login?: string;

  @ApiPropertyOptional({
    description: 'Алиас для login (устаревшее поле)',
    example: 'login',
  })
  @IsOptional()
  @IsString()
  telegramUsername?: string;

  @ApiPropertyOptional({
    description: 'Алиас для login (устаревшее поле)',
    example: 'login',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'Пароль',
    example: 'SecurePassword123!',
  })
  @IsOptional()
  @IsString()
  password?: string;
}
