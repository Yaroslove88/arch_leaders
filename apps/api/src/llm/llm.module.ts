import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';

@Module({
  // ConfigModule уже глобальный в AppModule, ConfigService будет доступен автоматически
  providers: [LLMService],
  exports: [LLMService], // <-- критически важно для инжекции
})
export class LLMModule {}

