import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {
    // Используем process.env напрямую в super(), так как ConfigService может быть недоступен в момент инициализации
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Для legacy API ключей просто возвращаем payload
    if (payload.sub === 'api-key-user') {
      return payload;
    }

    // Для обычных пользователей проверяем существование в БД
    const user = await this.authService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Обновляем payload актуальными данными из БД
    return {
      sub: user.id,
      telegramUsername: user.telegramUsername,
      role: user.role,
    };
  }
}

