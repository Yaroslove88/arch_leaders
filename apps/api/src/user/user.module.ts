import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserInitializationService } from './user-initialization.service';

@Module({
  imports: [PrismaModule],
  providers: [UserInitializationService],
  exports: [UserInitializationService],
})
export class UserModule {}
