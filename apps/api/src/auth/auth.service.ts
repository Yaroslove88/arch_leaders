import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Inject, InternalServerErrorException, forwardRef, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserInitializationService } from '../user/user-initialization.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

export interface JwtPayload {
  sub: string; // user ID
  telegramUsername?: string;
  role?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => UserInitializationService))
    private readonly userInitializationService: UserInitializationService,
  ) {
    if (!this.jwtService) {
      throw new InternalServerErrorException('JwtService injection failed');
    }
    if (!this.prisma) {
      throw new InternalServerErrorException('PrismaService injection failed');
    }
  }

  /**
   * Создание JWT токена
   */
  async generateToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.sign(payload);
  }

  /**
   * Валидация JWT токена
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Регистрация нового пользователя
   */
  async register(registerDto: RegisterDto): Promise<{ access_token: string; user: { id: string; telegramUsername: string; role: string } }> {
    const login = (registerDto.login || registerDto.telegramUsername || '').replace('@', '');
    if (!login) {
      throw new BadRequestException('Необходимо указать login');
    }

    // Проверяем, существует ли пользователь
    const existingUser = await this.prisma.user.findUnique({
      where: { telegramUsername: login },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким логином уже существует');
    }

    // Хэшируем пароль
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Создаем пользователя
    const user = await this.prisma.user.create({
      data: {
        telegramUsername: login,
        password: hashedPassword,
        role: 'user',
      },
    });

    // Генерируем токен
    const payload: JwtPayload = {
      sub: user.id,
      telegramUsername: user.telegramUsername,
      role: user.role,
    };

    return {
      access_token: await this.generateToken(payload),
      user: {
        id: user.id,
        telegramUsername: user.telegramUsername,
        role: user.role,
      },
    };
  }

  /**
   * Аутентификация пользователя
   */
  async login(loginDto: LoginDto): Promise<{ access_token: string; user: { id: string; telegramUsername: string; role: string } }> {
    this.logger.warn(
      `DIAG auth.login called: hasLogin=${!!(loginDto?.login || loginDto?.telegramUsername || loginDto?.username)} hasPassword=${!!loginDto?.password}`,
    );

    const login = (loginDto.login || loginDto.telegramUsername || loginDto.username || '').replace('@', '');
    if (!login || !loginDto.password) {
      throw new BadRequestException('Необходимо указать login и password');
    }

    // Ищем пользователя
    const user = await this.prisma.user.findUnique({
      where: { telegramUsername: login },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    // findUnique может вернуть null, что нормально - проверяем явно

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    // Проверяем, нужна ли инициализация пользователя
    if (this.userInitializationService) {
      try {
        const needsInit = await this.userInitializationService.needsInitialization(user.id);
        this.logger.warn(
          `DIAG auth.login init decision: needsInit=${needsInit} userId=${user.id}`,
        );
        if (needsInit) {
          // Инициализируем пользователя синхронно (блокируем ответ до завершения)
          await this.userInitializationService.initializeUser(user.id);
        }
      } catch (error) {
        // Логируем ошибку, но не блокируем логин
        console.error('Error initializing user:', error);
      }
    }

    // Генерируем токен
    const payload: JwtPayload = {
      sub: user.id,
      telegramUsername: user.telegramUsername,
      role: user.role,
    };

    return {
      access_token: await this.generateToken(payload),
      user: {
        id: user.id,
        telegramUsername: user.telegramUsername,
        role: user.role,
      },
    };
  }

  /**
   * Получение пользователя по ID
   */
  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegramUsername: true,
        role: true,
        created_at: true,
      },
    });
  }

  /**
   * Смена пароля пользователя
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    // Получаем пользователя с паролем
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    // Проверяем текущий пароль
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Неверный текущий пароль');
    }

    // Хэшируем новый пароль
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

    // Обновляем пароль
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Пароль успешно изменен' };
  }

  /**
   * Получение всех пользователей (только для админов)
   */
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        telegramUsername: true,
        role: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Обновление роли пользователя (только для админов)
   */
  async updateUserRole(userId: string, newRole: string): Promise<{ message: string; user: any }> {
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestException(`Роль должна быть одной из: ${validRoles.join(', ')}`);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        telegramUsername: true,
        role: true,
        created_at: true,
      },
    });

    return {
      message: 'Роль пользователя успешно обновлена',
      user,
    };
  }

  /**
   * Удаление пользователя (только для админов)
   */
  async deleteUser(userId: string): Promise<{ message: string }> {
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Пользователь успешно удален' };
  }

  /**
   * Отметить завершение онбординга для пользователя
   * Также автоматически активирует первый квест из backlog
   */
  async completeOnboarding(userId: string): Promise<{ message: string; onboarding_completed: boolean; onboarding_completed_at: Date; activated_quest_id?: string }> {
    const now = new Date();
    
    // Обновляем статус онбординга
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        onboarding_completed: true,
        onboarding_completed_at: now,
      },
    });

    // Автоматически активируем первый квест из backlog
    let activatedQuestId: string | undefined;
    try {
      const firstQuest = await this.prisma.quest.findFirst({
        where: { 
          userId,
          status: 'backlog',
        },
        orderBy: { created_at: 'asc' },
      });

      if (firstQuest) {
        await this.prisma.quest.update({
          where: { id: firstQuest.id },
          data: { 
            status: 'active',
            activated_at: now,
          },
        });
        activatedQuestId = firstQuest.id;
        this.logger.log(`✅ Auto-activated quest ${firstQuest.id} for user ${userId} after onboarding`);
      }
    } catch (error) {
      this.logger.error(`Failed to auto-activate quest for user ${userId}:`, error);
      // Не блокируем завершение онбординга при ошибке активации квеста
    }

    return { 
      message: activatedQuestId ? 'Онбординг завершён, первый квест активирован' : 'Онбординг завершён',
      onboarding_completed: true,
      onboarding_completed_at: now,
      activated_quest_id: activatedQuestId,
    };
  }
}
