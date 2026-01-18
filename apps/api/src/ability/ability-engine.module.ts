import { Module, forwardRef } from '@nestjs/common';
import { AbilityEngine } from './ability-engine.service';
import { AbilityStateService } from './ability-state.service';
import { AbilityController } from './ability.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { AuthModule } from '../auth/auth.module';
import { TreeModule } from '../tree/tree.module';

/**
 * Модуль для AbilityEngine
 */
@Module({
  imports: [
    PrismaModule, 
    AchievementsModule, 
    AuthModule,
    forwardRef(() => TreeModule), // Используем forwardRef для избежания циклических зависимостей
  ],
  controllers: [AbilityController],
  providers: [AbilityEngine, AbilityStateService],
  exports: [AbilityEngine, AbilityStateService],
})
export class AbilityEngineModule {}

