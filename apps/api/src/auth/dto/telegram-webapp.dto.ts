import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class TelegramWebAppDto {
  @ApiProperty({
    description: 'Telegram WebApp initData string',
    example: 'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=...',
  })
  @IsString()
  @IsNotEmpty()
  initData!: string;
}
