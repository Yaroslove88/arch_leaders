'use client';

import { useState, useEffect } from 'react';
import { getApiKeys, getSystemSettings, ApiKeyInfo, SystemSettings } from '../../lib/admin-api';
import LoadingSpinner from '../LoadingSpinner';

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [keys, sysSettings] = await Promise.all([
        getApiKeys(),
        getSystemSettings(),
      ]);
      setApiKeys(keys);
      setSettings(sysSettings);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return '🤖';
      case 'anthropic':
        return '🧠';
      case 'telegram':
        return '📱';
      default:
        return '🔑';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'bg-sage-green/20 text-sage-green';
      case 'anthropic':
        return 'bg-inner-violet/20 text-inner-violet';
      case 'telegram':
        return 'bg-strategic-blue/20 text-strategic-blue';
      default:
        return 'bg-ui-border-soft text-ui-text-muted';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка настроек..." />;
  }

  if (error) {
    return (
      <div className="bg-tension-red/10 border border-tension-red/30 rounded-lg p-6 text-center">
        <p className="text-tension-red mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-tension-red/20 text-tension-red rounded-lg hover:bg-tension-red/30 transition-colors"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-ash-light">Настройки системы</h2>

      {/* API Keys */}
      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
        <h3 className="text-lg font-semibold text-ash-light mb-4">API ключи</h3>
        
        {apiKeys.length > 0 ? (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 bg-obsidian-core rounded-lg border border-ui-border-soft"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{getProviderIcon(key.provider)}</span>
                  <div>
                    <div className="font-medium text-ash-light">{key.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${getProviderColor(key.provider)}`}>
                        {key.provider}
                      </span>
                      <code className="text-xs text-ui-text-muted font-mono">
                        {key.key_masked}
                      </code>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-sage-green/20 text-sage-green rounded text-xs">
                    Настроен
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-ui-text-muted">
            <p className="mb-2">API ключи не настроены</p>
            <p className="text-xs text-ui-text-dim">
              Добавьте ключи в переменные окружения (.env)
            </p>
          </div>
        )}

        <div className="mt-4 p-4 bg-obsidian-core rounded-lg border border-ui-border-soft">
          <p className="text-sm text-ui-text-muted">
            <strong className="text-ash-light">Примечание:</strong> API ключи настраиваются через 
            переменные окружения на сервере. Для изменения обратитесь к DevOps.
          </p>
          <div className="mt-2 text-xs text-ui-text-dim font-mono">
            OPENAI_API_KEY, ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN
          </div>
        </div>
      </div>

      {/* System Status */}
      {settings && (
        <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ash-light mb-4">Статус системы</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LLM */}
            <div className="p-4 bg-obsidian-core rounded-lg border border-ui-border-soft">
              <h4 className="font-medium text-ash-light mb-3">LLM провайдеры</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ui-text-muted">OpenAI</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    settings.llm.openai_configured 
                      ? 'bg-sage-green/20 text-sage-green' 
                      : 'bg-tension-red/20 text-tension-red'
                  }`}>
                    {settings.llm.openai_configured ? 'Настроен' : 'Не настроен'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ui-text-muted">Anthropic</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    settings.llm.anthropic_configured 
                      ? 'bg-sage-green/20 text-sage-green' 
                      : 'bg-tension-red/20 text-tension-red'
                  }`}>
                    {settings.llm.anthropic_configured ? 'Настроен' : 'Не настроен'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ui-text-muted">По умолчанию</span>
                  <span className="text-sm text-ash-light">{settings.llm.default_provider}</span>
                </div>
              </div>
            </div>

            {/* Telegram */}
            <div className="p-4 bg-obsidian-core rounded-lg border border-ui-border-soft">
              <h4 className="font-medium text-ash-light mb-3">Telegram</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ui-text-muted">Bot Token</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    settings.telegram.bot_configured 
                      ? 'bg-sage-green/20 text-sage-green' 
                      : 'bg-tension-red/20 text-tension-red'
                  }`}>
                    {settings.telegram.bot_configured ? 'Настроен' : 'Не настроен'}
                  </span>
                </div>
                {settings.telegram.webhook_url && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ui-text-muted">Webhook</span>
                    <span className="text-xs text-ui-text-dim truncate max-w-[200px]">
                      {settings.telegram.webhook_url}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="p-4 bg-obsidian-core rounded-lg border border-ui-border-soft md:col-span-2">
              <h4 className="font-medium text-ash-light mb-3">Feature Flags</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ui-text-muted">Auto-sync дерева способностей</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  settings.features.tree_auto_sync_disabled 
                    ? 'bg-catalyst-gold/20 text-catalyst-gold' 
                    : 'bg-sage-green/20 text-sage-green'
                }`}>
                  {settings.features.tree_auto_sync_disabled ? 'Отключен' : 'Включен'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
