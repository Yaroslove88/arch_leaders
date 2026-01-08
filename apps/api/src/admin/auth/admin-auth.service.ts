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
    let admin;
    
    if (loginDto.telegramUsername) {
      // Ищем по telegramUsername (email может быть в формате username@admin.local)
      const username = loginDto.telegramUsername.replace('@', '');
      const email = `${username}@admin.local`;
      admin = await this.prisma.adminUser.findUnique({
        where: { email },
      });
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

    // Обновляем last_login_at
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { last_login_at: new Date() },
    });

    // Извлекаем telegramUsername из email (если формат username@admin.local)
    const telegramUsername = admin.email.replace('@admin.local', '');

    const payload: AdminJwtPayload = {
      sub: admin.id,
      email: admin.email,
      telegramUsername,
      role: admin.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        email: admin.email,
        telegramUsername,
        role: admin.role,
      },
    };
  }

  async getMe(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
        last_login_at: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    return admin;
  }
}

