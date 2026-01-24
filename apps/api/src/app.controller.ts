import { Controller, Get, Inject, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(@Inject(AppService) private readonly appService: AppService) {
    if (!this.appService) {
      throw new InternalServerErrorException('AppService injection failed');
    }
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Главная страница API' })
  @ApiResponse({ status: 200, description: 'Приветственное сообщение' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ping')
  @Public()
  @ApiOperation({ summary: 'Simple healthcheck (no DB)' })
  @ApiResponse({ status: 200, description: 'pong' })
  ping(): string {
    return 'pong';
  }
}

