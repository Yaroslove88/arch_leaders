import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PathConfigModule } from './config/config.module';
import { LLMModule } from './llm/llm.module';
import { EntriesModule } from './entries/entries.module';
import { SessionsModule } from './sessions/sessions.module';
import { EvidenceModule } from './evidence/evidence.module';
import { SyncModule } from './sync/sync.module';
import { TreeModule } from './tree/tree.module';
import { QuestsModule } from './quests/quests.module';
import { AuthModule } from './auth/auth.module';
import { CasesModule } from './cases/cases.module';
import { NodesModule } from './nodes/nodes.module';
import { BuildsModule } from './builds/builds.module';
import { AdminModule } from './admin/admin.module';
import { JobsModule } from './jobs/jobs.module';
import { AchievementsModule } from './achievements/achievements.module';
import { RetentionModule } from './retention/retention.module';
import { SupportModule } from './support/support.module';
import { CoreLoopModule } from './core-loop/core-loop.module';
import { MetricsModule } from './metrics/metrics.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { HealthController } from './common/health/health.controller';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { validate } from './config/env.validation';

@Module({
  imports: [
    // Глобальные модули должны быть первыми
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'apps/api/.env'], // Проверяем оба возможных пути
      validate,
    }),
    PrismaModule, // Глобальный модуль
    ScheduleModule.forRoot(), // Планировщик задач
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 минута
        limit: 100, // 100 запросов в минуту
      },
    ]),
    PathConfigModule,
    LLMModule, // Импортируется в модулях, которые используют LLMService
    // Остальные модули
    EntriesModule,
    SessionsModule,
    EvidenceModule,
    SyncModule,
    TreeModule,
    QuestsModule,
    AuthModule, // Должен быть после глобальных модулей
    CasesModule,
    NodesModule,
    BuildsModule,
    AdminModule, // Админ-панель
    JobsModule, // Job queue и worker
    AchievementsModule, // Система ачивок
    RetentionModule, // Система ретеншена и серий
    SupportModule, // Поддержка при застревании
    CoreLoopModule, // Unified Core Loop API
    MetricsModule, // Core Loop metrics
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // JWT guard применяется глобально, но можно отключить через @Public()
    // Раскомментируйте для включения глобальной защиты:
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

