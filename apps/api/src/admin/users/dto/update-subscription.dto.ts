import { IsEnum, IsOptional, IsString, IsDateString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
}

export class UpdateSubscriptionDto {
  @ApiProperty({
    enum: SubscriptionPlan,
    description: 'План подписки',
    example: 'premium',
  })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiPropertyOptional({
    description: 'Дата истечения подписки (ISO 8601)',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expires_at?: string;

  @ApiProperty({
    description: 'Причина изменения подписки',
    example: 'Оплата через менеджера',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  reason: string;
}
