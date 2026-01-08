import { Module } from '@nestjs/common';
import { QuestOrchestrationService } from './quest-orchestration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QuestsModule } from '../quests/quests.module';

/**
 * Модуль оркестрации для управления жизненным циклом квестов
 * Разрывает циклическую зависимость между Sync и Quests
 */
@Module({
  imports: [
    PrismaModule,
    QuestsModule, // Импортируем QuestsModule для доступа к QuestGenerationService и QuestRepository
  ],
  providers: [QuestOrchestrationService],
  exports: [QuestOrchestrationService],
})
export class OrchestrationModule {}

