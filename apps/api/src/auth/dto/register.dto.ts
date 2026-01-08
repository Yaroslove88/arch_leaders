import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Telegram username (без @)',
    example: 'username',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Telegram username может содержать только буквы, цифры и подчеркивания',
  })
  telegramUsername!: string;

  @ApiProperty({
    description: 'Пароль',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}

