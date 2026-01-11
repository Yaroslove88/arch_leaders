'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCase, InteractiveCase, markCaseAsSolved, getCaseProgress, getNodeDescriptions, recordActivity, recordCaseChoice } from '@/lib/api';
import { getNodeName } from '@/lib/node-translations';
import { translateSkill } from '@/lib/translations/skills';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ReflectionModal } from '@/components/modals';

// Сложность
function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const dots = difficulty === 'basic' ? 1 : difficulty === 'intermediate' ? 2 : 3;
  const label = difficulty === 'basic' ? 'Базовый' : difficulty === 'intermediate' ? 'Средний' : 'Сложный';
  
  return (
    <span className="flex items-center gap-1 text-xs text-ui-text-main">
      <span>{label}</span>
      <span className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= dots ? 'bg-strategic-blue' : 'bg-ui-border-soft'}`} />
        ))}
      </span>
    </span>
  );
}

export default function CasePage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  const [case_, setCase] = useState<InteractiveCase | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [choiceRecorded, setChoiceRecorded] = useState(false);
  const [exploringOption, setExploringOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSolved, setIsSolved] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [showStuckHelp, setShowStuckHelp] = useState(false);

  const { data: nodeDescriptionsData } = useQuery({
    queryKey: ['nodeDescriptions'],
    queryFn: getNodeDescriptions,
    retry: 2,
  });
  
  const nodeDescriptions = nodeDescriptionsData?.descriptions || {};

  useEffect(() => {
    if (params.id) {
      loadCase(params.id as string);
      checkIfSolved(params.id as string);
    }
  }, [params.id]);

  async function loadCase(id: string) {
    setLoading(true);
    try {
      const data = await getCase(id);
      setCase(data);
    } catch (error) {
      console.error('Failed to load case:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleOptionSelect(optionId: string) {
    if (!choiceRecorded && case_) {
      // First choice - record it locally
      setSelectedOption(optionId);
      setChoiceRecorded(true);
      setExploringOption(optionId);
      
      // Record that choice was made (for analytics)
      if (userId) {
        recordCaseChoice(userId, case_.id).catch(console.error);
      }
    } else {
      // After recording - just view different option
      setExploringOption(optionId);
    }
  }

  async function checkIfSolved(caseId: string) {
    try {
      // Get progress from API (single source of truth - database)
      const apiProgress = await getCaseProgress();
      if (apiProgress.solvedCases.includes(caseId)) {
        setIsSolved(true);
      }
    } catch (error) {
      console.error('Failed to check if case is solved:', error);
    }
  }

  async function handleMarkAsSolved() {
    if (!case_ || isMarking) return;
    
    setIsMarking(true);
    try {
      // Mark case as solved via API - this saves to database and awards XP
      const optionData = selectedOption ? case_.options.find(opt => opt.id === selectedOption) : null;
      await markCaseAsSolved(case_.id, selectedOption || undefined, optionData?.skill_used);
      setIsSolved(true);
      
      // Record activity for analytics
      if (userId) {
        await recordActivity(userId, 'case').catch(console.error);
      }
      
      toast.showToast('Кейс отмечен как решённый', 'success');
    } catch (error) {
      toast.showToast('Ошибка при сохранении', 'error');
    } finally {
      setIsMarking(false);
    }
  }

  // Парсинг контекста для structured storytelling
  function parseContext(context: string) {
    const lines = context.split('\n').filter(line => line.trim());
    const sections: {
      hook?: string; // Первое драматичное предложение
      company?: string;
      project?: string;
      situation?: string;
      data?: string[]; // Структурированные данные
      history?: string;
      systemContext?: string;
      dilemma?: string; // Дилемма в конце
      other?: string[];
    } = {};
    
    const otherLines: string[] = [];
    const dataLines: string[] = [];
    let currentSection: 'hook' | 'context' | 'data' | 'history' | 'dilemma' | null = null;
    let hookFound = false;
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // Определяем крючок - первое предложение с драматичным содержанием или короткое
      if (index === 0 && !hookFound) {
        // Если первая строка короткая или содержит драматичные слова - это крючок
        if (trimmed.length < 200 || trimmed.includes('!') || trimmed.includes('упала') || trimmed.includes('кризис') || trimmed.includes('угрожает') || trimmed.includes('жалуется')) {
          sections.hook = trimmed;
          hookFound = true;
          return;
        }
      }
      
      // Парсинг секций
      if (trimmed.startsWith('Компания:') || trimmed.match(/^Компания\s*:/i)) {
        sections.company = trimmed.replace(/^Компания\s*:\s*/i, '').trim();
        currentSection = 'context';
      } else if (trimmed.startsWith('Проект:') || trimmed.match(/^Проект\s*:/i)) {
        sections.project = trimmed.replace(/^Проект\s*:\s*/i, '').trim();
        currentSection = 'context';
      } else if (trimmed.startsWith('Ситуация:') || trimmed.match(/^Ситуация\s*:/i) || trimmed.startsWith('Текущая ситуация:') || trimmed.match(/^Текущая ситуация\s*:/i)) {
        sections.situation = trimmed.replace(/^(Ситуация|Текущая ситуация)\s*:\s*/i, '').trim();
        currentSection = 'context';
      } else if (trimmed.startsWith('Проблема:') || trimmed.match(/^Проблема\s*:/i)) {
        // Проблема может быть частью контекста или крючком
        const problemText = trimmed.replace(/^Проблема\s*:\s*/i, '').trim();
        if (!sections.hook && problemText.length < 200) {
          sections.hook = problemText;
          hookFound = true;
        } else {
          otherLines.push(trimmed);
        }
        currentSection = 'context';
      } else if (trimmed.startsWith('Данные:') || trimmed.startsWith('📊') || trimmed.startsWith('•') || trimmed.match(/^\d+\./)) {
        currentSection = 'data';
        const dataText = trimmed.replace(/^(Данные:|📊|\•|\d+\.)\s*/, '').trim();
        if (dataText) dataLines.push(dataText);
      } else if (trimmed.startsWith('История:') || trimmed.match(/^История\s*:/i)) {
        sections.history = trimmed.replace(/^История\s*:\s*/i, '').trim();
        currentSection = 'history';
      } else if (trimmed.startsWith('Системный контекст:') || trimmed.match(/^Системный контекст\s*:/i)) {
        sections.systemContext = trimmed.replace(/^Системный контекст\s*:\s*/i, '').trim();
        currentSection = 'history';
      } else if (trimmed.startsWith('Дилемма:') || trimmed.startsWith('⚠️ ДИЛЕММА') || trimmed.startsWith('⚡ ДИЛЕММА') || trimmed.match(/^Дилемма\s*:/i)) {
        sections.dilemma = trimmed.replace(/^(Дилемма:|⚠️ ДИЛЕММА|⚡ ДИЛЕММА)\s*/i, '').trim();
        currentSection = 'dilemma';
      } else if (trimmed.startsWith('Контекст задачи:') || trimmed.startsWith('Варианты решения:') || trimmed.startsWith('Риски:')) {
        otherLines.push(trimmed);
      } else {
        // Если мы в секции данных, добавляем туда
        if (currentSection === 'data' && (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.match(/^\d+\./))) {
          dataLines.push(trimmed.replace(/^[•\-\d+\.]\s*/, '').trim());
        } else if (currentSection === 'dilemma' && sections.dilemma) {
          sections.dilemma += ' ' + trimmed;
        } else if (currentSection === 'history' && sections.history) {
          sections.history += ' ' + trimmed;
        } else if (currentSection === 'history' && sections.systemContext) {
          sections.systemContext += ' ' + trimmed;
        } else {
          otherLines.push(trimmed);
        }
      }
    });
    
    sections.data = dataLines.length > 0 ? dataLines : undefined;
    sections.other = otherLines;
    
    // Если крючок не найден, но есть ситуация, используем её как крючок
    if (!sections.hook && sections.situation) {
      const situationLines = sections.situation.split(/[.!?]/).filter(s => s.trim().length > 20);
      if (situationLines.length > 0) {
        sections.hook = situationLines[0].trim() + (situationLines[0].includes('!') ? '' : '.');
      }
    }
    
    // Если крючок не найден, но первая строка короткая - используем её
    if (!sections.hook && lines.length > 0 && lines[0].trim().length < 200) {
      sections.hook = lines[0].trim();
    }
    
    return sections;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-obsidian-core p-4 md:p-8">
        <div className="max-w-3xl mx-auto text-center text-ui-text-main">Загрузка...</div>
      </main>
    );
  }

  if (!case_ || !case_.options?.length) {
    return (
      <main className="min-h-screen bg-obsidian-core p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="text-system-focus mb-4">← Назад</button>
          <div className="bg-graphite-structure border border-ui-border-soft rounded-lg p-6 text-center">
            <p className="text-ui-text-main">Кейс не найден или в разработке</p>
          </div>
        </div>
      </main>
    );
  }

  const currentOptionData = case_.options.find((opt) => opt.id === (exploringOption || selectedOption));
  const isAdvanced = case_.difficulty === 'advanced' || case_.difficulty === 'intermediate';

  return (
    <main className="min-h-screen bg-obsidian-core p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Навигация */}
        <button onClick={() => router.push('/experiments?tab=cases')} className="text-sm text-system-focus hover:underline mb-4">
          ← Назад к кейсам
        </button>

        {/* Заголовок */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">📊</span>
            <h1 className="text-xl font-bold text-ui-text-main">{case_.title}</h1>
          </div>
          {/* Подзаголовок из portal.subtitle */}
          {case_.portal?.subtitle && (
            <p className="text-sm text-ui-text-muted mb-2">{case_.portal.subtitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {/* Strategic Tags */}
            {case_.strategic_tags && case_.strategic_tags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-strategic-blue/20 text-strategic-blue rounded-lg text-xs">
                {tag}
              </span>
            ))}
            {/* Node name */}
            {case_.node_id && (
              <span className="px-2 py-0.5 bg-obsidian-core text-ash-light rounded-lg">
                🏷️ {getNodeName(case_.node_id, nodeDescriptions)}
              </span>
            )}
            <DifficultyBadge difficulty={case_.difficulty} />
            {/* Pressure level indicator */}
            {case_.pressure_level && (
              <span className={`px-2 py-0.5 rounded-lg text-xs ${
                case_.pressure_level === 'высокое' ? 'bg-tension-red/20 text-tension-red' :
                case_.pressure_level === 'среднее' ? 'bg-catalyst-gold/20 text-catalyst-gold' :
                'bg-sage-green/20 text-sage-green'
              }`}>
                Давление: {case_.pressure_level}
              </span>
            )}
          </div>
        </div>

        {/* Контекст */}
        {!choiceRecorded ? (
          <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-4 md:p-5 mb-4">
            {/* Новая структурированная версия с fallback на старый парсинг */}
            {(() => {
              // Определяем источник данных - новая структура или парсинг context
              const hasNewStructure = case_.event?.summary || case_.space_map || case_.dilemma?.question;
              const parsed = hasNewStructure ? null : parseContext(case_.context);

              // Получаем данные из новой структуры или парсинга
              const hook = case_.event?.summary || parsed?.hook;
              const company = case_.space_map?.company || parsed?.company;
              const environment = case_.space_map?.environment || parsed?.project;
              const constraints = case_.space_map?.constraints;
              const people = case_.space_map?.people;
              const mode = case_.space_map?.mode || parsed?.situation;
              const strictFacts = case_.facts?.strict_facts;
              const story = case_.background?.story || parsed?.history;
              const dilemmaQuestion = case_.dilemma?.question || parsed?.dilemma;
              const dilemmaAmbiance = case_.dilemma?.ambiance;

              return (
                <>
                  {/* ⚡ СОБЫТИЕ / КРЮЧОК */}
                  {hook && (
                    <div className="bg-catalyst-gold/10 border-l-2 border-system-warning rounded-r-lg p-3 mb-4">
                      {case_.event?.label && (
                        <span className="inline-block text-xs font-semibold text-catalyst-gold uppercase tracking-wide mb-1">
                          {case_.event.label}
                        </span>
                      )}
                      <p className="text-sm font-medium text-ui-text-main leading-relaxed">
                        {hook}
                      </p>
                    </div>
                  )}

                  {/* 🏢 КОНТЕКСТ - структурированный space_map */}
                  {(company || environment || mode || constraints || people) && (
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-ui-text-muted uppercase tracking-wide mb-2 flex items-center gap-1">
                        <span>🏢</span>
                        <span>КОНТЕКСТ</span>
                      </h3>
                      <div className="bg-obsidian-core rounded-lg p-3 space-y-2">
                        {company && (
                          <div className="text-sm text-ui-text-main">
                            <span className="text-ui-text-muted">Компания:</span> {company}
                          </div>
                        )}
                        {environment && (
                          <div className="text-sm text-ui-text-main">
                            <span className="text-ui-text-muted">Среда:</span> {environment}
                          </div>
                        )}
                        {constraints && (
                          <div className="text-sm text-ui-text-main">
                            <span className="text-ui-text-muted">Ограничения:</span> {constraints}
                          </div>
                        )}
                        {people && (
                          <div className="text-sm text-ui-text-main">
                            <span className="text-ui-text-muted">Участники:</span> {people}
                          </div>
                        )}
                        {mode && (
                          <div className="text-sm text-ui-text-main">
                            <span className="text-ui-text-muted">Режим:</span> {mode}
                          </div>
                        )}
                        {/* Fallback для старой структуры */}
                        {!hasNewStructure && parsed?.other && parsed.other.length > 0 && (
                          <div className="space-y-1">
                            {parsed.other.filter(line =>
                              !line.startsWith('История:') &&
                              !line.startsWith('Системный контекст:') &&
                              !line.startsWith('Дилемма:') &&
                              !line.startsWith('Проблема:') &&
                              !line.startsWith('Текущая ситуация:')
                            ).map((line, i) => (
                              <p key={i} className="text-sm text-ui-text-main leading-relaxed">{line}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 📊 ФАКТЫ / ДАННЫЕ */}
                  {(strictFacts || (parsed?.data && parsed.data.length > 0)) && (
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-ui-text-muted uppercase tracking-wide mb-2 flex items-center gap-1">
                        <span>📊</span>
                        <span>ДАННЫЕ</span>
                      </h3>
                      <div className="bg-obsidian-core rounded-lg p-3">
                        {strictFacts && (
                          <p className="text-sm text-ui-text-main flex items-start gap-2">
                            <span className="text-system-focus mt-0.5">•</span>
                            <span>{strictFacts}</span>
                          </p>
                        )}
                        {parsed?.data && parsed.data.map((item, i) => (
                          <p key={i} className="text-sm text-ui-text-main flex items-start gap-2">
                            <span className="text-system-focus mt-0.5">•</span>
                            <span>{item}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 📜 ИСТОРИЯ / ПРЕДЫСТОРИЯ (collapsible) */}
                  {story && (
                    <div className="mb-4">
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 text-sm text-ui-text-muted hover:opacity-100 transition-colors w-full"
                      >
                        <span>📜</span>
                        <span className="text-xs font-semibold text-ui-text-muted uppercase tracking-wide">ПРЕДЫСТОРИЯ</span>
                        <span className="text-xs ml-auto">{showHistory ? '▼ свернуть' : '▶ развернуть'}</span>
                      </button>
                      {showHistory && (
                        <div className="mt-3">
                          <div className="bg-obsidian-core rounded-lg p-3 text-sm text-ui-text-main italic leading-relaxed">
                            <p>"{story}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ⚠️ ДИЛЕММА - фокус на выборе */}
                  {dilemmaQuestion && (
                    <div className="bg-system-critical/10 border-l-2 border-tension-red rounded-r-lg p-3 mb-4">
                      <h3 className="text-xs font-semibold text-ui-text-muted uppercase tracking-wide mb-2 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>ДИЛЕММА</span>
                      </h3>
                      <p className="text-sm text-ui-text-main leading-relaxed font-medium">
                        {dilemmaQuestion}
                      </p>
                      {dilemmaAmbiance && (
                        <p className="text-xs text-ui-text-muted italic mt-2">
                          {dilemmaAmbiance}
                        </p>
                      )}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Разделитель */}
            <div className="border-t border-ui-border-soft my-4"></div>

            {/* Варианты решения */}
            <div className="mt-4">
              <h2 className="text-xs font-semibold text-ui-text-dim uppercase tracking-wide mb-3 flex items-center gap-1">
                <span>✋</span>
                <span>ВАРИАНТЫ РЕШЕНИЯ</span>
              </h2>
              <div className="space-y-2">
                {/* Используем positions если есть, иначе options */}
                {(case_.positions && case_.positions.length > 0 ? case_.positions : case_.options).map((item) => {
                  // Получаем чистое описание без position_type
                  const description = 'description' in item
                    ? item.description
                    : item.text.replace(/\s*\([^)]+\)\s*$/, '').split('\n')[0]; // Убираем "(тип)" из конца

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleOptionSelect(item.id)}
                      className="w-full p-3 text-left bg-obsidian-core border border-ui-border-soft rounded-lg hover:border-strategic-blue hover:bg-obsidian-core/80 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-bold text-system-focus flex-shrink-0">
                          [{item.id}]
                        </span>
                        <p className="text-sm text-ui-text-main">{description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          // После выбора
          <section className="bg-graphite-structure border border-ui-border-soft rounded-lg p-5 mb-4">
            {/* Записанный выбор */}
            <div className="bg-strategic-blue/10 border border-strategic-blue/30 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <span>✅</span>
                <span className="text-system-focus font-medium">Твой выбор записан: {selectedOption}</span>
              </div>
            </div>

            {/* Текущий просматриваемый вариант */}
            {currentOptionData && (
              <>
                {(() => {
                  // Находим соответствующую position для получения position_type
                  const currentPosition = case_.positions?.find(p => p.id === currentOptionData.id);
                  const positionType = currentPosition?.position_type || currentOptionData.skill_used;
                  // Получаем чистое описание
                  const description = currentPosition?.description
                    || currentOptionData.text.replace(/\s*\([^)]+\)\s*$/, '').split('\n')[0];

                  return (
                    <div className={`p-4 rounded-lg mb-4 ${exploringOption === selectedOption ? 'bg-obsidian-core border-l-4 border-strategic-blue' : 'bg-obsidian-core/50 border-l-4 border-ui-border-soft'}`}>
                      <div className="flex items-start gap-3 mb-3">
                        <span className="w-7 h-7 rounded-full bg-strategic-blue/20 text-system-focus flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {currentOptionData.id}
                        </span>
                        <div>
                          <p className="text-sm text-ui-text-main font-medium">{description}</p>
                          {/* Показываем position_type после выбора */}
                          {positionType && (
                            <span className="inline-block mt-2 text-xs px-2 py-1 bg-strategic-blue/20 border border-strategic-blue/30 rounded text-strategic-blue font-medium">
                              {positionType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3 уровня последствий */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-3 p-3 bg-obsidian-core rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-system-critical mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-ui-text-muted mb-1">Сразу</p>
                      <p className="text-sm text-ui-text-main">{currentOptionData.consequence.immediate}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-obsidian-core rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-catalyst-gold mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-ui-text-muted mb-1">Потом</p>
                      <p className="text-sm text-ui-text-main">{currentOptionData.consequence.second_order}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-obsidian-core rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-system-growth mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-ui-text-muted mb-1">Системно</p>
                      <p className="text-sm text-ui-text-main">{currentOptionData.consequence.systemic}</p>
                    </div>
                  </div>
                </div>

                {/* Инсайт */}
                {(currentOptionData.explanation || currentOptionData.hint) && (
                  <div className="bg-obsidian-core border-l-4 border-sage-green rounded-r-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <span>💡</span>
                      <p className="text-sm text-ui-text-main font-medium">
                        {currentOptionData.explanation || currentOptionData.hint}
                      </p>
                    </div>
                  </div>
                )}

                {/* After Choice Insights - новая структура */}
                {case_.reflection?.after_choice_insights && case_.reflection.after_choice_insights.length > 0 && (
                  <div className="bg-strategic-blue/10 border-l-4 border-strategic-blue rounded-r-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <span>🎯</span>
                      <div className="space-y-2">
                        <p className="text-xs text-ui-text-muted uppercase font-semibold tracking-wide">Ключевой инсайт</p>
                        {case_.reflection.after_choice_insights.map((insight, i) => (
                          <p key={i} className="text-sm text-ui-text-main font-medium italic">
                            "{insight}"
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Предупреждение */}
                {currentOptionData.warning && (
                  <div className="bg-system-critical/10 border-l-4 border-tension-red rounded-r-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <span>⚠️</span>
                      <p className="text-sm text-tension-red">{currentOptionData.warning}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Другие варианты */}
            <div className="border-t border-ui-border-soft pt-4 mt-4">
              <p className="text-xs text-ui-text-muted mb-3">Другие варианты (без влияния на прогресс)</p>
              <div className="space-y-2">
                {case_.options.filter(o => o.id !== exploringOption).map((option) => {
                  // Находим position для получения данных
                  const position = case_.positions?.find(p => p.id === option.id);
                  const description = position?.description
                    || option.text.replace(/\s*\([^)]+\)\s*$/, '').split('\n')[0];
                  const positionType = position?.position_type;

                  return (
                    <button
                      key={option.id}
                      onClick={() => setExploringOption(option.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        option.id === selectedOption
                          ? 'border-strategic-blue bg-strategic-blue/10'
                          : 'border-ui-border-soft bg-obsidian-core hover:border-ui-border-strong'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          option.id === selectedOption
                            ? 'bg-strategic-blue text-white'
                            : 'bg-ui-border-soft text-ui-text-main opacity-70'
                        }`}>
                          {option.id}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-ui-text-main">{description}</p>
                          {/* Показываем position_type после выбора */}
                          {positionType && (
                            <span className="inline-block mt-1 text-xs px-1.5 py-0.5 bg-ui-border-soft/50 rounded text-ui-text-muted">
                              {positionType}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Кнопка для рефлексии - выделена цветом для привлечения внимания */}
            {case_.reflection?.questions && (
              <div className="border-t border-ui-border-soft pt-4 mt-4">
                <button
                  onClick={() => setShowReflectionModal(true)}
                  className="w-full py-3 px-4 bg-strategic-blue/10 border-2 border-strategic-blue/30 rounded-lg hover:border-strategic-blue hover:bg-strategic-blue/15 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🪞</span>
                    <span className="text-sm font-semibold text-system-focus">Рефлексия (опционально)</span>
                  </div>
                  <p className="text-xs text-system-focus/80">
                    Зафиксируй свои мысли и инсайты
                  </p>
                </button>
              </div>
            )}

          </section>
        )}

        {/* Помощь при застревании */}
        {showStuckHelp && !choiceRecorded && (
          <div className="bg-catalyst-gold/10 border border-system-warning rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span>💡</span>
                  <h3 className="text-sm font-semibold text-ui-text-main">Нужна помощь?</h3>
                </div>
                <p className="text-sm text-ui-text-main mb-3">
                  Ты читаешь кейс уже больше 5 минут. Может, что-то мешает принять решение?
                </p>
                <div className="space-y-2 text-sm text-ui-text-main">
                  <p>🔹 Прочитай варианты внимательно — каждый имеет свои последствия</p>
                  <p>🔹 Обрати внимание на индикаторы (риск, время, доверие)</p>
                  <p>🔹 Выбери вариант, который кажется наиболее правильным сейчас</p>
                </div>
              </div>
              <button
                onClick={() => setShowStuckHelp(false)}
                className="text-ui-text-main opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Действия */}
        <div className="flex gap-3">
          {choiceRecorded && (
            <>
              {isSolved ? (
                <div className="flex-1 py-3 px-4 bg-system-growth/20 text-sage-green rounded-lg text-center text-sm font-medium">
                  ✓ Кейс решён
                </div>
              ) : (
                <button
                  onClick={handleMarkAsSolved}
                  disabled={isMarking}
                  className="flex-1 py-3 px-4 bg-system-growth hover:bg-system-growth/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isMarking ? 'Сохранение...' : '✓ Кейс пройден'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Модальное окно рефлексии */}
        <ReflectionModal
          isOpen={showReflectionModal}
          context={{
            type: 'case',
            id: case_.id,
            title: case_.title,
            selectedOption: selectedOption || undefined,
            selectedOptionTitle: selectedOption ? case_.options.find(opt => opt.id === selectedOption)?.text.split('\n')[0] : undefined,
          }}
          reflectionQuestion={case_.reflection?.questions?.[0]}
          onClose={() => setShowReflectionModal(false)}
          onSave={async (data) => {
            // TODO: Сохранить рефлексию через API
            console.log('Рефлексия сохранена:', data);
            setShowReflectionModal(false);
            toast.showToast('Рефлексия сохранена', 'success');
          }}
          onSkip={() => {
            setShowReflectionModal(false);
          }}
        />
      </div>
    </main>
  );
}
