import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Простой guard для защиты API ключом (опционально)
 * Используется только если установлен API_KEY в .env
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const apiKey = this.configService.get<string>('API_KEY');
    
    // Если API_KEY не установлен, пропускаем все запросы
    if (!apiKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-api-key'];

    if (!providedKey || providedKey !== apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}

