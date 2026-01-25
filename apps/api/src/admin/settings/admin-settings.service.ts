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
   * Приоритет: БД > env переменные
   */
  async getApiKeys(): Promise<ApiKey[]> {
    const keys: ApiKey[] = [];

    try {
      // Пробуем получить ключи из БД
      const dbKeys = await this.prisma.apiKey.findMany({
        orderBy: [
          { is_default: 'desc' },
          { created_at: 'desc' },
        ],
      });

      // Добавляем ключи из БД
      for (const dbKey of dbKeys) {
        keys.push({
          id: dbKey.id,
          name: dbKey.name,
          key_masked: this.maskKey(dbKey.api_key),
          provider: dbKey.provider,
          created_at: dbKey.created_at,
          last_used_at: dbKey.last_used_at || undefined,
          created_by_admin_id: undefined, // TODO: добавить поле в схему если нужно
        });
      }
    } catch (error) {
      // Если БД недоступна или таблица не существует - используем только env
      console.warn('Failed to load API keys from DB, using ENV variables:', error);
    }

    // Добавляем ключи из env как fallback (только если их нет в БД)
    const providersInDb = new Set(keys.map(k => k.provider));

    if (!providersInDb.has('openai') && process.env.OPENAI_API_KEY) {
      keys.push({
        id: 'openai-env',
        name: 'OpenAI API Key (ENV)',
        key_masked: this.maskKey(process.env.OPENAI_API_KEY),
        provider: 'openai',
        created_at: new Date(),
      });
    }

    if (!providersInDb.has('anthropic') && process.env.ANTHROPIC_API_KEY) {
      keys.push({
        id: 'anthropic-env',
        name: 'Anthropic API Key (ENV)',
        key_masked: this.maskKey(process.env.ANTHROPIC_API_KEY),
        provider: 'anthropic',
        created_at: new Date(),
      });
    }

    if (!providersInDb.has('telegram') && process.env.TELEGRAM_BOT_TOKEN) {
      keys.push({
        id: 'telegram-env',
        name: 'Telegram Bot Token (ENV)',
        key_masked: this.maskKey(process.env.TELEGRAM_BOT_TOKEN),
        provider: 'telegram',
        created_at: new Date(),
      });
    }

    return keys;
  }

  /**
   * Проверить, настроен ли ключ для провайдера
   * Проверяет БД и env переменные
   */
  async checkKeyExists(provider: string): Promise<boolean> {
    try {
      // Проверяем БД
      const dbKey = await this.prisma.apiKey.findFirst({
        where: {
          provider,
          is_active: true,
        },
      });

      if (dbKey) {
        return true;
      }
    } catch (error) {
      // Если БД недоступна - проверяем только env
      console.warn(`Failed to check ${provider} key in DB:`, error);
    }

    // Fallback на env переменные
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
   * Проверяет БД и env переменные
   */
  async getSystemSettings() {
    let openaiConfigured = false;
    let anthropicConfigured = false;
    let telegramConfigured = false;

    try {
      // Проверяем БД
      const dbKeys = await this.prisma.apiKey.findMany({
        where: { is_active: true },
      });

      openaiConfigured = dbKeys.some(k => k.provider === 'openai') || !!process.env.OPENAI_API_KEY;
      anthropicConfigured = dbKeys.some(k => k.provider === 'anthropic') || !!process.env.ANTHROPIC_API_KEY;
      telegramConfigured = dbKeys.some(k => k.provider === 'telegram') || !!process.env.TELEGRAM_BOT_TOKEN;
    } catch (error) {
      // Если БД недоступна - используем только env
      console.warn('Failed to load system settings from DB, using ENV:', error);
      openaiConfigured = !!process.env.OPENAI_API_KEY;
      anthropicConfigured = !!process.env.ANTHROPIC_API_KEY;
      telegramConfigured = !!process.env.TELEGRAM_BOT_TOKEN;
    }

    return {
      llm: {
        default_provider: process.env.LLM_PROVIDER || 'openai',
        openai_configured: openaiConfigured,
        anthropic_configured: anthropicConfigured,
      },
      telegram: {
        bot_configured: telegramConfigured,
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
