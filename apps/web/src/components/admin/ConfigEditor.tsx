'use client';

import { useState, useEffect } from 'react';
import { 
  getConfigSets, 
  getConfigVersions, 
  createConfigVersion, 
  activateConfigVersion,
  ConfigSet, 
  ConfigVersion 
} from '../../lib/admin-api';
import { JsonEditor } from './PromptEditor';
import LoadingSpinner from '../LoadingSpinner';

interface ConfigEditorProps {
  configSet: ConfigSet;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConfigEditor({ configSet, onClose, onSuccess }: ConfigEditorProps) {
  const [versions, setVersions] = useState<ConfigVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<ConfigVersion | null>(null);
  const [mode, setMode] = useState<'view' | 'create' | 'activate'>('view');
  const [payload, setPayload] = useState('{}');
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [configSet.id]);

  async function loadVersions() {
    setLoading(true);
    try {
      const data = await getConfigVersions(configSet.id);
      setVersions(data);
      if (data.length > 0) {
        const active = data.find(v => v.activated_at) || data[0];
        setSelectedVersion(active);
        setPayload(JSON.stringify(active.payload, null, 2));
      }
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить версии');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateVersion(e: React.FormEvent) {
    e.preventDefault();
    
    let parsedPayload: Record<string, unknown>;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      setError('Некорректный JSON');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createConfigVersion(configSet.id, {
        payload: parsedPayload,
        comment: comment.trim() || undefined,
      });
      await loadVersions();
      setMode('view');
      setComment('');
    } catch (err: any) {
      setError(err.message || 'Не удалось создать версию');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVersion || !reason.trim()) {
      setError('Выберите версию и укажите причину');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await activateConfigVersion(configSet.id, selectedVersion.version, reason.trim());
      await loadVersions();
      setMode('view');
      setReason('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Не удалось активировать версию');
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusColor = (version: ConfigVersion) => {
    if (version.activated_at) {
      return 'bg-sage-green/20 text-sage-green';
    }
    return 'bg-ui-border-soft text-ui-text-muted';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <LoadingSpinner text="Загрузка конфигурации..." />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-graphite-structure border border-ui-border-soft rounded-lg shadow-floating max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-ui-border-soft flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-ash-light">{configSet.name}</h3>
              <p className="text-sm text-ui-text-muted mt-1 font-mono">{configSet.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-ui-text-muted hover:text-ash-light text-2xl leading-none"
            >
              ×
            </button>
          </div>
          
          {/* Mode tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setMode('view')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                mode === 'view'
                  ? 'bg-strategic-blue/20 text-strategic-blue'
                  : 'bg-obsidian-core text-ui-text-muted hover:text-ash-light'
              }`}
            >
              Просмотр
            </button>
            <button
              onClick={() => setMode('create')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                mode === 'create'
                  ? 'bg-catalyst-gold/20 text-catalyst-gold'
                  : 'bg-obsidian-core text-ui-text-muted hover:text-ash-light'
              }`}
            >
              Новая версия
            </button>
            {selectedVersion && !selectedVersion.activated_at && (
              <button
                onClick={() => setMode('activate')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  mode === 'activate'
                    ? 'bg-sage-green/20 text-sage-green'
                    : 'bg-obsidian-core text-ui-text-muted hover:text-ash-light'
                }`}
              >
                Активировать
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Versions list */}
          <div className="w-64 border-r border-ui-border-soft overflow-y-auto p-4">
            <h4 className="text-sm font-medium text-ui-text-muted mb-3">Версии</h4>
            <div className="space-y-2">
              {versions.map((version) => (
                <button
                  key={version.id}
                  onClick={() => {
                    setSelectedVersion(version);
                    setPayload(JSON.stringify(version.payload, null, 2));
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedVersion?.id === version.id
                      ? 'border-strategic-blue bg-strategic-blue/10'
                      : 'border-ui-border-soft hover:border-ui-border-strong bg-obsidian-core'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-ash-light">v{version.version}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(version)}`}>
                      {version.activated_at ? 'Active' : 'Draft'}
                    </span>
                  </div>
                  {version.comment && (
                    <p className="text-xs text-ui-text-muted truncate">{version.comment}</p>
                  )}
                  <p className="text-xs text-ui-text-dim mt-1">
                    {new Date(version.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </button>
              ))}
              {versions.length === 0 && (
                <p className="text-sm text-ui-text-muted text-center py-4">
                  Нет версий
                </p>
              )}
            </div>
          </div>

          {/* Editor area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-tension-red/10 border border-tension-red/30 rounded-lg text-sm text-tension-red">
                {error}
              </div>
            )}

            {mode === 'view' && selectedVersion && (
              <div>
                <h4 className="text-sm font-medium text-ash-light mb-2">Payload (только чтение)</h4>
                <JsonEditor
                  value={payload}
                  onChange={() => {}}
                  height="400px"
                  readOnly
                />
              </div>
            )}

            {mode === 'create' && (
              <form onSubmit={handleCreateVersion}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-ash-light mb-2">
                    Payload (JSON)
                  </label>
                  <JsonEditor
                    value={payload}
                    onChange={setPayload}
                    height="350px"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-ash-light mb-1">
                    Комментарий
                    <span className="text-ui-text-muted font-normal ml-1">(опционально)</span>
                  </label>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Что изменено в этой версии..."
                    className="w-full px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-catalyst-gold hover:bg-catalyst-gold/80 text-black rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Создание...' : 'Создать версию'}
                </button>
              </form>
            )}

            {mode === 'activate' && selectedVersion && (
              <form onSubmit={handleActivate}>
                <div className="bg-obsidian-core border border-ui-border-soft rounded-lg p-4 mb-4">
                  <div className="text-sm text-ui-text-muted mb-1">Версия для активации</div>
                  <div className="font-medium text-ash-light">v{selectedVersion.version}</div>
                  {selectedVersion.comment && (
                    <p className="text-sm text-ui-text-muted mt-2">{selectedVersion.comment}</p>
                  )}
                </div>

                <div className="bg-catalyst-gold/10 border border-catalyst-gold/30 rounded-lg p-4 mb-4 text-sm text-catalyst-gold">
                  <strong>Внимание:</strong> Активация этой версии сделает её основной для всех пользователей.
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-ash-light mb-1">
                    Причина активации <span className="text-tension-red">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Например: Обновлены параметры LLM..."
                    rows={3}
                    className="w-full px-4 py-2 bg-obsidian-core border border-ui-border-soft rounded-lg text-ash-light placeholder-ui-text-dim focus:outline-none focus:ring-2 focus:ring-strategic-blue resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !reason.trim()}
                  className="px-4 py-2 bg-sage-green hover:bg-sage-green/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Активация...' : 'Активировать'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
