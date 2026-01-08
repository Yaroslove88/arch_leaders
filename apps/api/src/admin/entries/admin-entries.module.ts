import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminEntriesService } from './admin-entries.service';
import { AdminEntriesController } from './admin-entries.controller';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: 60 * 60 * 24 }, // 24 hours in seconds
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AdminEntriesService, AuditService],
  controllers: [AdminEntriesController],
})
export class AdminEntriesModule {}

