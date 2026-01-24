import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

export interface ApiKey {
  id: string;
  name: string;
  key_masked: string;
  provider: string;
  created_at: Date;
  last_used_at?: Date;
  created_by_admin_id?: string;
}

@Injectable()
export class AdminSettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Получить список API ключей (маскированные)
   */
  async getApiKeys(): Promise<ApiKey[]> {
    // В реальном приложении ключи хранятся в отдельной таблице или env
    // Здесь возвращаем конфигурацию из env как "виртуальные" ключи
    const keys: ApiKey[] = [];

    if (process.env.OPENAI_API_KEY) {
      keys.push({
        id: 'openai-default',
        name: 'OpenAI API Key',
        key_masked: this.maskKey(process.env.OPENAI_API_KEY),
        provider: 'openai',
        created_at: new Date(),
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      keys.push({
        id: 'anthropic-default',
        name: 'Anthropic API Key',
        key_masked: this.maskKey(process.env.ANTHROPIC_API_KEY),
        provider: 'anthropic',
        created_at: new Date(),
      });
    }

    if (process.env.TELEGRAM_BOT_TOKEN) {
      keys.push({
        id: 'telegram-default',
        name: 'Telegram Bot Token',
        key_masked: this.maskKey(process.env.TELEGRAM_BOT_TOKEN),
        provider: 'telegram',
        created_at: new Date(),
      });
    }

    return keys;
  }

  /**
   * Проверить, настроен ли ключ для провайдера
   */
  async checkKeyExists(provider: string): Promise<boolean> {
    switch (provider) {
      case 'openai':
        return !!process.env.OPENAI_API_KEY;
      case 'anthropic':
        return !!process.env.ANTHROPIC_API_KEY;
      case 'telegram':
        return !!process.env.TELEGRAM_BOT_TOKEN;
      default:
        return false;
    }
  }

  /**
   * Получить системные настройки
   */
  async getSystemSettings() {
    return {
      llm: {
        default_provider: process.env.LLM_PROVIDER || 'openai',
        openai_configured: !!process.env.OPENAI_API_KEY,
        anthropic_configured: !!process.env.ANTHROPIC_API_KEY,
      },
      telegram: {
        bot_configured: !!process.env.TELEGRAM_BOT_TOKEN,
        webhook_url: process.env.TELEGRAM_WEBHOOK_URL || null,
      },
      features: {
        tree_auto_sync_disabled: process.env.DISABLE_TREE_AUTO_SYNC === 'true',
      },
    };
  }

  /**
   * Маскировать ключ для безопасного отображения
   */
  private maskKey(key: string): string {
    if (!key || key.length < 8) return '***';
    const start = key.slice(0, 4);
    const end = key.slice(-4);
    return `${start}${'*'.repeat(Math.min(key.length - 8, 20))}${end}`;
  }
}
