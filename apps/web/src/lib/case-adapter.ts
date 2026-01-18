/**
 * Адаптер для преобразования InteractiveCase (API) → CaseCardData (V2 компонент)
 */

import type { InteractiveCase } from './api';
import type { CaseCardData, CaseDifficulty } from '@/components/cards/CaseCardTypes';

/**
 * Преобразует кейс из API формата в формат для CaseDetailCardV2
 * Поддерживает как старый формат (context string), так и новый (portal, event, space_map)
 */
export function adaptCaseToV2(apiCase: InteractiveCase): CaseCardData | null {
  // Если есть новый формат — используем его напрямую
  if (apiCase.portal && apiCase.event && apiCase.space_map && apiCase.dilemma) {
    return {
      meta: {
        case_id: apiCase.id,
        node_id: apiCase.node_id || '',
        branch_id: apiCase.branch_id || '',
        access_level: apiCase.difficulty as CaseDifficulty,
        maturity_level: apiCase.maturity_level,
        symbols: apiCase.symbols,
        strategic_tags: apiCase.strategic_tags,
        pressure_level: mapRussianLevel(apiCase.pressure_level),
        uncertainty: mapRussianLevel(apiCase.uncertainty),
        subjectivity_load: mapRussianLevel(apiCase.subjectivity_load),
        systemic_regress_risk: mapRussianLevel(apiCase.systemic_regress_risk),
      },
      portal: {
        header_title: apiCase.portal.header_title || 'КЕЙС',
        case_name: apiCase.portal.case_name || apiCase.title,
        subtitle: apiCase.portal.subtitle || '',
        marker_icons: apiCase.portal.marker_icons,
        access_bar: apiCase.portal.access_bar,
      },
      event: {
        label: apiCase.event.label || 'Событие',
        summary: apiCase.event.summary || '',
        urgency: mapRussianLevel(apiCase.event.urgency),
      },
      context: {
        space_map: {
          company: apiCase.space_map.company || '',
          environment: apiCase.space_map.environment || '',
          constraints: apiCase.space_map.constraints || '',
          people: apiCase.space_map.people || '',
          mode: apiCase.space_map.mode || '',
        },
      },
      facts: apiCase.facts,
      background: apiCase.background,
      dilemma: {
        question: apiCase.dilemma.question,
        ambiance: apiCase.dilemma.ambiance,
      },
      positions: apiCase.positions?.map(pos => ({
        id: pos.id,
        description: pos.description,
        position_type: pos.position_type,
        consequence: {
          immediate: pos.consequence.immediate,
          second_order: pos.consequence.second_order,
          systemic: pos.consequence.systemic,
        },
        // Берём из consequence.reflection_prompt (где реальные данные в JSON)
        reflection_prompt: pos.consequence.reflection_prompt || pos.reflection_prompt || '',
      })) || adaptOptionsToPositions(apiCase.options, apiCase.reflection),
      indicators: apiCase.indicators ? {
        maturity: apiCase.indicators.maturity,
        uncertainty: apiCase.indicators.uncertainty,
        subjectivity: apiCase.indicators.subjectivity,
        regress_risk: apiCase.indicators.regress_risk,
      } : undefined,
      reflection: apiCase.reflection ? {
        questions: apiCase.reflection.questions,
        after_choice_insights: apiCase.reflection.after_choice_insights,
      } : undefined,
    };
  }

  // Fallback: парсим старый формат context
  const parsed = parseContextString(apiCase.context);
  
  return {
    meta: {
      case_id: apiCase.id,
      node_id: apiCase.node_id || '',
      branch_id: apiCase.branch_id || '',
      access_level: apiCase.difficulty as CaseDifficulty,
      symbols: apiCase.symbols,
      strategic_tags: apiCase.strategic_tags,
    },
    portal: {
      header_title: 'КЕЙС',
      case_name: apiCase.title,
      subtitle: parsed.subtitle || '',
    },
    event: {
      label: 'Ситуация',
      summary: parsed.hook || parsed.situation || '',
    },
    context: {
      space_map: {
        company: parsed.company || '',
        environment: parsed.project || '',
        constraints: '',
        people: '',
        mode: '',
      },
    },
    facts: parsed.dataLines?.length ? {
      strict_facts: parsed.dataLines,
    } : undefined,
    background: parsed.history ? {
      story: parsed.history,
    } : undefined,
    dilemma: {
      question: parsed.dilemma || 'Какое решение ты примешь?',
    },
    positions: adaptOptionsToPositions(apiCase.options, apiCase.reflection),
    reflection: apiCase.reflection ? {
      questions: apiCase.reflection.questions,
    } : undefined,
  };
}

/**
 * Преобразует старые options в новые positions
 */
function adaptOptionsToPositions(options: InteractiveCase['options'], reflection?: InteractiveCase['reflection']) {
  return options.map(opt => ({
    id: opt.id,
    description: opt.text.split('\n')[0],
    position_type: opt.skill_used || '',
    consequence: opt.consequence,
    // Берём prompt из mirror[id], hint или explanation
    reflection_prompt: reflection?.mirror?.[opt.id] || opt.hint || opt.explanation || '',
  }));
}

/**
 * Маппинг русских уровней на английские
 */
function mapRussianLevel(level?: string): 'low' | 'medium' | 'high' | 'critical' | undefined {
  if (!level) return undefined;
  const map: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    'низкая': 'low',
    'низкое': 'low',
    'низкий': 'low',
    'средняя': 'medium',
    'среднее': 'medium',
    'средний': 'medium',
    'высокая': 'high',
    'высокое': 'high',
    'высокий': 'high',
    'критичное': 'critical',
    'критичный': 'critical',
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'critical': 'critical',
  };
  return map[level.toLowerCase()] || undefined;
}

/**
 * Парсинг старого формата context string
 */
function parseContextString(context: string) {
  const lines = context.split('\n').filter(line => line.trim());
  
  let hook: string | undefined;
  let company: string | undefined;
  let project: string | undefined;
  let situation: string | undefined;
  let history: string | undefined;
  let dilemma: string | undefined;
  let subtitle: string | undefined;
  const dataLines: string[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Hook — первое предложение
    if (index === 0 && trimmed.length < 200) {
      hook = trimmed;
      return;
    }
    
    if (trimmed.match(/^Компания\s*:/i)) {
      company = trimmed.replace(/^Компания\s*:\s*/i, '');
    } else if (trimmed.match(/^Проект\s*:/i)) {
      project = trimmed.replace(/^Проект\s*:\s*/i, '');
    } else if (trimmed.match(/^(Ситуация|Текущая ситуация)\s*:/i)) {
      situation = trimmed.replace(/^(Ситуация|Текущая ситуация)\s*:\s*/i, '');
    } else if (trimmed.match(/^История\s*:/i)) {
      history = trimmed.replace(/^История\s*:\s*/i, '');
    } else if (trimmed.match(/^Дилемма\s*:/i)) {
      dilemma = trimmed.replace(/^Дилемма\s*:\s*/i, '');
    } else if (trimmed.startsWith('•') || trimmed.match(/^\d+\./)) {
      dataLines.push(trimmed.replace(/^[•\d+\.]\s*/, ''));
    }
  });

  // Subtitle из company + project
  if (company || project) {
    subtitle = [company, project].filter(Boolean).join(' · ');
  }

  return { hook, company, project, situation, history, dilemma, subtitle, dataLines };
}

/**
 * Проверяет, поддерживает ли кейс новый формат V2
 */
export function isCaseV2Compatible(apiCase: InteractiveCase): boolean {
  return !!(apiCase.portal && apiCase.event && apiCase.space_map && apiCase.dilemma);
}
