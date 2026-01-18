import { Module, forwardRef } from '@nestjs/common';
import { CoreLoopController } from './core-loop.controller';
import { CoreLoopService } from './core-loop.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EntriesModule } from '../entries/entries.module';
import { SyncModule } from '../sync/sync.module';
import { QuestsModule } from '../quests/quests.module';
import { EvidenceModule } from '../evidence/evidence.module';
import { TreeModule } from '../tree/tree.module';

/**
 * Core Loop Module
 * Объединяет все модули для единого цикла развития
 * 
 * @see docs/DECISION_LOGIC.md
 */
@Module({
  imports: [
    PrismaModule,
    EntriesModule,
    forwardRef(() => SyncModule),
    forwardRef(() => QuestsModule),
    EvidenceModule,
    TreeModule,
  ],
  controllers: [CoreLoopController],
  providers: [CoreLoopService],
  exports: [CoreLoopService],
})
export class CoreLoopModule {}
