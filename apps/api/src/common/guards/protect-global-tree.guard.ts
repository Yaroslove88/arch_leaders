import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guard для защиты глобального дерева (tree_main) от перезаписи
 * 
 * Защищает:
 * - Глобальное дерево tree_main может изменяться только системными операциями или админами
 * - Пользовательские деревья (tree_user_*) могут изменяться их владельцами
 * 
 * Разрешает изменения:
 * - Администраторы (role='admin')
 * - Системные операции (actor='system', 'analyzer', 'admin')
 * - Владельцы пользовательских деревьев для своих деревьев
 */
@Injectable()
export class ProtectGlobalTreeGuard implements CanActivate {
  private readonly logger = new Logger(ProtectGlobalTreeGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body || {};

    // Извлекаем информацию о дереве из запроса
    const treeId = this.extractTreeId(request, body);
    const actor = body.actor || request.headers['x-actor'] || 'user';
    const userId = user?.sub || body.userId;

    // Проверяем, это глобальное дерево?
    if (treeId === 'tree_main' || !treeId || treeId.startsWith('tree_main')) {
      // Глобальное дерево - требует проверки прав
      return this.checkGlobalTreeAccess(user, actor, userId);
    }

    // Пользовательское дерево - проверяем права владельца
    if (treeId.startsWith('tree_user_')) {
      const treeUserId = treeId.replace('tree_user_', '');
      if (treeUserId === userId) {
        // Владелец дерева может изменять свое дерево
        return true;
      }
    }

    // По умолчанию запрещаем
    this.logger.warn(
      `Blocked attempt to modify tree: ${treeId} by user: ${userId}, actor: ${actor}`,
    );
    throw new ForbiddenException(
      `You don't have permission to modify tree: ${treeId}`,
    );
  }

  private extractTreeId(request: any, body: any): string | null {
    // Пытаемся извлечь treeId из разных мест
    if (body.treeId) return body.treeId;
    if (body.userId && !body.userId.startsWith('tree_')) {
      return `tree_user_${body.userId}`;
    }
    if (request.params?.treeId) return request.params.treeId;
    if (request.params?.userId && !request.params.userId.startsWith('tree_')) {
      return `tree_user_${request.params.userId}`;
    }

    // Если userId не указан в запросе, вероятно это глобальное дерево
    if (!body.userId && !request.user?.sub) {
      return 'tree_main';
    }

    return null;
  }

  private async checkGlobalTreeAccess(
    user: any,
    actor: string,
    userId: string | undefined,
  ): Promise<boolean> {
    // Системные операции всегда разрешены
    const systemActors = ['system', 'analyzer', 'admin', 'script'];
    if (systemActors.includes(actor?.toLowerCase())) {
      this.logger.log(`Allowed system operation: actor=${actor}`);
      return true;
    }

    // Проверяем, является ли пользователь администратором
    if (user?.sub) {
      try {
        const dbUser = await this.prisma.user.findUnique({
          where: { id: user.sub },
          select: { role: true },
        });

        if (dbUser?.role === 'admin') {
          this.logger.log(`Allowed admin access: userId=${user.sub}`);
          return true;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error checking user role: ${errorMessage}`);
      }
    }

    // Все остальные попытки запрещены
    this.logger.warn(
      `Blocked attempt to modify global tree by user: ${userId || 'anonymous'}, actor: ${actor}`,
    );
    throw new ForbiddenException(
      'Only administrators and system operations can modify the global tree. ' +
        'Please use your personal tree for custom modifications.',
    );
  }
}
