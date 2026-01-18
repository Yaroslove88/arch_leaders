import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    // Явно импортируем ConfigModule, даже если он глобальный, для гарантии доступности
    ConfigModule,
    // PrismaModule уже глобальный (@Global), но явно импортируем для ясности
    PrismaModule,
    // Модуль для инициализации пользователя
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      // ConfigModule уже глобальный, но нужно импортировать для useFactory
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production';
        // Используем число в секундах для совместимости с @nestjs/jwt@11
        const expiresIn = configService.get<number>('JWT_EXPIRES_IN') ?? 60 * 60 * 24 * 7; // 7 days
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  // Важно: providers должны быть перед controllers для правильного порядка инициализации
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}

