import { Module } from '@nestjs/common';
import { TreeController } from './tree.controller';
import { TreeFixController } from './tree-fix.controller';
import { TreeService } from './tree.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PathConfigModule } from '../config/config.module';
import { ProtectGlobalTreeGuard } from '../common/guards/protect-global-tree.guard';
import { OverwriteProtectionInterceptor } from '../common/interceptors/overwrite-protection.interceptor';

@Module({
  imports: [PrismaModule, PathConfigModule],
  controllers: [TreeController, TreeFixController],
  providers: [
    TreeService,
    ProtectGlobalTreeGuard,
    OverwriteProtectionInterceptor,
  ],
  exports: [TreeService],
})
export class TreeModule {}

