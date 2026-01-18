import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guard для защиты базовых квестов (source='base_template') от перезаписи
 * 
 * Защищает:
 * - Квесты с source='base_template' могут изменяться только системными операциями или админами
 * - Пользовательские квесты (source='user_generated' или 'auto_generated') могут изменяться их владельцами
 * 
 * Разрешает изменения:
 * - Администраторы (role='admin')
 * - Системные операции (actor='system', 'analyzer', 'admin', 'script')
 * - Владельцы пользовательских квестов для своих квестов
 */
@Injectable()
export class ProtectBaseQuestsGuard implements CanActivate {
  private readonly logger = new Logger(ProtectBaseQuestsGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const questId = request.params?.id || request.body?.id || request.query?.id;

    if (!questId) {
      // Если questId не указан, возможно это создание нового квеста - разрешаем
      return true;
    }

    // Получаем квест из БД
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
      select: {
        id: true,
        source: true,
        userId: true,
      },
    });

    if (!quest) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    // Проверяем источник квеста
    if (quest.source === 'base_template') {
      // Базовый квест - требует проверки прав
      return this.checkBaseQuestAccess(user, quest, request);
    }

    // Пользовательский квест - проверяем права владельца
    if (quest.source === 'user_generated' || quest.source === 'auto_generated' || !quest.source) {
      if (quest.userId === user?.sub) {
        // Владелец квеста может изменять свой квест
        this.logger.log(
          `Allowed user quest modification: questId=${questId}, userId=${user.sub}`,
        );
        return true;
      }

      // Другие пользователи не могут изменять чужие квесты
      this.logger.warn(
        `Blocked attempt to modify user quest: questId=${questId} by user: ${user?.sub || 'anonymous'}, owner: ${quest.userId}`,
      );
      throw new ForbiddenException(
        `You don't have permission to modify quest: ${questId}`,
      );
    }

    // По умолчанию запрещаем
    this.logger.warn(
      `Blocked attempt to modify quest: questId=${questId} (source: ${quest.source}) by user: ${user?.sub || 'anonymous'}`,
    );
    throw new ForbiddenException(
      `You don't have permission to modify quest: ${questId}`,
    );
  }

  private async checkBaseQuestAccess(user: any, quest: any, request: any): Promise<boolean> {
    // Проверяем, является ли пользователь администратором
    if (user?.sub) {
      try {
        const dbUser = await this.prisma.user.findUnique({
          where: { id: user.sub },
          select: { role: true },
        });

        if (dbUser?.role === 'admin') {
          this.logger.log(
            `Allowed admin access to base quest: questId=${quest.id}, userId=${user.sub}`,
          );
          return true;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error checking user role: ${errorMessage}`);
      }
    }

    // Проверяем, является ли это системной операцией
    const actor = request?.body?.actor || request?.headers?.['x-actor'];
    const systemActors = ['system', 'analyzer', 'admin', 'script', 'sync-base-quests'];
    if (systemActors.includes(actor?.toLowerCase())) {
      this.logger.log(`Allowed system operation on base quest: questId=${quest.id}, actor=${actor}`);
      return true;
    }

    // Все остальные попытки запрещены
    this.logger.warn(
      `Blocked attempt to modify base quest: questId=${quest.id} by user: ${user?.sub || 'anonymous'}, actor: ${actor || 'none'}`,
    );
    throw new ForbiddenException(
      'Only administrators and system operations can modify base quests (source=base_template). ' +
        'Please create a user-generated quest for custom modifications.',
    );
  }
}
