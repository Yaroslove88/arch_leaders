import { Module } from '@nestjs/common';
import { BuildsController } from './builds.controller';
import { BuildsService } from './builds.service';
import { TreeModule } from '../tree/tree.module';
import { PathConfigModule } from '../config/config.module';

@Module({
  imports: [TreeModule, PathConfigModule],
  controllers: [BuildsController],
  providers: [BuildsService],
  exports: [BuildsService],
})
export class BuildsModule {}

