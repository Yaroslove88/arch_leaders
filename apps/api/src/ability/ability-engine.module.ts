import { Module } from '@nestjs/common';
import { AbilityEngine } from './ability-engine.service';
import { AbilityStateService } from './ability-state.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Модуль для AbilityEngine
 */
@Module({
  imports: [PrismaModule],
  providers: [AbilityEngine, AbilityStateService],
  exports: [AbilityEngine, AbilityStateService],
})
export class AbilityEngineModule {}

