import { Injectable, ExecutionContext, Optional } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(@Optional() private reflector?: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Проверяем, есть ли декоратор @Public()
    let isPublic = false;
    
    if (this.reflector) {
      // Используем Reflector для получения метаданных, если доступен
      const handler = context.getHandler();
      const controllerClass = context.getClass();
      isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        handler,
        controllerClass,
      ]) ?? false;
    }

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}

