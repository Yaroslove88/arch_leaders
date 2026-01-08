import { Module } from '@nestjs/common';
import { QuestsController } from './quests.controller';
import { QuestsService } from './quests.service';
import { QuestGenerationService } from './quest-generation.service';
import { QuestRepository } from './quest.repository';
import { QuestEngine } from './quest-engine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TreeModule } from '../tree/tree.module';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [PrismaModule, TreeModule, LLMModule],
  controllers: [QuestsController],
  providers: [
    QuestsService,
    QuestGenerationService,
    QuestRepository,
    QuestEngine,
  ],
  exports: [QuestsService, QuestGenerationService, QuestRepository, QuestEngine],
})
export class QuestsModule {}
