import { Module } from '@nestjs/common';
import { TreeController } from './tree.controller';
import { TreeService } from './tree.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PathConfigModule } from '../config/config.module';

@Module({
  imports: [PrismaModule, PathConfigModule],
  controllers: [TreeController],
  providers: [TreeService],
  exports: [TreeService],
})
export class TreeModule {}

