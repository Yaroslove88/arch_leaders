'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CaseDifficulty } from './CaseCard';

export interface CaseOption {
  id: string;
  label: string; // A, B, C, D
  title: string; // Краткое название варианта
  description?: string; // Детальное описание
}

export interface CaseOutcome {
  immediate: string; // 🔴 Сразу
  shortTerm: string; // 🟡 Потом
  longTerm: string; // 🟢 Системно
}

export interface CaseDetailCardProps {
  /** ID кейса */
  caseId: string;
  /** Название кейса */
  title: string;
  /** Теги (категории способностей) */
  tags?: string[];
  /** Сложность */
  difficulty: CaseDifficulty;
  /** Крючок - критическая ситуация */
  hook: string;
  /** Контекст - описание компании/ситуации */
  context: string[];
  /** Данные - метрики и факты */
  data: string[];
  /** История - предыстория (опционально разворачивается) */
  history?: string;
  /** Дилемма - суть проблемы */
  dilemma: string;
  /** Варианты решения */
  options: CaseOption[];
  /** Выбранный вариант (если кейс пройден) */
  selectedOption?: string;
  /** Результаты выбора (для выбранного варианта) */
  outcome?: CaseOutcome;
  /** Ключевой инсайт (для выбранного варианта) */
  keyInsight?: string;
  /** Вопрос для рефлексии (для выбранного варианта) */
  reflectionQuestion?: string;
  /** Влияние на дерево */
  treeImpact?: Array<{
    nodeName: string;
    percentage: number;
  }>;
  /** Обработчик выбора варианта */
  onSelectOption?: (optionId: string) => void;
  /** Обработчик повторного прохождения */
  onRetry?: () => void;
  /** Обработчик закрытия */
  onClose?: () => void;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Детальная карточка кейса с структурированным контекстом
 */
export function CaseDetailCard({
  caseId,
  title,
  tags,
  difficulty,
  hook,
  context,
  data,
  history,
  dilemma,
  options,
  selectedOption,
  outcome,
  keyInsight,
  reflectionQuestion,
  treeImpact,
  onSelectOption,
  onRetry,
  onClose,
  className,
}: CaseDetailCardProps) {
  const [showHistory, setShowHistory] = useState(false);

  // Получаем информацию о сложности (точки по спецификации)
  const getDifficultyLabel = () => {
    switch (difficulty) {
      case 'basic':
        return { label: 'Базовый', dots: '●○○', color: 'text-sage-green' };
      case 'intermediate':
        return { label: 'Средний', dots: '●●○', color: 'text-catalyst-gold' };
      case 'advanced':
        return { label: 'Сложный', dots: '●●●', color: 'text-tension-red' };
      default:
        return { label: difficulty, dots: '○○○', color: 'text-ash-light' };
    }
  };

  const difficultyInfo = getDifficultyLabel();
  const isCompleted = !!selectedOption;
  const selectedOptionData = options.find(opt => opt.id === selectedOption);

  return (
    <div
      className={cn(
        'bg-graphite-structure rounded-xl shadow-active border border-ui-border-soft',
        'max-w-2xl w-full mx-auto',
        className
      )}
    >
      {/* Заголовок */}
      <div className="p-4 border-b border-ui-border-soft">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h2 className="font-bold text-lg text-ash-light mb-2">
              📊 КЕЙС: {title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {tags && tags.map((tag, index) => (
                <span key={index} className="px-2 py-0.5 bg-obsidian-core text-ash-light rounded">
                  🏷️ {tag}
                </span>
              ))}
              <span className={cn('px-2 py-0.5 rounded', difficultyInfo.color)}>
                {difficultyInfo.dots} {difficultyInfo.label}
              </span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-ui-text-muted hover:opacity-100 p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Если кейс не пройден - показываем структуру */}
      {!isCompleted && (
        <>
          {/* Крючок */}
          <div className="px-4 py-3 border-b border-ui-border-soft">
            <p className="text-sm font-medium text-ash-light mb-2">⚡ КРЮЧОК</p>
            <div className="p-3 bg-catalyst-gold/10 rounded border-l-2 border-catalyst-gold">
              <p className="text-sm text-ash-light leading-relaxed">
                {hook}
              </p>
            </div>
          </div>

          {/* Контекст */}
          <div className="px-4 py-3 border-b border-ui-border-soft">
            <p className="text-sm font-medium text-ash-light mb-2">🏢 КОНТЕКСТ</p>
            <div className="p-3 bg-obsidian-core rounded space-y-1">
              {context.map((item, index) => (
                <p key={index} className="text-sm text-ash-light opacity-90">
                  {item}
                </p>
              ))}
            </div>
          </div>

          {/* Данные */}
          <div className="px-4 py-3 border-b border-ui-border-soft">
            <p className="text-sm font-medium text-ash-light mb-2">📊 ДАННЫЕ</p>
            <div className="p-3 bg-obsidian-core rounded space-y-1">
              {data.map((item, index) => (
                <p key={index} className="text-sm text-ash-light opacity-90">
                  • {item}
                </p>
              ))}
            </div>
          </div>

          {/* История (сворачивается) */}
          {history && (
            <div className="px-4 py-3 border-b border-ui-border-soft">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 w-full text-left mb-2"
              >
                <span className="text-sm font-medium text-ash-light">
                  📜 ИСТОРИЯ
                </span>
                <span className="text-xs text-ui-text-muted">
                  {showHistory ? '▼ свернуть' : '▶ развернуть'}
                </span>
              </button>
              {showHistory && (
                <div className="p-3 bg-obsidian-core rounded">
                  <p className="text-sm text-ash-light opacity-90 italic leading-relaxed">
                    {history}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Дилемма */}
          <div className="px-4 py-3 border-b border-ui-border-soft">
            <p className="text-sm font-medium text-ash-light mb-2">⚠️ ДИЛЕММА</p>
            <div className="p-3 bg-tension-red/10 rounded border-l-2 border-tension-red">
              <p className="text-sm text-ash-light leading-relaxed">
                {dilemma}
              </p>
            </div>
          </div>

          {/* Варианты решения */}
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-ash-light mb-3">✋ ВАРИАНТЫ РЕШЕНИЯ</p>
            <div className="space-y-2">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onSelectOption?.(option.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-all',
                    'bg-obsidian-core hover:bg-obsidian-core/80 hover:border-strategic-blue',
                    'border-ui-border-soft'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-bold text-strategic-blue flex-shrink-0">
                      [{option.label}]
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ash-light">
                        {option.title}
                      </p>
                      {option.description && (
                        <p className="text-xs text-ash-light opacity-90 mt-1">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Если кейс пройден - показываем результат */}
      {isCompleted && selectedOptionData && (
        <>
          {/* Выбор записан */}
          <div className="px-4 py-3 bg-sage-green/10 border-b border-ui-border-soft">
            <p className="text-sm font-medium text-sage-green">
              ✅ Твой выбор записан: {selectedOptionData.label}
            </p>
          </div>

          {/* Выбранный вариант */}
          <div className="px-4 py-3 border-b border-ui-border-soft">
            <p className="text-xs text-ui-text-muted mb-2">── ТВОЙ ВАРИАНТ ──────────────────────────────</p>
            <div className="flex items-start gap-2">
              <span className="text-sm font-bold text-strategic-blue">
                🔵 {selectedOptionData.label}:
              </span>
              <p className="text-sm text-ash-light">
                {selectedOptionData.title}
              </p>
            </div>
          </div>

          {/* Что произошло */}
          {outcome && (
            <div className="px-4 py-3 border-b border-ui-border-soft">
              <p className="text-sm font-medium text-ash-light mb-2">⚡ ЧТО ПРОИЗОШЛО</p>
              <div className="p-3 bg-obsidian-core rounded space-y-2">
                <p className="text-sm text-ash-light">
                  <span className="text-tension-red">🔴</span> <strong>Сразу:</strong> {outcome.immediate}
                </p>
                <p className="text-sm text-ash-light">
                  <span className="text-catalyst-gold">🟡</span> <strong>Потом:</strong> {outcome.shortTerm}
                </p>
                <p className="text-sm text-ash-light">
                  <span className="text-sage-green">🟢</span> <strong>Системно:</strong> {outcome.longTerm}
                </p>
              </div>
            </div>
          )}

          {/* Ключевой инсайт */}
          {keyInsight && (
            <div className="px-4 py-3 border-b border-ui-border-soft">
              <p className="text-sm font-medium text-ash-light mb-2">💡 КЛЮЧЕВОЙ ИНСАЙТ</p>
              <div className="p-3 bg-strategic-blue/10 rounded border-l-2 border-strategic-blue">
                <p className="text-sm text-ash-light italic leading-relaxed">
                  "{keyInsight}"
                </p>
              </div>
            </div>
          )}

          {/* Вопрос для рефлексии */}
          {reflectionQuestion && (
            <div className="px-4 py-3 border-b border-ui-border-soft">
              <p className="text-sm font-medium text-ash-light mb-2">🪞 ВОПРОС ДЛЯ РЕФЛЕКСИИ</p>
              <p className="text-sm text-ash-light opacity-90 italic">
                {reflectionQuestion}
              </p>
            </div>
          )}


          {/* Другие варианты */}
          <div className="px-4 py-3 border-b border-ui-border-soft">
            <p className="text-xs text-ui-text-muted mb-2">── ДРУГИЕ ВАРИАНТЫ (без прогресса) ───────────</p>
            <div className="space-y-1">
              {options
                .filter(opt => opt.id !== selectedOption)
                .map((option) => (
                  <div key={option.id} className="text-sm text-ash-light opacity-80">
                    ▶ {option.label}: {option.title}
                  </div>
                ))}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="p-4 flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 py-2.5 px-4 border border-ui-border-soft rounded-lg hover:bg-obsidian-core transition-colors text-ash-light text-sm font-medium"
              >
                Попробовать другой вариант
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-system-growth text-white rounded-lg hover:bg-system-growth/90 transition-colors text-sm font-medium"
            >
              ✓ Кейс пройден
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CaseDetailCard;
