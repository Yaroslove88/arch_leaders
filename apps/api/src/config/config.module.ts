import { Module, Global } from '@nestjs/common';
import { PathConfigService } from './path-config.service';

/**
 * Глобальный модуль для управления путями к файлам
 * Предоставляет PathConfigService для централизованного управления путями
 */
@Global()
@Module({
  providers: [PathConfigService],
  exports: [PathConfigService],
})
export class PathConfigModule {}

