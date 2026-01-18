'use client';

import { cn } from '@/lib/utils';
import { Card, Badge } from '@leadership-architect/ui';
import { mapCaseStatusToTone } from '@/lib/ui-utils';

export type CaseDifficulty = 'basic' | 'intermediate' | 'advanced';
export type CaseStatus = 'available' | 'completed' | 'locked';

export interface CaseCardProps {
  /** ID кейса */
  caseId: string;
  /** Название кейса (portal.case_name) */
  title: string;
  /** Суть кейса (event.summary) */
  event?: string;
  /** @deprecated Legacy: hook → event */
  hook?: string;
  /** Сложность (определяет уровень) */
  difficulty: CaseDifficulty;
  /** Статус кейса */
  status: CaseStatus;
  /** Выбранная позиция (для completed) */
  selectedPosition?: string;
  /** @deprecated Legacy: selectedOption → selectedPosition */
  selectedOption?: string;
  /** Какие ноды развивает */
  effectsPreview?: Array<{
    nodeName: string;
    percentage: number;
  }>;
  /** @deprecated Legacy: treeImpact → effectsPreview */
  treeImpact?: Array<{
    nodeName: string;
    percentage: number;
  }>;
  /** Обработчик клика */
  onClick?: () => void;
  /** Дополнительные CSS-классы */
  className?: string;
}

/** Конфигурация сложности */
const DIFFICULTY_CONFIG: Record<CaseDifficulty, {
  label: string;
  filledDots: number;
}> = {
  basic: { label: 'Базовый', filledDots: 1 },
  intermediate: { label: 'Средний', filledDots: 2 },
  advanced: { label: 'Сложный', filledDots: 3 },
};

/** Кружки сложности */
function DifficultyDots({ filled, total = 3 }: { filled: number; total?: number }) {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            i < filled ? 'bg-catalyst-gold' : 'bg-ui-border-soft'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Краткая карточка кейса для списка
 * Рефакторинг на базе Card/Badge.
 */
export function CaseCard({
  caseId,
  title,
  event,
  hook,
  difficulty,
  status,
  selectedPosition,
  selectedOption,
  effectsPreview,
  treeImpact,
  onClick,
  className,
}: CaseCardProps) {
  const normalizedEvent = event || hook;
  const normalizedPosition = selectedPosition || selectedOption;
  const normalizedEffects = effectsPreview || treeImpact;
  const difficultyConfig = DIFFICULTY_CONFIG[difficulty];
  const tone = mapCaseStatusToTone(status);

  return (
    <Card
      onClick={status !== 'locked' ? onClick : undefined}
      elevated
      className={cn(
        'w-full h-full text-left transition-all duration-300 border-2',
        status === 'available' ? 'border-catalyst-gold/30 hover:border-catalyst-gold/60 hover:shadow-active' : 
        status === 'completed' ? 'border-sage-green/30' : 'border-ui-border-soft opacity-60 grayscale cursor-not-allowed',
        className
      )}
      header={
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <DifficultyDots filled={difficultyConfig.filledDots} />
            <span className="text-[10px] uppercase tracking-wider text-ui-text-dim font-bold">
              {difficultyConfig.label}
            </span>
          </div>
          <Badge tone={tone} soft>
            {status === 'completed' ? 'Пройден' : status === 'locked' ? 'Закрыт' : 'Доступен'}
          </Badge>
        </div>
      }
      footer={
        status !== 'locked' && (
          <div className="w-full py-2.5 bg-catalyst-gold rounded-lg text-center transition-colors hover:bg-catalyst-gold/90 group cursor-pointer">
            <span className="text-xs font-bold text-obsidian-core tracking-widest uppercase">
              Открыть кейс
            </span>
          </div>
        )
      }
    >
      <div className="space-y-3 py-1">
        <h4 className="font-semibold text-sm text-ash-light leading-snug tracking-tight">
          {title}
        </h4>

        {normalizedEvent && (
          <div className="p-3 bg-obsidian-core/50 rounded-lg border-l-2 border-warm-amber">
            <p className="text-[11px] text-ash-light/80 leading-relaxed line-clamp-3">
              {normalizedEvent}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 items-center">
          {status === 'completed' ? (
            <div className="flex items-center gap-2 text-[11px] text-sage-green font-medium">
              <span>✅ Выполнено</span>
              {normalizedPosition && (
                <span className="text-ui-text-muted font-normal">· Позиция {normalizedPosition}</span>
              )}
            </div>
          ) : normalizedEffects && normalizedEffects.length > 0 ? (
            <>
              <span className="text-[10px] text-ui-text-dim uppercase tracking-wider mr-1">Развивает:</span>
              {normalizedEffects.slice(0, 2).map((effect, index) => (
                <Badge key={index} tone="neutral" soft className="text-[10px]">
                  {effect.nodeName} +{effect.percentage}%
                </Badge>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export default CaseCard;
