import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TreeService } from '../../tree/tree.service';

/**
 * Обработчик задачи деградации опыта
 * УПРОЩЕНО: Работает с TreeSemantic (xp_current), а не с internal_progress
 * Применяет деградацию к узлам с прогрессом >= 100%, если нет активности
 */
@Injectable()
export class DegradeExperienceHandler {
  private readonly logger = new Logger(DegradeExperienceHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly treeService: TreeService,
  ) {}

  /**
   * Обработать деградацию опыта для всех пользователей
   */
  async handle(): Promise<{
    processed: number;
    degraded: number;
    errors: number;
  }> {
    this.logger.log('Starting experience degradation check');

    let processed = 0;
    let degraded = 0;
    let errors = 0;

    // УПРОЩЕНО: Получаем всех пользователей и проверяем их деревья
    const users = await this.prisma.user.findMany({
      select: { id: true },
    });

    this.logger.log(`Found ${users.length} users to check for degradation`);

    for (const user of users) {
      try {
        const tree = await this.treeService.getSemantic(user.id);
        
        // Получаем last_activity_date из UserAbilityState
        const userStates = await this.prisma.userAbilityState.findMany({
          where: { user_id: user.id },
          select: {
            node_id: true,
            last_activity_date: true,
          },
        });
        
        const activityMap = new Map(
          userStates.map(s => [s.node_id, s.last_activity_date])
        );

        for (const node of tree.nodes) {
          const xpRequired = node.xp_required || 100;
          const progressPercent = xpRequired > 0 ? (node.xp_current / xpRequired) * 100 : 0;
          
          // Проверяем только узлы с прогрессом >= 100%
          if (progressPercent < 100) {
            continue;
          }

          processed++;
          const lastActivityDate = activityMap.get(node.node_id);

          if (!lastActivityDate) {
            // Если нет даты активности, устанавливаем текущую дату
            await this.prisma.userAbilityState.upsert({
              where: {
                user_id_node_id: {
                  user_id: user.id,
                  node_id: node.node_id,
                },
              },
              create: {
                user_id: user.id,
                node_id: node.node_id,
                state: node.state,
                relevance: 0,
                last_activity_date: new Date(),
              },
              update: {
                last_activity_date: new Date(),
              },
            });
            continue;
          }

          // Рассчитываем деградацию (в процентах от xp_required)
          const progressRatio = progressPercent / 100; // 1.0 = 100%, 1.5 = 150%, etc.
          const degradation = this.calculateDegradation(
            progressRatio,
            lastActivityDate,
          );

          if (degradation > 0) {
            // Применяем деградацию к xp_current
            const degradationXP = (degradation / 100) * xpRequired;
            const newXp = Math.max(xpRequired, node.xp_current - degradationXP); // Минимум 100% (xp_required)

            // Обновляем через TreeService (автоматически пересчитает состояние)
            await this.treeService.updateNodeProgress(
              node.node_id,
              -(degradationXP), // Отрицательное значение = деградация
              user.id,
            );

            degraded++;
            this.logger.log(
              `Degraded node ${node.node_id} for user ${user.id}: ${progressPercent.toFixed(1)}% → ${((newXp / xpRequired) * 100).toFixed(1)}%`,
            );
          }
        }
      } catch (error) {
        errors++;
        this.logger.error(
          `Error processing degradation for user ${user.id}:`,
          error,
        );
      }
    }

    this.logger.log(
      `Degradation check completed: ${processed} processed, ${degraded} degraded, ${errors} errors`,
    );

    return { processed, degraded, errors };
  }

  /**
   * Рассчитать деградацию на основе времени бездействия и текущего прогресса
   * УПРОЩЕНО: Работает с progressRatio (1.0 = 100%, 1.5 = 150%, etc.)
   */
  private calculateDegradation(
    progressRatio: number, // 1.0 = 100%, 1.5 = 150%, etc.
    lastActivityDate: Date,
  ): number {
    const now = new Date();
    const daysSinceActivity = Math.floor(
      (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceActivity < 30) {
      // Деградация применяется только если прошло >= 30 дней
      return 0;
    }

    // Определяем скорость деградации на основе текущего прогресса
    const degradationRate = this.getDegradationRate(progressRatio);

    // Рассчитываем деградацию (в процентах)
    const monthsSinceActivity = daysSinceActivity / 30;
    const degradation = degradationRate * monthsSinceActivity;

    return degradation;
  }

  /**
   * Получить скорость деградации на основе прогресса
   * УПРОЩЕНО: progressRatio вместо internal_progress
   */
  private getDegradationRate(progressRatio: number): number {
    const DEGRADATION_RATES = {
      slow: 1.0,    // 100-150%: -1% в месяц
      medium: 2.0,  // 150-200%: -2% в месяц
      fast: 3.0,     // 200%+: -3% в месяц
    };

    if (progressRatio >= 2.0) {
      return DEGRADATION_RATES.fast; // 200%+: быстрая деградация
    } else if (progressRatio >= 1.5) {
      return DEGRADATION_RATES.medium; // 150-200%: средняя деградация
    } else {
      return DEGRADATION_RATES.slow; // 100-150%: медленная деградация
    }
  }
}
