'use client';

export function AdminAI() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ui-text-main mb-6">AI & Pipeline</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ui-text-main mb-4">Промпты</h3>
          <p className="text-ui-text-muted text-sm mb-4">
            Управление версиями промптов для LLM
          </p>
          <button className="px-4 py-2 bg-bg-secondary border border-ui-border-soft rounded-lg hover:border-ui-border-strong transition-colors">
            Просмотр промптов
          </button>
        </div>

        <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ui-text-main mb-4">Конфигурации</h3>
          <p className="text-ui-text-muted text-sm mb-4">
            Управление наборами конфигураций и их версиями
          </p>
          <button className="px-4 py-2 bg-bg-secondary border border-ui-border-soft rounded-lg hover:border-ui-border-strong transition-colors">
            Просмотр конфигов
          </button>
        </div>

        <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ui-text-main mb-4">LLM Runs</h3>
          <p className="text-ui-text-muted text-sm mb-4">
            Трассировка вызовов LLM для отладки
          </p>
          <button className="px-4 py-2 bg-bg-secondary border border-ui-border-soft rounded-lg hover:border-ui-border-strong transition-colors">
            Просмотр логов
          </button>
        </div>

        <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ui-text-main mb-4">Версионирование</h3>
          <p className="text-ui-text-muted text-sm mb-4">
            Все изменения промптов и конфигов версионируются
          </p>
          <div className="text-xs text-ui-text-dim">
            • Промпты: версии хранятся в prompt_registry<br/>
            • Конфиги: версии хранятся в config_versions<br/>
            • Активация требует reason и логируется в audit
          </div>
        </div>
      </div>

      <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
        <h3 className="text-lg font-semibold text-ui-text-main mb-4">Принципы работы</h3>
        <ul className="space-y-2 text-sm text-ui-text-muted">
          <li>• Все промпты и конфиги версионируются - никаких &laquo;затираний&raquo;</li>
          <li>• Активация новой версии требует указания причины</li>
          <li>• Все действия логируются в audit_log</li>
          <li>• LLM runs трассируются для отладки и оптимизации</li>
        </ul>
      </div>
    </div>
  );
}

