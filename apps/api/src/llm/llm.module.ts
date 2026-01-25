import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Для доступа к prompt_registry
  // ConfigModule уже глобальный в AppModule, ConfigService будет доступен автоматически
  providers: [LLMService],
  exports: [LLMService], // <-- критически важно для инжекции
})
export class LLMModule {}

