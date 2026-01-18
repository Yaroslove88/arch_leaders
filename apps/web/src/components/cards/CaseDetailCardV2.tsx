'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  CaseDetailCardV2Props,
  CaseSpaceMap,
  DIFFICULTY_CONFIG,
  SPACE_MAP_LABELS,
} from './CaseCardTypes';

/**
 * Кружки сложности (⬤⬤○)
 */
function DifficultyDots({ 
  filled, 
  total = 3 
}: { 
  filled: number; 
  total?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'w-2 h-2 rounded-full transition-colors',
            i < filled ? 'bg-catalyst-gold' : 'bg-ui-text-dim/30'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Таблица контекста (Space Map)
 */
function SpaceMapTable({ spaceMap }: { spaceMap: CaseSpaceMap }) {
  const entries = (Object.entries(spaceMap) as [keyof CaseSpaceMap, string][]).filter(
    ([_, value]) => value && value.trim() !== '' && value !== '—' && value !== '-'
  );
  
  if (entries.length === 0) return null;

  return (
    <div className="bg-graphite-structure rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-ui-text-dim mb-3">
        Контекст
      </p>
      <div className="divide-y divide-ui-border-soft">
        {entries.map(([key, value]) => (
          <div key={key} className="grid grid-cols-[120px_1fr] py-2 gap-3">
            <span className="text-xs text-ui-text-dim">{SPACE_MAP_LABELS[key]}</span>
            <span className="text-xs text-ash-light">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Блок последствий (СЕЙЧАС / ПОТОМ / СИСТЕМНО)
 */
function ConsequenceBlock({
  label,
  text,
  variant,
}: {
  label: string;
  text: string;
  variant: 'immediate' | 'second_order' | 'systemic';
}) {
  const dotColor = {
    immediate: 'bg-sage-green',
    second_order: 'bg-catalyst-gold',
    systemic: 'bg-inner-violet',
  }[variant];

  return (
    <div className="p-3 bg-obsidian-core rounded-lg border border-ui-border-soft">
      <div className="flex items-center gap-2 mb-1.5 text-[10px] uppercase tracking-wider text-ash-light/90">
        <span className={cn('w-2 h-2 rounded-full', dotColor)} aria-hidden />
        <span>{label}</span>
      </div>
      <p className="text-sm text-ash-light leading-relaxed">{text}</p>
    </div>
  );
}

/**
 * Детальная карточка кейса v2
 * По wireframe из "ТУТ НОВЫЙ дизайн кейсов 1.md"
 */
export function CaseDetailCardV2({
  caseData,
  difficulty,
  selectedPositionId,
  nodeName,
  xpReward = 5,
  onSelectPosition,
  onNextCase,
  onBackToList,
  onBack,
  actionButtons,
  className,
}: CaseDetailCardV2Props & { actionButtons?: React.ReactNode }) {
  const [showOtherPositions, setShowOtherPositions] = useState(false);
  
  const { portal, event, context, facts, background, dilemma, positions, reflection } = caseData;
  const difficultyConfig = DIFFICULTY_CONFIG[difficulty];
  
  const isCompleted = !!selectedPositionId;
  const selectedPosition = positions.find(p => p.id === selectedPositionId);
  const otherPositions = positions.filter(p => p.id !== selectedPositionId);

  // Нормализация facts
  const factsArray = facts?.strict_facts
    ? Array.isArray(facts.strict_facts)
      ? facts.strict_facts
      : [facts.strict_facts]
    : [];

  return (
    <div
      className={cn(
        'bg-obsidian-core rounded-xl border border-ui-border-soft',
        'max-w-2xl w-full mx-auto overflow-hidden',
        className
      )}
    >
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="p-4 space-y-3">
        {/* Навигация + Сложность */}
        <div className="flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Вернуться к списку кейсов"
              className="text-sm text-ui-text-dim hover:text-ash-light transition-colors flex items-center gap-1 min-h-[44px]"
            >
              ← Назад
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <DifficultyDots filled={difficultyConfig.filledDots} total={difficultyConfig.totalDots} />
            <span className="text-xs text-ui-text-dim">{difficultyConfig.label}</span>
          </div>
        </div>

        {/* Заголовок */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-ui-text-dim mb-1">
            {portal.header_title}
          </p>
          <h2 className="text-xl font-bold text-ash-light mb-1">
            {portal.case_name}
          </h2>
          <p className="text-sm text-ui-text-dim">
            {portal.subtitle}
          </p>
        </div>
      </div>

      {/* ═══════════════ СОСТОЯНИЕ ДО ВЫБОРА ═══════════════ */}
      {!isCompleted && (
        <>
          {/* EVENT BLOCK */}
          <div className="mx-4 mb-4 p-4 bg-obsidian-core rounded-xl border-l-4 border-warm-amber">
            <p className="text-[10px] uppercase tracking-wider text-warm-amber mb-2">
              {event.label}
            </p>
            <p className="text-base text-ash-light leading-relaxed">
              {event.summary}
            </p>
          </div>

          {/* SPACE MAP */}
          <div className="mx-4 mb-4">
            <SpaceMapTable spaceMap={context.space_map} />
          </div>

          {/* BACKGROUND + FACTS */}
          {(background || factsArray.length > 0) && (
            <div className="mx-4 mb-4 space-y-3">
              {background?.story && (
                <p className="text-sm text-ui-text-dim italic leading-relaxed">
                  {background.story}
                </p>
              )}
              {factsArray.map((fact, i) => (
                <div
                  key={i}
                  className="p-3 border-l-2 border-tension-red bg-tension-red/5 rounded-r"
                >
                  <p className="text-sm text-tension-red/80">
                    ⚡ {fact}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* DILEMMA */}
          <div className="mx-4 mb-4 py-6 text-center">
            {dilemma.ambiance && (
              <p className="text-sm text-ui-text-dim italic mb-3">
                {dilemma.ambiance}
              </p>
            )}
            <p className="text-lg font-semibold text-ash-light leading-relaxed">
              {dilemma.question}
            </p>
          </div>

          {/* POSITIONS — только текст, без подсказок */}
          <div className="mx-4 mb-4 space-y-3" role="group" aria-label="Варианты выбора">
            {positions.map((position) => (
              <button
                key={position.id}
                onClick={() => onSelectPosition?.(position.id)}
                aria-label={`Выбрать позицию ${position.id}: ${position.description}`}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all duration-200 min-h-[56px]',
                  'bg-graphite-structure border-ui-border-soft',
                  'hover:border-catalyst-gold hover:shadow-glow-gold',
                  'focus:outline-none focus:ring-2 focus:ring-catalyst-gold/50'
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg font-bold text-catalyst-gold">
                    {position.id}
                  </span>
                  <p className="font-medium text-ash-light flex-1">
                    {position.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* EFFECTS + TAGS */}
          <div className="mx-4 mb-4 pt-4 border-t border-ui-border-soft">
            {nodeName && (
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-ui-text-dim mb-2">
                  Развивает
                </p>
                <span className="inline-block px-3 py-1.5 bg-catalyst-gold/15 text-catalyst-gold text-xs font-medium rounded border border-catalyst-gold/25">
                  {nodeName}
                </span>
              </div>
            )}
            {(caseData.meta.symbols || caseData.meta.strategic_tags) && (
              <div className="flex flex-wrap gap-1.5">
                {caseData.meta.symbols?.map((symbol, i) => (
                  <span
                    key={`s-${i}`}
                    className="px-2 py-1 bg-inner-violet/20 text-[10px] text-inner-violet/80 rounded"
                  >
                    {symbol}
                  </span>
                ))}
                {caseData.meta.strategic_tags?.map((tag, i) => (
                  <span
                    key={`t-${i}`}
                    className="px-2 py-1 bg-inner-violet/20 text-[10px] text-inner-violet/80 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════ СОСТОЯНИЕ ПОСЛЕ ВЫБОРА ═══════════════ */}
      {isCompleted && selectedPosition && (
        <>
          {/* ВЫБРАННАЯ ПОЗИЦИЯ */}
          <div className="mx-4 mb-4 p-4 bg-catalyst-gold/10 border border-catalyst-gold rounded-xl">
            <p className="text-[10px] uppercase tracking-wider text-catalyst-gold mb-3">
              Ваш выбор
            </p>
            <div className="flex items-start gap-3">
              <span className="text-2xl font-bold text-catalyst-gold">
                {selectedPosition.id}
              </span>
              <p className="text-base font-medium text-ash-light pt-1">
                {selectedPosition.description}
              </p>
            </div>
          </div>

          {/* ПОСЛЕДСТВИЯ */}
          <div className="mx-4 mb-4 p-4 bg-graphite-structure rounded-xl">
            <p className="text-[10px] uppercase tracking-wider text-ui-text-dim mb-4">
              Последствия выбора
            </p>
            <div className="space-y-3">
              <ConsequenceBlock
                label="Сейчас"
                text={selectedPosition.consequence.immediate}
                variant="immediate"
              />
              <ConsequenceBlock
                label="Потом"
                text={selectedPosition.consequence.second_order}
                variant="second_order"
              />
              <ConsequenceBlock
                label="Системно"
                text={selectedPosition.consequence.systemic}
                variant="systemic"
              />
            </div>
          </div>

          {/* РЕФЛЕКСИЯ — только если есть текст */}
          {selectedPosition.reflection_prompt && (
            <div className="mx-4 mb-4 p-4 bg-obsidian-core border-l-4 border-warm-amber rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-warm-amber mb-3">
                Подумайте
              </p>
              <p className="text-base text-ash-light font-medium leading-relaxed">
                {selectedPosition.reflection_prompt}
              </p>
            </div>
          )}

          {/* ДОПОЛНИТЕЛЬНЫЕ ВОПРОСЫ */}
          {reflection?.questions && reflection.questions.length > 0 && (
            <div className="mx-4 mb-4 p-4 bg-strategic-blue/5 border border-strategic-blue/20 rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-strategic-blue mb-3 font-bold">
                Вопросы для размышления
              </p>
              <ul className="space-y-3">
                {reflection.questions.map((q, i) => (
                  <li key={i} className="text-sm text-ash-light leading-relaxed flex gap-2">
                    <span className="text-strategic-blue">•</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ДРУГИЕ ПОЗИЦИИ (сворачиваемый блок) */}
          {otherPositions.length > 0 && (
            <div className="mx-4 mb-4">
              <button
                onClick={() => setShowOtherPositions(!showOtherPositions)}
                aria-expanded={showOtherPositions}
                aria-controls="other-positions"
                className="text-xs text-ui-text-dim hover:text-ash-light transition-colors flex items-center gap-2 min-h-[44px] bg-graphite-structure/30 px-3 rounded-lg"
              >
                <span aria-hidden="true">{showOtherPositions ? '▾' : '▸'}</span>
                <span>Посмотреть альтернативные позиции</span>
              </button>
              {showOtherPositions && (
                <div id="other-positions" className="mt-3 space-y-2">
                  {otherPositions.map((pos) => (
                    <div
                      key={pos.id}
                      className="p-3 bg-graphite-structure/50 rounded-lg border border-ui-border-soft"
                    >
                      <p className="text-sm text-ui-text-dim">
                        <span className="font-medium text-ash-light/70">{pos.id}</span>
                        {' — '}
                        {pos.description}
                      </p>
                      <p className="text-xs text-ui-text-dim/70 mt-1 italic">
                        → {pos.consequence.immediate}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* РЕЗУЛЬТАТ */}
          <div className="mx-4 mb-4 p-4 bg-graphite-structure border border-sage-green/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sage-green" />
              <span className="text-sage-green font-medium">Кейс завершён</span>
            </div>
            {nodeName && (
              <span className="inline-block px-3 py-1.5 bg-sage-green/15 text-sage-green text-xs font-medium rounded">
                {nodeName} +{xpReward} XP
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="p-4 space-y-3">
            {actionButtons}
            {onNextCase && (
              <button
                onClick={onNextCase}
                aria-label="Перейти к следующему кейсу"
                className="w-full py-3 min-h-[48px] bg-catalyst-gold text-obsidian-core font-semibold rounded-lg hover:bg-catalyst-gold/90 transition-colors focus:outline-none focus:ring-2 focus:ring-catalyst-gold/50"
              >
                К следующему кейсу
              </button>
            )}
            {onBackToList && (
              <button
                onClick={onBackToList}
                aria-label="Вернуться к списку кейсов"
                className="w-full py-3 min-h-[48px] border border-ui-border-soft text-ui-text-dim font-medium rounded-lg hover:bg-graphite-structure transition-colors focus:outline-none focus:ring-2 focus:ring-strategic-blue/50"
              >
                Вернуться к списку
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CaseDetailCardV2;
