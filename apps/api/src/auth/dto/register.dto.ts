import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Логин',
    example: 'login',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Логин может содержать только буквы, цифры и подчеркивания',
  })
  login!: string;

  @ApiProperty({
    description: 'Алиас для login (устаревшее поле)',
    example: 'login',
    required: false,
  })
  @IsOptional()
  @IsString()
  telegramUsername?: string;

  @ApiProperty({
    description: 'Пароль',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
