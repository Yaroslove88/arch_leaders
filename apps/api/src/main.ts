import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Sentry инициализация (опционально, только если SENTRY_DSN установлен)
let Sentry: any = null;
try {
  const sentryModule = require('@sentry/nestjs');
  Sentry = sentryModule;
} catch (e) {
  // Sentry не установлен или не настроен
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Инициализация Sentry (если DSN установлен)
  const sentryDsn = configService.get<string>('SENTRY_DSN');
  if (Sentry && sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: configService.get<string>('NODE_ENV') || 'development',
      tracesSampleRate: configService.get<string>('NODE_ENV') === 'production' ? 0.1 : 1.0,
    });
    console.log('✅ Sentry initialized');
  }
  
  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Глобальный обработчик ошибок
  app.useGlobalFilters(new AllExceptionsFilter());

  // Глобальный логирование
  app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS настройка с белым списком
  const webUrl = configService.get<string>('WEB_URL') || 'http://localhost:3000';
  const allowedOrigins = [webUrl];
  
  // В development добавляем дополнительные origins для удобства разработки
  if (configService.get<string>('NODE_ENV') === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Разрешаем запросы без origin (например, Postman, curl)
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  });

  // Swagger документация
  // Временно отключено для диагностики ошибок
  // Раскомментируйте после добавления всех декораторов Swagger
  const port = configService.get<number>('PORT') || 3001;
  
  const enableSwagger = configService.get<string>('ENABLE_SWAGGER') !== 'false' 
    && configService.get<string>('NODE_ENV') !== 'production';

  if (enableSwagger) {
    try {
      const config = new DocumentBuilder()
        .setTitle('Leadership Architect API')
        .setDescription('API для системы развития лидерских способностей через архитектурное мышление')
        .setVersion('1.0.0')
        .addTag('entries', 'Управление записями (ситуации, размышления, обратная связь)')
        .addTag('sessions', 'Сессии анализа')
        .addTag('quests', 'Квесты для развития способностей')
        .addTag('evidence', 'Доказательства применения способностей')
        .addTag('tree', 'Дерево способностей')
        .addTag('sync', 'Синхронизация и анализ')
        .addTag('health', 'Проверка здоровья API')
        .addTag('auth', 'Аутентификация')
        .addBearerAuth()
        .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
        .build();
      
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'Leadership Architect API Docs',
        customfavIcon: 'https://nestjs.com/img/logo_text.svg',
        customCss: '.swagger-ui .topbar { display: none }',
      });
      
      console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
    } catch (error) {
      const err = error as Error;
      console.error('❌ Swagger initialization failed:', err.message);
      console.log('💡 Set ENABLE_SWAGGER=false in .env to disable Swagger');
    }
  }
  
  await app.listen(port);
  console.log(`🚀 Leadership Architect API running on http://localhost:${port}`);
  console.log(`📡 CORS enabled for: ${allowedOrigins.join(', ')}`);
}
bootstrap();

