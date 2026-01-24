import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Inject, InternalServerErrorException, forwardRef, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UserInitializationService } from '../user/user-initialization.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { TelegramWebAppDto } from './dto/telegram-webapp.dto';
import * as crypto from 'crypto';

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
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => UserInitializationService))
    private readonly userInitializationService: UserInitializationService,
  ) {
    if (!this.jwtService) {
      throw new InternalServerErrorException('JwtService injection failed');
    }
    if (!this.configService) {
      throw new InternalServerErrorException('ConfigService injection failed');
    }
    if (!this.prisma) {
      throw new InternalServerErrorException('PrismaService injection failed');
    }
  }

  /**
   * Валидация API ключа (legacy поддержка)
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    const validApiKey = this.configService.get<string>('API_KEY');
    if (!validApiKey) {
      return true;
    }
    return apiKey === validApiKey;
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
    // Проверяем, существует ли пользователь
    const existingUser = await this.prisma.user.findUnique({
      where: { telegramUsername: registerDto.telegramUsername },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким Telegram username уже существует');
    }

    // Хэшируем пароль
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Создаем пользователя
    const user = await this.prisma.user.create({
      data: {
        telegramUsername: registerDto.telegramUsername,
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
      `DIAG auth.login called: hasUsername=${!!loginDto?.telegramUsername} hasPassword=${!!loginDto?.password} hasApiKey=${!!loginDto?.apiKey}`,
    );
    // Legacy поддержка API ключа
    if (loginDto.apiKey) {
      const isValid = await this.validateApiKey(loginDto.apiKey);
      if (!isValid) {
        throw new UnauthorizedException('Invalid API key');
      }

      const payload: JwtPayload = {
        sub: 'api-key-user',
        role: 'api',
      };

      return {
        access_token: await this.generateToken(payload),
        user: {
          id: 'api-key-user',
          telegramUsername: 'api-key',
          role: 'api',
        },
      };
    }

    // Проверяем наличие telegramUsername и password
    if (!loginDto.telegramUsername || !loginDto.password) {
      throw new BadRequestException('Необходимо указать telegramUsername и password');
    }

    // Ищем пользователя
    const user = await this.prisma.user.findUnique({
      where: { telegramUsername: loginDto.telegramUsername },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный Telegram username или пароль');
    }
    // findUnique может вернуть null, что нормально - проверяем явно

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный Telegram username или пароль');
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

  /**
   * Верификация hash от Telegram Login Widget
   * Алгоритм: https://core.telegram.org/widgets/login#checking-authorization
   */
  private verifyTelegramHash(data: TelegramAuthDto): boolean {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      // Если токен не настроен, пропускаем проверку (для разработки)
      // В production это должно быть обязательно
      return true;
    }

    // Создаем строку для проверки hash (все поля кроме hash, отсортированные по алфавиту)
    const dataCheckString = Object.keys(data)
      .filter(key => key !== 'hash')
      .sort()
      .map(key => {
        const value = data[key as keyof TelegramAuthDto];
        return `${key}=${value}`;
      })
      .join('\n');

    // Telegram Login Widget: secret_key = SHA256(bot_token) (bytes),
    // затем hash = HMAC-SHA256(data_check_string, secret_key).
    // (Важно: это НЕ алгоритм Telegram WebApp initData)
    const secretKey = crypto.createHash('sha256').update(botToken).digest();

    // Вычисляем hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Проверяем, что hash совпадает
    return calculatedHash === data.hash;
  }

  /**
   * Верификация initData от Telegram Mini App (WebApp)
   * Алгоритм: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
   */
  private verifyTelegramWebAppData(initData: string): { isValid: boolean; user?: any; error?: string } {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const skipValidation = this.configService.get<string>('SKIP_TELEGRAM_VALIDATION') === 'true';
    
    // Парсим параметры сразу
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    let user = null;
    
    try {
      user = userStr ? JSON.parse(decodeURIComponent(userStr)) : null;
    } catch (e) {
      this.logger.error(`Failed to parse user from initData: ${e}`);
      return { isValid: false, error: 'Invalid user data in initData' };
    }
    
    // Пропускаем проверку если нет токена или включён SKIP_TELEGRAM_VALIDATION
    if (!botToken || skipValidation) {
      this.logger.warn(`Telegram validation skipped: botToken=${!!botToken}, skipValidation=${skipValidation}`);
      return { isValid: true, user };
    }

    const hash = params.get('hash');
    if (!hash) {
      this.logger.error('No hash in initData');
      return { isValid: false, error: 'No hash in initData' };
    }

    // Удаляем hash из параметров и сортируем
    params.delete('hash');
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // WebApp secret: HMAC_SHA256("WebAppData", bot_token)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Вычисляем hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    const isValid = calculatedHash === hash;
    
    if (!isValid) {
      this.logger.error(`Hash mismatch: expected=${hash.substring(0, 16)}..., got=${calculatedHash.substring(0, 16)}...`);
      this.logger.debug(`dataCheckString: ${dataCheckString.substring(0, 100)}...`);
      return { isValid: false, error: 'Hash mismatch - check TELEGRAM_BOT_TOKEN' };
    }

    return { isValid: true, user };
  }

  /**
   * Аутентификация через Telegram Mini App (WebApp)
   */
  async loginWithTelegramWebApp(webAppDto: TelegramWebAppDto): Promise<{ access_token: string; user: { id: string; telegramUsername: string; role: string } }> {
    this.logger.warn(
      `DIAG auth.loginWithTelegramWebApp called: initDataPresent=${!!webAppDto?.initData}, initDataLength=${webAppDto?.initData?.length || 0}`,
    );
    const { isValid, user: tgUser, error } = this.verifyTelegramWebAppData(webAppDto.initData);
    
    if (!isValid) {
      this.logger.error(`Telegram WebApp auth failed: ${error}`);
      throw new UnauthorizedException(error || 'Неверная подпись Telegram WebApp данных');
    }

    if (!tgUser || !tgUser.id) {
      throw new BadRequestException('Данные пользователя отсутствуют в initData');
    }

    // Определяем username
    const username = tgUser.username || `tg_${tgUser.id}`;

    // Ищем или создаём пользователя
    let user = await this.prisma.user.findUnique({
      where: { telegramUsername: username },
    });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          telegramUsername: username,
          password: hashedPassword,
          role: 'user',
          status: 'active',
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { last_seen_at: new Date() },
      });
    }

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
   * Аутентификация через Telegram OAuth
   */
  async loginWithTelegram(telegramAuthDto: TelegramAuthDto): Promise<{ access_token: string; user: { id: string; telegramUsername: string; role: string } }> {
    this.logger.warn(
      `DIAG auth.loginWithTelegram called: hasId=${!!telegramAuthDto?.id} hasHash=${!!telegramAuthDto?.hash}`,
    );
    // Верифицируем hash (опционально, если настроен TELEGRAM_BOT_TOKEN)
    const isValid = this.verifyTelegramHash(telegramAuthDto);
    if (!isValid) {
      throw new UnauthorizedException('Неверная подпись Telegram данных');
    }

    // Проверяем, что данные не устарели (не старше 24 часов)
    const authDate = new Date(telegramAuthDto.auth_date * 1000);
    const now = new Date();
    const hoursDiff = (now.getTime() - authDate.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      throw new UnauthorizedException('Данные аутентификации устарели');
    }

    // Определяем username для поиска/создания пользователя
    const username = telegramAuthDto.username || `tg_${telegramAuthDto.id}`;

    // Ищем существующего пользователя по telegramUsername
    let user = await this.prisma.user.findUnique({
      where: { telegramUsername: username },
    });

    // Если пользователь не найден, создаем нового
    const isNewUser = !user;
    if (!user) {
      // Генерируем случайный пароль (пользователь не будет его использовать при OAuth)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          telegramUsername: username,
          password: hashedPassword,
          role: 'user',
          status: 'active',
        },
      });
    } else {
      // Обновляем last_seen_at
      await this.prisma.user.update({
        where: { id: user.id },
        data: { last_seen_at: new Date() },
      });
    }

    // Инициализируем нового пользователя или проверяем инициализацию существующего
    if (this.userInitializationService) {
      try {
        const needsInit =
          isNewUser || (await this.userInitializationService.needsInitialization(user.id));
        this.logger.warn(
          `DIAG auth.loginWithTelegram init decision: isNewUser=${isNewUser} needsInit=${needsInit} userId=${user.id}`,
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
}

