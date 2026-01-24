import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { checkAdminAccess, extractActor } from './access-utils';

/**
 * Guard для защиты глобального дерева (tree_main) от перезаписи
 * 
 * Защищает:
 * - Глобальное дерево tree_main может изменяться только системными операциями или админами
 * - Пользовательские деревья (tree_user_*) могут изменяться их владельцами
 * 
 * Разрешает изменения:
 * - Администраторы (role='admin')
 * - Системные операции (actor='system', 'analyzer', 'admin', 'script')
 * - Владельцы пользовательских деревьев для своих деревьев
 * 
 * @see access-utils.ts для централизованной проверки прав
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
    const userId = user?.sub || body.userId;

    // Проверяем, это глобальное дерево?
    if (treeId === 'tree_main' || !treeId || treeId.startsWith('tree_main')) {
      // Глобальное дерево - требует проверки прав через централизованную утилиту
      const { hasAccess, reason } = await checkAdminAccess(request, this.prisma);
      
      if (hasAccess) {
        this.logger.log(`Allowed global tree access: reason=${reason}`);
        return true;
      }

      const actor = extractActor(request);
      this.logger.warn(
        `Blocked attempt to modify global tree by user: ${userId || 'anonymous'}, actor: ${actor || 'none'}`,
      );
      throw new ForbiddenException(
        'Only administrators and system operations can modify the global tree. ' +
          'Please use your personal tree for custom modifications.',
      );
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
    const actor = extractActor(request);
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
}
