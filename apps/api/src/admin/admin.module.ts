import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminEntriesModule } from './entries/admin-entries.module';
import { AdminSessionsModule } from './sessions/admin-sessions.module';
import { AdminQuestsModule } from './quests/admin-quests.module';
import { AdminAbilitiesModule } from './abilities/admin-abilities.module';
import { AdminConfigModule } from './config/admin-config.module';
import { AdminPromptsModule } from './prompts/admin-prompts.module';
import { AdminJobsModule } from './jobs/admin-jobs.module';
import { AdminAuditModule } from './audit/admin-audit.module';
import { AdminPipelineModule } from './pipeline/admin-pipeline.module';
import { AdminAnalyticsModule } from './analytics/admin-analytics.module';
import { AuditService } from './audit/audit.service';

@Module({
  imports: [
    PrismaModule,
    AdminAuthModule,
    AdminUsersModule,
    AdminEntriesModule,
    AdminSessionsModule,
    AdminQuestsModule,
    AdminAbilitiesModule,
    AdminConfigModule,
    AdminPromptsModule,
    AdminJobsModule,
    AdminAuditModule,
    AdminPipelineModule,
    AdminAnalyticsModule,
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AdminModule {}

