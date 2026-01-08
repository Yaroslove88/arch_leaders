import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../auth.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Используем get для совместимости с разными версиями NestJS
    const handlerMetadata = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    const classMetadata = this.reflector.get<string[]>(ROLES_KEY, context.getClass());
    const requiredRoles = handlerMetadata ?? classMetadata;

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('Пользователь не аутентифицирован');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) {
      throw new ForbiddenException('Недостаточно прав доступа');
    }

    return true;
  }
}

