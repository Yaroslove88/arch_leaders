import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { REQUIRES_REASON_KEY } from '../decorators/requires-reason.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ReasonValidationPipe implements PipeTransform {
  constructor(private reflector: Reflector) {}

  transform(value: any, metadata: ArgumentMetadata) {
    // Для Pipe мы не можем получить ExecutionContext напрямую
    // Если нужна проверка reason, лучше использовать Guard или Interceptor
    // Здесь оставляем простую валидацию
    if (value && typeof value === 'object' && value.reason !== undefined) {
      if (!value.reason || value.reason.trim().length === 0) {
        throw new BadRequestException('Reason is required for this operation');
      }
    }

    return value;
  }
}

