import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { PathConfigModule } from '../config/config.module';
import { AbilityEngineModule } from '../ability/ability-engine.module';
import { TreeModule } from '../tree/tree.module';

@Module({
  imports: [PathConfigModule, AbilityEngineModule, TreeModule],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}

