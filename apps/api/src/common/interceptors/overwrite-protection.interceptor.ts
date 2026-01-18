import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor для логирования всех попыток изменения защищенных данных
 * 
 * Логирует:
 * - Попытки изменения глобального дерева (tree_main)
 * - Попытки изменения базовых квестов (source='base_template')
 * - Успешные и заблокированные операции
 */
@Injectable()
export class OverwriteProtectionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(OverwriteProtectionInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const user = request.user;
    const body = request.body || {};

    // Определяем тип операции
    const operationType = this.detectOperationType(url, method, body);

    // Логируем попытку изменения
    this.logAttempt(operationType, request, user, body);

    // Продолжаем выполнение и логируем результат
    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logSuccess(operationType, request, user, data);
        },
        error: (error) => {
          this.logError(operationType, request, user, error);
        },
      }),
    );
  }

  private detectOperationType(url: string, method: string, body: any): string {
    if (url.includes('/tree/change') || url.includes('/tree/')) {
      return 'tree_modification';
    }
    if (url.includes('/quests') && (method === 'PATCH' || method === 'PUT' || method === 'DELETE')) {
      return 'quest_modification';
    }
    return 'unknown';
  }

  private logAttempt(operationType: string, request: any, user: any, body: any): void {
    const userId = user?.sub || 'anonymous';
    const actor = body.actor || request.headers?.['x-actor'] || 'user';
    const treeId = body.treeId || body.userId ? `tree_user_${body.userId}` : 'tree_main';
    const questId = request.params?.id || body.id;

    if (operationType === 'tree_modification') {
      this.logger.log(
        `Tree modification attempt: treeId=${treeId}, userId=${userId}, actor=${actor}, method=${request.method}`,
      );
    } else if (operationType === 'quest_modification' && questId) {
      this.logger.log(
        `Quest modification attempt: questId=${questId}, userId=${userId}, actor=${actor}, method=${request.method}`,
      );
    }
  }

  private logSuccess(operationType: string, request: any, user: any, data: any): void {
    const userId = user?.sub || 'anonymous';
    const treeId = request.body?.treeId || request.body?.userId ? `tree_user_${request.body.userId}` : 'tree_main';
    const questId = request.params?.id || request.body?.id;

    if (operationType === 'tree_modification') {
      this.logger.log(
        `✅ Tree modification successful: treeId=${treeId}, userId=${userId}`,
      );
    } else if (operationType === 'quest_modification' && questId) {
      this.logger.log(
        `✅ Quest modification successful: questId=${questId}, userId=${userId}`,
      );
    }
  }

  private logError(operationType: string, request: any, user: any, error: any): void {
    const userId = user?.sub || 'anonymous';
    const treeId = request.body?.treeId || request.body?.userId ? `tree_user_${request.body.userId}` : 'tree_main';
    const questId = request.params?.id || request.body?.id;
    const errorStatus = error.status || error.statusCode || 'unknown';
    const errorMessage = error.message || 'unknown error';

    if (errorStatus === 403 || errorStatus === 'FORBIDDEN') {
      // Это заблокированная попытка - логируем как предупреждение
      if (operationType === 'tree_modification') {
        this.logger.warn(
          `🚫 Tree modification blocked: treeId=${treeId}, userId=${userId}, reason=${errorMessage}`,
        );
      } else if (operationType === 'quest_modification' && questId) {
        this.logger.warn(
          `🚫 Quest modification blocked: questId=${questId}, userId=${userId}, reason=${errorMessage}`,
        );
      }
    } else {
      // Другая ошибка - логируем как ошибку
      if (operationType === 'tree_modification') {
        this.logger.error(
          `❌ Tree modification error: treeId=${treeId}, userId=${userId}, error=${errorMessage}`,
        );
      } else if (operationType === 'quest_modification' && questId) {
        this.logger.error(
          `❌ Quest modification error: questId=${questId}, userId=${userId}, error=${errorMessage}`,
        );
      }
    }
  }
}
