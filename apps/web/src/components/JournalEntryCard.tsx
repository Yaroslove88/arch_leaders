'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../lib/utils';
import { Icon } from './icons/Icon';
import { analyzeEntry } from '../lib/api';
import { translateNodeName } from '../lib/node-translations';
import { useToast } from './ToastProvider';
import type { JournalRecord } from '../app/traces/page';

interface JournalEntryCardProps {
  record: JournalRecord;
  tree?: any;
  quests?: any[];
  sessions?: any[];
}

/**
 * Визуальный разделитель секции
 */
function SectionDivider({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center gap-2 whitespace-nowrap">
        {icon && <span className="opacity-70">{icon}</span>}
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-ui-text-dim">
          {title}
        </span>
      </div>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-ui-border-soft to-transparent" />
    </div>
  );
}

/**
 * Карточка записи в журнале
 * При клике открывается модальное окно с полным видом
 */
export function JournalEntryCard({ record, tree, quests = [], sessions = [] }: JournalEntryCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Блокируем скролл body когда модалка открыта
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  // Мутация для анализа ситуации
  const analyzeMutation = useMutation({
    mutationFn: (entryId: string) => analyzeEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      toast.showToast('Анализ запущен', 'success');
    },
    onError: () => {
      toast.showToast('Ошибка анализа', 'error');
    },
  });

  // Получаем связанный квест
  const linkedQuest = useMemo(() => {
    if (record.questId) {
      return quests.find((q: any) => q.id === record.questId);
    }
    return null;
  }, [record.questId, quests]);

  // Получаем связанный узел
  const linkedNode = useMemo(() => {
    if (record.nodeId && tree?.nodes) {
      return tree.nodes.find((n: any) => n.node_id === record.nodeId);
    }
    return null;
  }, [record.nodeId, tree]);

  // Получаем рождённые квесты (для ситуаций)
  const bornQuests = useMemo(() => {
    if (record.type === 'entry' && record.session) {
      return quests.filter((q: any) => q.session_id === record.session?.id);
    }
    return [];
  }, [record, quests]);

  // Форматирование даты
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'только что';
    if (diffHours < 24) return `${diffHours}ч назад`;
    if (diffDays < 7) return `${diffDays}д назад`;
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Полная дата для раскрытого вида
  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Получаем иконку по типу
  const getTypeIcon = () => {
    if (record.type === 'entry') return <Icon name="situation" size="md" className="text-strategic-blue" />;
    return <Icon name="reflection" size="md" className="text-sage-green" />;
  };

  // Получаем метку типа
  const getTypeLabel = () => {
    if (record.type === 'entry') return 'Ситуация';
    return 'Рефлексия';
  };

  // Получаем статус квеста
  const getQuestStatus = (status: string) => {
    switch (status) {
      case 'completed': return 'Завершён';
      case 'active': return 'В работе';
      case 'backlog': return 'В бэклоге';
      default: return status;
    }
  };

  // Статус анализа для ситуаций
  const renderAnalysisStatus = () => {
    if (record.type !== 'entry') return null;

    switch (record.analysisStatus) {
      case 'none':
        return (
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-ui-border-soft font-mono">
            <span className="text-ui-text-dim text-[10px] uppercase tracking-wider font-semibold">Анализ не запущен</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (record.entryId) {
                  analyzeMutation.mutate(record.entryId);
                }
              }}
              disabled={analyzeMutation.isPending}
              className="px-2.5 py-1 bg-strategic-blue/20 hover:bg-strategic-blue/30 text-strategic-blue text-[10px] font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50 border border-strategic-blue/30"
            >
              {analyzeMutation.isPending ? 'Запуск...' : 'Начать анализ'}
            </button>
          </div>
        );
      case 'processing':
        return (
          <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-ui-border-soft font-mono">
            <div className="flex items-center justify-between">
              <span className="text-strategic-blue text-[10px] uppercase tracking-wider font-bold animate-pulse flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-strategic-blue animate-ping" />
                ИИ анализирует...
              </span>
              <span className="text-ui-text-dim text-[10px]">60%</span>
            </div>
            <div className="w-full h-1 bg-obsidian-core rounded-full overflow-hidden">
              <div className="h-full bg-strategic-blue animate-pulse rounded-full" style={{ width: '60%' }} />
            </div>
          </div>
        );
      case 'done':
        const insightsCount = record.session?.insights_json?.length || 0;
        const patternsCount = record.session?.patterns?.length || 0;
        const bornQuestsCount = bornQuests.length;

        if (insightsCount === 0 && patternsCount === 0 && bornQuestsCount === 0) {
          return (
            <div className="mt-3 pt-3 border-t border-ui-border-soft flex items-center gap-2 font-mono">
              <span className="text-ui-text-dim text-[10px] uppercase tracking-wider font-semibold">Анализ завершен (пусто)</span>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-ui-border-soft font-mono">
            <div className="flex items-center gap-3">
              {insightsCount > 0 && (
                <div className="flex items-center gap-1" title="Инсайты">
                  <span className="text-[10px]">💡</span>
                  <span className="text-ui-text-muted text-[10px] font-medium">{insightsCount}</span>
                </div>
              )}
              {patternsCount > 0 && (
                <div className="flex items-center gap-1" title="Паттерны">
                  <span className="text-[10px]">🔍</span>
                  <span className="text-ui-text-muted text-[10px] font-medium">{patternsCount}</span>
                </div>
              )}
              {bornQuestsCount > 0 && (
                <div className="flex items-center gap-1" title="Квесты">
                  <span className="text-[10px]">⚔️</span>
                  <span className="text-strategic-blue text-[10px] font-bold">{bornQuestsCount}</span>
                </div>
              )}
              <span className="ml-auto text-sage-green text-[10px] uppercase tracking-wider font-bold">Готово</span>
            </div>
            {bornQuestsCount > 0 && (
              <div className="text-[9px] text-strategic-blue/80 font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                <Icon name="quest" size="sm" />
                <span>Запущен синтез уникального квеста</span>
              </div>
            )}
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-ui-border-soft font-mono">
            <span className="text-tension-red text-[10px] uppercase tracking-wider font-bold">Ошибка анализа</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (record.entryId) {
                  analyzeMutation.mutate(record.entryId);
                }
              }}
              disabled={analyzeMutation.isPending}
              className="px-2.5 py-1 bg-tension-red/10 hover:bg-tension-red/20 text-tension-red text-[10px] font-bold uppercase tracking-wider rounded transition-colors border border-tension-red/20"
            >
              Повторить
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  // Компактный вид (карточка в списке)
  const renderCompact = () => {
    const isSituation = record.type === 'entry';
    const isReflection = record.type === 'evidence';

    return (
      <div
        className={cn(
          "relative bg-graphite-structure border rounded-xl p-4 cursor-pointer transition-all duration-200 group overflow-hidden",
          "hover:shadow-floating hover:translate-y-[-2px]",
          isSituation ? "border-ui-border-soft hover:border-strategic-blue/40" : "border-ui-border-soft hover:border-sage-green/40"
        )}
        onClick={() => setIsModalOpen(true)}
      >
        {/* Декоративная полоса сбоку */}
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1",
            isSituation ? "bg-strategic-blue/30 group-hover:bg-strategic-blue" : "bg-sage-green/30 group-hover:bg-sage-green"
          )} 
        />

        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-[0.1em]",
              isSituation ? "text-strategic-blue" : "text-sage-green"
            )}>
              {getTypeLabel()}
            </span>
          </div>
          <span className="text-[10px] font-medium text-ui-text-dim uppercase tracking-wider">
            {formatDate(record.created_at)}
          </span>
        </div>

        <p className="text-sm text-ash-light line-clamp-2 leading-relaxed mb-3">
          {record.text}
        </p>

        {/* Инсайт-превью для ситуаций */}
        {isSituation && record.analysisStatus === 'done' && (
          <div className="space-y-2 mb-3">
            {(record.session?.insights_json?.[0] || record.session?.summary) && (
              <div className="p-2.5 bg-obsidian-core/50 rounded-lg border-l-2 border-sage-green/40">
                <p className="text-[11px] text-ui-text-muted italic line-clamp-1">
                  «{(record.session.insights_json?.[0]?.description || record.session.insights_json?.[0]?.text || record.session.summary).substring(0, 100)}...»
                </p>
              </div>
            )}
            
            {/* Маленькие теги проявленных способностей */}
            {record.session?.ability_signals_json && (record.session.ability_signals_json as any[]).length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-1">
                {(record.session.ability_signals_json as any[]).slice(0, 3).map((signal, i) => {
                  const node = tree?.nodes?.find((n: any) => n.node_id === signal.node_id);
                  return (
                    <div key={i} className="px-1.5 py-0.5 bg-sage-green/5 border border-sage-green/20 rounded text-[9px] text-sage-green font-bold flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-sage-green" />
                      {node ? translateNodeName(node.name) : signal.node_id}
                    </div>
                  );
                })}
                {(record.session.ability_signals_json as any[]).length > 3 && (
                  <span className="text-[9px] text-ui-text-dim font-bold">+{ (record.session.ability_signals_json as any[]).length - 3 }</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Для рефлексий — показываем источник и узел */}
        {isReflection && (linkedQuest || linkedNode) && (
          <div className="flex flex-col gap-2 mt-3 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              {linkedQuest && (
                <div className="px-2 py-1 bg-strategic-blue/10 border border-strategic-blue/20 rounded-md flex items-center gap-1.5">
                  <span className="text-[10px]">🎯</span>
                  <span className="text-[10px] font-semibold text-ash-light truncate max-w-[120px]">
                    {linkedQuest.title}
                  </span>
                </div>
              )}
              {linkedNode && (
                <div className="px-2 py-1 bg-sage-green/10 border border-sage-green/20 rounded-md flex items-center gap-1.5">
                  <span className="text-[10px]">🌳</span>
                  <span className="text-[10px] font-semibold text-ash-light truncate max-w-[120px]">
                    {translateNodeName(linkedNode.name || record.nodeId)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-sage-green font-bold uppercase tracking-wider ml-1">
              <span className="animate-pulse">⚡</span>
              <span>
                Что дало: +10 XP {linkedNode ? `к "${translateNodeName(linkedNode.name)}"` : 'к способности'}
              </span>
            </div>
          </div>
        )}

        {/* Статус анализа для ситуаций */}
        {renderAnalysisStatus()}
      </div>
    );
  };

  // Модальное окно с полным видом
  const renderModal = () => {
    const isSituation = record.type === 'entry';
    const isReflection = record.type === 'evidence';

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-core/80 backdrop-blur-md transition-all"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsModalOpen(false);
        }}
      >
        <div 
          className="bg-graphite-structure border border-ui-border-soft rounded-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col shadow-floating"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          <div className="p-6 border-b border-ui-border-soft flex items-center justify-between bg-graphite-structure/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl",
                isSituation ? "bg-strategic-blue/10 text-strategic-blue" : "bg-sage-green/10 text-sage-green"
              )}>
                {isSituation ? <Icon name="situation" size="xl" /> : <Icon name="reflection" size="xl" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-ash-light text-xl tracking-tight">
                    {getTypeLabel()}
                  </h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                    isSituation ? "bg-strategic-blue/20 text-strategic-blue" : "bg-sage-green/20 text-sage-green"
                  )}>
                    ID: {record.id.split('-')[1].substring(0, 6)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-ui-text-dim text-xs font-medium uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-ui-border-strong" />
                  {formatFullDate(record.created_at)}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-ui-text-muted hover:text-ash-light p-2.5 transition-all hover:bg-obsidian-core rounded-xl border border-transparent hover:border-ui-border-soft"
              aria-label="Закрыть"
            >
              <span className="text-xl leading-none">✕</span>
            </button>
          </div>

          {/* Контент */}
          <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Текст записи */}
            <section className="space-y-3">
              <SectionDivider title="Первичные данные" icon={<Icon name="trace" size="sm" />} />
              <div className="bg-obsidian-core rounded-xl p-5 border border-ui-border-soft shadow-inner relative group">
                <div className={cn(
                  "absolute left-0 top-4 bottom-4 w-1 rounded-full opacity-50 transition-opacity group-hover:opacity-100",
                  isSituation ? "bg-strategic-blue" : "bg-sage-green"
                )} />
                <p className="text-ash-light text-lg italic leading-relaxed font-medium pl-2">
                  «{record.text}»
                </p>
              </div>
            </section>

            {/* ===== ДЛЯ РЕФЛЕКСИЙ ===== */}
            {isReflection && (
              <section className="space-y-4">
                {(linkedQuest || linkedNode) ? (
                  <>
                    <SectionDivider title="Контекст и влияние" icon={<Icon name="analysis" size="sm" />} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {linkedQuest && (
                        <Link
                          href={`/quests/${linkedQuest.id}`}
                          className="flex items-start gap-4 p-4 bg-obsidian-core/40 border border-ui-border-soft rounded-xl hover:border-strategic-blue/40 transition-all group"
                        >
                          <div className="p-2.5 bg-strategic-blue/10 rounded-lg text-strategic-blue group-hover:scale-110 transition-transform">
                            <Icon name="quest" size="lg" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-strategic-blue uppercase tracking-widest mb-1">Квест</p>
                            <h4 className="text-sm font-semibold text-ash-light group-hover:text-strategic-blue transition-colors line-clamp-2">
                              {linkedQuest.title}
                            </h4>
                            <p className="text-[10px] text-ui-text-dim mt-1 uppercase">
                              {getQuestStatus(linkedQuest.status)}
                            </p>
                          </div>
                        </Link>
                      )}

                      {linkedNode && (
                        <button
                          onClick={() => {
                            const params = new URLSearchParams();
                            params.set('tab', 'tree');
                            if (linkedNode.branch_id) {
                              params.set('branch', linkedNode.branch_id);
                            }
                            params.set('node', linkedNode.node_id);
                            router.push(`/architecture?${params.toString()}`);
                          }}
                          className="flex items-start gap-4 p-4 bg-obsidian-core/40 border border-ui-border-soft rounded-xl hover:border-sage-green/40 transition-all group text-left"
                        >
                          <div className="p-2.5 bg-sage-green/10 rounded-lg text-sage-green group-hover:scale-110 transition-transform">
                            <Icon name="tree" size="lg" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-sage-green uppercase tracking-widest mb-1">Способность</p>
                            <h4 className="text-sm font-semibold text-ash-light group-hover:text-sage-green transition-colors truncate">
                              {translateNodeName(linkedNode.name || record.nodeId)}
                            </h4>
                            <p className="text-[10px] text-ui-text-dim mt-1 uppercase">
                              Связано с развитием
                            </p>
                          </div>
                        </button>
                      )}
                    </div>
                    {/* Явное указание на то, что дала рефлексия */}
                    <div className="p-4 bg-sage-green/5 border border-sage-green/20 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sage-green/10 rounded-full flex items-center justify-center text-sage-green shadow-glow-green relative">
                          <span className="text-xl relative z-10">⚡</span>
                          <span className="absolute inset-0 bg-sage-green/20 rounded-full animate-ping opacity-20" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-ash-light tracking-tight">
                            Опыт зачислен {linkedNode ? `в "${translateNodeName(linkedNode.name)}"` : 'в систему'}
                          </p>
                          <p className="text-[10px] text-ui-text-muted font-medium uppercase tracking-wider">
                            {linkedNode && tree?.branches?.find((b: any) => b.branch_id === linkedNode.branch_id)?.name || 'Общий прогресс'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-sage-green tracking-tighter drop-shadow-sm">+10 XP</span>
                        <p className="text-[9px] text-ui-text-dim uppercase font-black tracking-widest mt-0.5">Progress</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 bg-obsidian-core/30 border border-dashed border-ui-border-soft rounded-xl text-center">
                    <p className="text-sm text-ui-text-dim font-medium italic">
                      Свободная заметка без привязки к квесту или способности
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* ===== ДЛЯ СИТУАЦИЙ ===== */}
            {isSituation && (
              <section className="space-y-6">
                <SectionDivider title="Системный анализ" icon={<Icon name="analysis" size="sm" />} />
                
                {record.analysisStatus === 'done' && record.session ? (
                  <div className="space-y-6">
                    {/* Инсайты */}
                    {(record.session.insights_json?.length > 0 || record.session.summary) && (
                      <div className="bg-sage-green/5 border border-sage-green/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Icon name="analysis" size="2xl" />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xl">💡</span>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-sage-green">Ключевой инсайт</h4>
                        </div>
                        <p className="text-ash-light text-base leading-relaxed relative z-10">
                          {record.session.insights_json[0]?.description || 
                           record.session.insights_json[0]?.text ||
                           record.session.summary}
                        </p>
                      </div>
                    )}

                    {/* Паттерны */}
                    {record.session.patterns && record.session.patterns.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🔍</span>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-ui-text-dim">Выявленные паттерны</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {record.session.patterns.map((pattern: string, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-obsidian-core/40 border border-ui-border-soft rounded-xl">
                              <span className="text-strategic-blue p-1.5 bg-strategic-blue/10 rounded-lg">
                                <Icon name="analysis" size="sm" />
                              </span>
                              <span className="text-xs font-medium text-ash-light leading-snug">{pattern}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Проявленные способности (Ability Signals) */}
                    {record.session.ability_signals_json && (record.session.ability_signals_json as any[]).length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🌳</span>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-sage-green">Анализ проявления способностей</h4>
                        </div>
                        <div className="space-y-2">
                          {(record.session.ability_signals_json as any[]).map((signal, i) => {
                            const node = tree?.nodes?.find((n: any) => n.node_id === signal.node_id);
                            const branch = tree?.branches?.find((b: any) => b.branch_id === node?.branch_id);
                            
                            // Определяем "вайб" сигнала
                            const lowercase = signal.signal.toLowerCase();
                            const isSuppressed = lowercase.includes('подавл') || 
                                               lowercase.includes('не проявл') || 
                                               lowercase.includes('отсутств') || 
                                               lowercase.includes('недостат') ||
                                               lowercase.includes('избега');
                            
                            return (
                              <div key={i} className={cn(
                                "p-4 border rounded-xl flex items-start gap-4 transition-all hover:shadow-md",
                                isSuppressed 
                                  ? "bg-tension-red/5 border-tension-red/10 group/signal" 
                                  : "bg-sage-green/5 border-sage-green/10 group/signal"
                              )}>
                                <div className={cn(
                                  "p-2 rounded-lg shrink-0 transition-transform group-hover/signal:scale-110",
                                  isSuppressed ? "bg-tension-red/10 text-tension-red" : "bg-sage-green/10 text-sage-green"
                                )}>
                                  <Icon name={isSuppressed ? "analysis" : "tree"} size="md" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-ash-light">
                                        {node ? translateNodeName(node.name) : signal.node_id}
                                      </span>
                                      {branch && (
                                        <span className="text-[10px] text-ui-text-dim font-medium uppercase tracking-wider bg-obsidian-core/50 px-1.5 py-0.5 rounded">
                                          {branch.name}
                                        </span>
                                      )}
                                    </div>
                                    <span className={cn(
                                      "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter",
                                      isSuppressed ? "bg-tension-red/20 text-tension-red" : "bg-sage-green/20 text-sage-green"
                                    )}>
                                      {isSuppressed ? 'Подавлено' : 'Проявлено'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-ui-text-muted leading-relaxed italic pr-2">
                                    «{signal.signal}»
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Процесс создания квеста (если есть квесты) */}
                    {bornQuests.length > 0 && (
                      <div className="p-6 bg-strategic-blue/10 border border-strategic-blue/20 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-all duration-700">
                          <Icon name="quest" size="2xl" className="scale-[3]" />
                        </div>
                        
                        <div className="relative z-10 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-strategic-blue/20 rounded-full flex items-center justify-center text-strategic-blue shadow-glow-blue animate-pulse">
                              <Icon name="quest" size="lg" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-strategic-blue">Синтез развития</h4>
                              <p className="text-sm font-bold text-ash-light">Созданы уникальные задания</p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-ui-text-muted leading-relaxed max-w-md">
                            На основе анализа вашей ситуации система сгенерировала персонализированные квесты. 
                            Они направлены на проработку выявленных паттернов и усиление способностей.
                          </p>
                          
                          <div className="grid grid-cols-1 gap-3 pt-2">
                            {bornQuests.map((quest: any) => (
                              <Link
                                key={quest.id}
                                href={`/quests/${quest.id}`}
                                className="flex items-center gap-4 p-4 bg-obsidian-core/60 border border-ui-border-soft rounded-xl hover:border-strategic-blue/50 transition-all group/q"
                              >
                                <div className="p-3 bg-strategic-blue/10 rounded-xl text-strategic-blue group-hover/q:scale-110 transition-transform">
                                  <Icon name="quest" size="lg" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-ash-light mb-1 group-hover/q:text-strategic-blue transition-colors">
                                    {quest.title}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-ui-text-dim uppercase font-bold tracking-widest bg-ui-border-soft px-1.5 py-0.5 rounded">
                                      Unique
                                    </span>
                                    <p className="text-[11px] text-ui-text-dim line-clamp-1 italic italic">
                                      {quest.description}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-ui-text-dim group-hover/q:text-strategic-blue transition-all translate-x-0 group-hover/q:translate-x-1">
                                  <span className="text-xl">→</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-10 bg-obsidian-core/30 border border-dashed border-ui-border-soft rounded-2xl flex flex-col items-center justify-center text-center gap-4">
                    {record.analysisStatus === 'processing' ? (
                      <>
                        <div className="w-12 h-12 border-4 border-strategic-blue/20 border-t-strategic-blue rounded-full animate-spin" />
                        <p className="text-sm font-medium text-ui-text-muted animate-pulse">
                          Процессор ИИ анализирует ваши данные...
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-ui-border-soft rounded-2xl">
                          <Icon name="analysis" size="xl" className="text-ui-text-dim" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-ash-light">Анализ еще не проведен</p>
                          <p className="text-xs text-ui-text-dim max-w-[280px]">
                            Запустите анализ, чтобы извлечь инсайты, паттерны и получить новые задания для развития.
                          </p>
                        </div>
                        <button
                          onClick={() => record.entryId && analyzeMutation.mutate(record.entryId)}
                          disabled={analyzeMutation.isPending}
                          className="mt-2 px-6 py-2.5 bg-strategic-blue hover:bg-strategic-blue/90 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-strategic-blue/20 disabled:opacity-50"
                        >
                          {analyzeMutation.isPending ? 'Запуск...' : 'Анализировать'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderCompact()}
      {isModalOpen && renderModal()}
    </>
  );
}
