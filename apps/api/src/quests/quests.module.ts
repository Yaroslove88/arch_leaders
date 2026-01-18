import { Module } from '@nestjs/common';
import { QuestsController } from './quests.controller';
import { QuestsService } from './quests.service';
import { QuestGenerationService } from './quest-generation.service';
import { QuestRepository } from './quest.repository';
import { QuestEngine } from './quest-engine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TreeModule } from '../tree/tree.module';
import { LLMModule } from '../llm/llm.module';
import { AbilityEngineModule } from '../ability/ability-engine.module';
import { ProtectBaseQuestsGuard } from '../common/guards/protect-base-quests.guard';
import { OverwriteProtectionInterceptor } from '../common/interceptors/overwrite-protection.interceptor';

@Module({
  imports: [PrismaModule, TreeModule, LLMModule, AbilityEngineModule],
  controllers: [QuestsController],
  providers: [
    QuestsService,
    QuestGenerationService,
    QuestRepository,
    QuestEngine,
    ProtectBaseQuestsGuard,
    OverwriteProtectionInterceptor,
  ],
  exports: [QuestsService, QuestGenerationService, QuestRepository, QuestEngine],
})
export class QuestsModule {}
