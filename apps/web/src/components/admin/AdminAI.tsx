'use client';

import { useState, useEffect } from 'react';
import { 
  getPrompts, 
  getConfigSets, 
  getLlmRuns,
  Prompt,
  ConfigSet,
  LlmRun
} from '../../lib/admin-api';
import LoadingSpinner from '../LoadingSpinner';

type ActiveSection = 'prompts' | 'configs' | 'llm-runs';

export function AdminAI() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('prompts');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [configSets, setConfigSets] = useState<ConfigSet[]>([]);
  const [llmRuns, setLlmRuns] = useState<LlmRun[]>([]);
  const [llmRunsTotal, setLlmRunsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [llmStatusFilter, setLlmStatusFilter] = useState<string>('all');
  const [llmPage, setLlmPage] = useState(1);
  const llmLimit = 50;

  useEffect(() => {
    loadData();
  }, [activeSection, llmStatusFilter, llmPage]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeSection === 'prompts') {
        const data = await getPrompts();
        setPrompts(data);
      } else if (activeSection === 'configs') {
        const data = await getConfigSets();
        setConfigSets(data);
      } else if (activeSection === 'llm-runs') {
        const data = await getLlmRuns({
          status: llmStatusFilter !== 'all' ? llmStatusFilter : undefined,
          limit: llmLimit,
          offset: (llmPage - 1) * llmLimit,
        });
        // Ensure runs is always an array
        const runs = Array.isArray(data?.runs) ? data.runs : [];
        setLlmRuns(runs);
        setLlmRunsTotal(typeof data?.total === 'number' ? data.total : 0);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'succeeded':
        return 'bg-sage-green/20 text-sage-green';
      case 'failed':
        return 'bg-tension-red/20 text-tension-red';
      case 'draft':
        return 'bg-catalyst-gold/20 text-catalyst-gold';
      case 'deprecated':
        return 'bg-ui-border-soft text-ui-text-muted';
      default:
        return 'bg-ui-border-soft text-ui-text-muted';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-ash-light mb-6">AI & Pipeline</h2>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'prompts' as const, label: 'Промпты', icon: '📝' },
          { id: 'configs' as const, label: 'Конфигурации', icon: '⚙️' },
          { id: 'llm-runs' as const, label: 'LLM Логи', icon: '🤖' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSection(tab.id);
              setLlmPage(1);
            }}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              activeSection === tab.id
                ? 'bg-system-focus text-white'
                : 'bg-obsidian-core border border-ui-border-soft text-ui-text-muted hover:border-ui-border-strong'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Загрузка..." />
      ) : (
        <>
          {/* Prompts Section */}
          {activeSection === 'prompts' && (
            <div>
              {prompts.length > 0 ? (
                <div className="bg-graphite-structure border border-ui-border-soft rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-obsidian-core">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Назначение</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Версия</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Статус</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Создан</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ui-border-soft">
                      {prompts.map((prompt) => (
                        <tr key={`${prompt.prompt_id}-${prompt.version}`} className="hover:bg-obsidian-core">
                          <td className="px-6 py-4">
                            <div className="font-mono text-sm text-ash-light">{prompt.prompt_id}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-ash-light">{prompt.purpose}</td>
                          <td className="px-6 py-4 text-sm text-ash-light">v{prompt.version}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(prompt.status)}`}>
                              {prompt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-ui-text-muted">
                            {new Date(prompt.created_at).toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedPrompt(prompt)}
                              className="text-strategic-blue hover:text-strategic-blue/80 text-sm"
                            >
                              Просмотр
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-8 text-center">
                  <p className="text-ui-text-muted mb-2">Промпты не найдены</p>
                  <p className="text-xs text-ui-text-dim">
                    Данные появятся после добавления записей в таблицу prompt_registry
                  </p>
                </div>
              )}

              {/* Prompt Detail Modal */}
              {selectedPrompt && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-floating max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-ash-light">{selectedPrompt.prompt_id}</h3>
                          <p className="text-sm text-ui-text-muted mt-1">
                            Версия {selectedPrompt.version} • {selectedPrompt.purpose}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedPrompt(null)}
                          className="text-ui-text-muted hover:text-ash-light text-2xl"
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-ash-light mb-2">Шаблон</h4>
                        <pre className="bg-obsidian-core p-4 rounded text-sm text-ash-light overflow-x-auto whitespace-pre-wrap">
                          {selectedPrompt.template}
                        </pre>
                      </div>

                      {selectedPrompt.schema && (
                        <div>
                          <h4 className="font-semibold text-ash-light mb-2">Ожидаемая схема</h4>
                          <pre className="bg-obsidian-core p-4 rounded text-sm text-ash-light overflow-x-auto">
                            {JSON.stringify(selectedPrompt.schema, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Configs Section */}
          {activeSection === 'configs' && (
            <div>
              {configSets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {configSets.map((config) => (
                    <div
                      key={config.id}
                      className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-ash-light">{config.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(config.status)}`}>
                          {config.status}
                        </span>
                      </div>
                      <p className="text-xs text-ui-text-dim font-mono mb-2">{config.id.slice(0, 8)}...</p>
                      <p className="text-sm text-ui-text-muted">
                        Создан: {new Date(config.created_at).toLocaleDateString('ru-RU')}
                      </p>
                      {config.versions && config.versions.length > 0 && (
                        <p className="text-sm text-ui-text-muted">
                          Версий: {config.versions.length}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-8 text-center">
                  <p className="text-ui-text-muted mb-2">Конфигурации не найдены</p>
                  <p className="text-xs text-ui-text-dim">
                    Данные появятся после добавления записей в таблицу config_sets
                  </p>
                </div>
              )}
            </div>
          )}

          {/* LLM Runs Section */}
          {activeSection === 'llm-runs' && (
            <div>
              {/* Filters */}
              <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4 mb-4">
                <div className="flex gap-4 items-center">
                  <select
                    value={llmStatusFilter}
                    onChange={(e) => {
                      setLlmStatusFilter(e.target.value);
                      setLlmPage(1);
                    }}
                    className="px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-strategic-blue"
                  >
                    <option value="all">Все статусы</option>
                    <option value="succeeded">Успешные</option>
                    <option value="failed">Ошибки</option>
                  </select>
                  <span className="text-sm text-ui-text-muted">
                    Всего: {llmRunsTotal}
                  </span>
                </div>
              </div>

              {llmRuns.length > 0 ? (
                <>
                  <div className="bg-graphite-structure border border-ui-border-soft rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-obsidian-core">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Время</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Этап</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Модель</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Статус</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Токены</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-ui-text-muted uppercase">Время</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ui-border-soft">
                        {llmRuns.map((run) => (
                          <tr key={run.id} className="hover:bg-obsidian-core">
                            <td className="px-6 py-4 text-sm text-ui-text-muted">
                              {new Date(run.created_at).toLocaleString('ru-RU')}
                            </td>
                            <td className="px-6 py-4 text-sm text-ash-light">{run.stage}</td>
                            <td className="px-6 py-4 text-sm text-ash-light">{run.model || '-'}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(run.status)}`}>
                                {run.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-ui-text-muted">
                              {run.tokens_in !== undefined && run.tokens_out !== undefined 
                                ? `${run.tokens_in} → ${run.tokens_out}` 
                                : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-ui-text-muted">
                              {run.latency_ms !== undefined ? `${run.latency_ms}ms` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {llmRunsTotal > llmLimit && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-ui-text-muted">
                        Показано {(llmPage - 1) * llmLimit + 1} - {Math.min(llmPage * llmLimit, llmRunsTotal)} из {llmRunsTotal}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setLlmPage(p => Math.max(1, p - 1))}
                          disabled={llmPage === 1}
                          className="px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg disabled:opacity-50"
                        >
                          Назад
                        </button>
                        <button
                          onClick={() => setLlmPage(p => p + 1)}
                          disabled={llmPage * llmLimit >= llmRunsTotal}
                          className="px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg disabled:opacity-50"
                        >
                          Вперёд
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-8 text-center">
                  <p className="text-ui-text-muted mb-2">LLM логи не найдены</p>
                  <p className="text-xs text-ui-text-dim">
                    Данные появятся после вызовов LLM через pipeline
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Info Panel */}
      <div className="mt-6 bg-graphite-structure border border-ui-border-soft rounded-lg p-6">
        <h3 className="text-lg font-semibold text-ash-light mb-4">Принципы работы</h3>
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
