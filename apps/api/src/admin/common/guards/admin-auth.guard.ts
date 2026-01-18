import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService)
    private jwtService: JwtService,
    @Inject(PrismaService)
    private prisma: PrismaService,
    @Inject(ConfigService)
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Используем секрет из ConfigService (тот же, что используется в admin-auth.module.ts для подписи)
      const secretForVerify = this.configService.get<string>('JWT_SECRET') || 'your-secret-key';
      
      const payload = await this.jwtService.verifyAsync(token, {
        secret: secretForVerify,
      });

      // Сначала проверяем в таблице admin_users
      const adminUser = await this.prisma.adminUser.findUnique({
        where: { id: payload.sub },
      });

      if (adminUser) {
        request.admin = {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          source: 'admin_users',
        };
        return true;
      }

      // Fallback: проверяем в обычной таблице users
      // Если пользователь имеет role='admin', разрешаем доступ как super_admin
      const regularUser = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (regularUser && regularUser.role === 'admin') {
        request.admin = {
          id: regularUser.id,
          email: regularUser.email || regularUser.telegramUsername,
          role: 'super_admin', // Обычный админ получает полные права
          source: 'users',
          telegramUsername: regularUser.telegramUsername,
        };
        return true;
      }
      
      throw new UnauthorizedException('Admin access required');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
