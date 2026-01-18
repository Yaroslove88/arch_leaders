import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface AdminLoginDto {
  telegramUsername?: string;
  email?: string;
  password: string;
}

export interface AdminJwtPayload {
  telegramUsername?: string;
  sub: string; // admin user ID
  email: string;
  role: string;
}

@Injectable()
export class AdminAuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(loginDto: AdminLoginDto): Promise<{ access_token: string; admin: any }> {
    // Поддерживаем вход по telegramUsername или email
    let admin: any = null;
    let isFromUsersTable = false;
    
    if (loginDto.telegramUsername) {
      const username = loginDto.telegramUsername.replace('@', '');
      
      // 1. Сначала ищем в admin_users по email формата username@admin.local
      const email = `${username}@admin.local`;
      admin = await this.prisma.adminUser.findUnique({
        where: { email },
      });
      
      // 2. Fallback: ищем в обычной таблице users с role='admin'
      if (!admin) {
        const regularAdmin = await this.prisma.user.findUnique({
          where: { telegramUsername: username },
        });
        
        if (regularAdmin && regularAdmin.role === 'admin') {
          admin = regularAdmin;
          isFromUsersTable = true;
        }
      }
    } else if (loginDto.email) {
      admin = await this.prisma.adminUser.findUnique({
        where: { email: loginDto.email },
      });
    } else {
      throw new BadRequestException('Необходимо указать telegramUsername или email');
    }

    if (!admin) {
      throw new UnauthorizedException('Неверный Telegram username или пароль');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный Telegram username или пароль');
    }

    // Обновляем last_login_at / last_seen_at
    if (isFromUsersTable) {
      await this.prisma.user.update({
        where: { id: admin.id },
        data: { last_seen_at: new Date() },
      });
    } else {
      await this.prisma.adminUser.update({
        where: { id: admin.id },
        data: { last_login_at: new Date() },
      });
    }

    // Определяем telegramUsername и email
    const telegramUsername = isFromUsersTable 
      ? admin.telegramUsername 
      : admin.email.replace('@admin.local', '');
    const email = isFromUsersTable 
      ? (admin.email || `${admin.telegramUsername}@admin.local`)
      : admin.email;
    const role = isFromUsersTable ? 'super_admin' : admin.role;

    const payload: AdminJwtPayload = {
      sub: admin.id,
      email: email,
      telegramUsername,
      role: role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        email: email,
        telegramUsername,
        role: role,
        source: isFromUsersTable ? 'users' : 'admin_users',
      },
    };
  }

  async getMe(adminId: string) {
    // 1. Сначала ищем в таблице admin_users
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
        last_login_at: true,
      },
    });

    if (adminUser) {
      return adminUser;
    }

    // 2. Fallback: ищем в обычной таблице users с role='admin'
    // Это нужно для совместимости, т.к. AdminAuthGuard уже имеет такой fallback
    const regularAdmin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        telegramUsername: true,
        role: true,
        created_at: true,
        last_seen_at: true,
      },
    });

    if (regularAdmin && regularAdmin.role === 'admin') {
      return {
        id: regularAdmin.id,
        email: regularAdmin.email || `${regularAdmin.telegramUsername}@admin.local`,
        role: 'super_admin', // Обычный админ получает полные права
        created_at: regularAdmin.created_at,
        last_login_at: regularAdmin.last_seen_at,
        // Дополнительно для фронтенда
        telegramUsername: regularAdmin.telegramUsername,
        source: 'users', // Индикатор что это админ из таблицы users
      };
    }

    throw new UnauthorizedException('Admin not found');
  }
}

