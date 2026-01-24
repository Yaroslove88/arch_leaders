import { Injectable, OnModuleInit, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {// Не блокируем запуск API: подключение к БД может занять время/быть временно недоступным.
    void this.$connect()
      .then(() => {
        this.logger.log('✅ Prisma connected to database');})
      .catch((error) => {
        this.logger.error('❌ Failed to connect to database:', error);});
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }
}

