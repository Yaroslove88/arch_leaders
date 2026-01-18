import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as net from 'net';

// Sentry инициализация (опционально, только если SENTRY_DSN установлен)
let Sentry: any = null;
try {
  const sentryModule = require('@sentry/nestjs');
  Sentry = sentryModule;
} catch (e) {
  // Sentry не установлен или не настроен
}

// Helper function to check if port is available
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

// Helper function to get process using port (Windows)
async function getProcessUsingPort(port: number): Promise<string | null> {
  try {
    const { execSync } = require('child_process');
    const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
    const lines = result.trim().split('\n');
    if (lines.length > 0) {
      const parts = lines[0].trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid) {
        try {
          const processInfo = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV`, { encoding: 'utf-8' });
          return processInfo;
        } catch {
          return `PID: ${pid}`;
        }
      }
    }
  } catch (error) {
    // Command failed or no process found
  }
  return null;
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
  // По умолчанию Next.js может работать на разных портах (3000, 3001, 3002...)
  const webUrl = configService.get<string>('WEB_URL') || 'http://localhost:3000';
  const allowedOrigins = [webUrl];
  
  // В development добавляем дополнительные origins для удобства разработки
  // Next.js может запускаться на разных портах (3000, 3001, 3002, ...)
  if (configService.get<string>('NODE_ENV') === 'development') {
    // Добавляем стандартные порты для Next.js
    for (let port = 3000; port <= 3010; port++) {
      allowedOrigins.push(`http://localhost:${port}`, `http://127.0.0.1:${port}`);
    }
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
  // API всегда на порту 3001, Next.js на 3000
  const port = configService.get<number>('PORT') || 3001;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-A',location:'apps/api/src/main.ts:PORT',message:'Computed PORT value',data:{portValue:port,portType:typeof port,configPort:configService.get('PORT'),envPort:process.env.PORT,nodeEnv:process.env.NODE_ENV},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  
  // Проверка доступности порта перед запуском
  const portAvailable = await isPortAvailable(port);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-A',location:'apps/api/src/main.ts:PORT_CHECK',message:'Port availability checked',data:{portValue:port,portType:typeof port,portAvailable},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  
  if (!portAvailable) {
    const processInfo = await getProcessUsingPort(port);
    
    // Extract PID from process info
    let pid: string | null = null;
    if (processInfo) {
      const pidMatch = processInfo.match(/"node\.exe","(\d+)"/);
      if (pidMatch) {
        pid = pidMatch[1];
      }
    }
    
    console.error(`\n❌ Port ${port} is already in use!`);
    if (pid) {
      console.error(`📋 Process using port ${port}: node.exe (PID: ${pid})`);
      console.error(`\n💡 To kill the process, run:`);
      console.error(`   taskkill /PID ${pid} /F`);
    } else {
      console.error(`📋 Another process is using port ${port}`);
      console.error(`\n💡 To find the process, run:`);
      console.error(`   netstat -ano | findstr :${port}`);
    }
    console.error(`\n💡 Alternative solutions:`);
    console.error(`   1. Stop the existing instance of the API`);
    console.error(`   2. Change the PORT in your .env file`);
    console.error(`   3. Use: pnpm run kill-port (if available)\n`);
    
    // Exit gracefully instead of throwing
    process.exit(1);
  }
  
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
  
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-B',location:'apps/api/src/main.ts:LISTEN',message:'Calling app.listen()',data:{portValue:port,portType:typeof port},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    await app.listen(port);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-A',location:'apps/api/src/main.ts:LISTEN_OK',message:'app.listen() resolved',data:{portValue:port,portType:typeof port,url:await app.getUrl().catch(()=>null)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.log(`🚀 Leadership Architect API running on http://localhost:${port}`);
    console.log(`📡 CORS enabled for: ${allowedOrigins.join(', ')}`);
  } catch (error: any) {
    
    if (error?.code === 'EADDRINUSE') {
      // Fallback error handling (in case of race condition between check and listen)
      const processInfo = await getProcessUsingPort(port);
      let pid: string | null = null;
      if (processInfo) {
        const pidMatch = processInfo.match(/"node\.exe","(\d+)"/);
        if (pidMatch) {
          pid = pidMatch[1];
        }
      }
      
      console.error(`\n❌ Port ${port} is already in use!`);
      if (pid) {
        console.error(`📋 Process using port ${port}: node.exe (PID: ${pid})`);
        console.error(`\n💡 To kill the process, run:`);
        console.error(`   taskkill /PID ${pid} /F`);
      } else {
        console.error(`📋 Another process is using port ${port}`);
        console.error(`\n💡 To find the process, run:`);
        console.error(`   netstat -ano | findstr :${port}`);
      }
      console.error(`\n💡 Alternative solutions:`);
      console.error(`   1. Stop the existing instance of the API`);
      console.error(`   2. Change the PORT in your .env file`);
      console.error(`   3. Use: pnpm run kill-port (if available)\n`);
      
      process.exit(1);
    }
    throw error;
  }
}
bootstrap();

