import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Текущий пароль',
    example: 'OldPassword123!',
  })
  @IsString()
  currentPassword!: string;

  @ApiProperty({
    description: 'Новый пароль (минимум 8 символов)',
    example: 'NewSecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  newPassword!: string;
}

