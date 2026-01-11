/**
 * Скрипт для конвертации кейсов из YAML в JSON
 * Читает файл "ТУТ НОВЫЙ контент кейсов.md" и извлекает все кейсы
 */

const fs = require('fs');
const path = require('path');

// Читаем файл с контентом
const contentFile = path.join(__dirname, '..', 'ТУТ НОВЫЙ контент кейсов.md');
const outputFile = path.join(__dirname, '..', 'data', 'interactive-cases.json');

const content = fs.readFileSync(contentFile, 'utf-8');

// Функция для парсинга YAML-подобного блока кейса
function parseCase(yamlBlock) {
  const lines = yamlBlock.split('\n');
  const result = {
    options: [],
    positions: [],
    reflection: { questions: [] }
  };

  let currentSection = null;
  let currentPosition = null;
  let currentConsequence = null;
  let inPositions = false;
  let inReflection = false;
  let inSpaceMap = false;
  let inFacts = false;
  let inBackground = false;
  let inDilemma = false;
  let inEvent = false;
  let inPortal = false;
  let inIndicators = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    // Определяем секции верхнего уровня
    if (trimmed.startsWith('case_id:')) {
      result.id = trimmed.replace('case_id:', '').trim().replace(/"/g, '');
    } else if (trimmed.startsWith('node_id:')) {
      result.node_id = trimmed.replace('node_id:', '').trim().replace(/"/g, '');
    } else if (trimmed.startsWith('branch_id:')) {
      result.branch_id = trimmed.replace('branch_id:', '').trim().replace(/"/g, '');
    } else if (trimmed.startsWith('access_level:')) {
      const level = trimmed.replace('access_level:', '').trim().replace(/"/g, '');
      // Маппинг уровней
      if (level === 'базовый' || level === 'I') result.difficulty = 'basic';
      else if (level === 'промежуточный' || level === 'II') result.difficulty = 'intermediate';
      else if (level === 'продвинутый' || level === 'III') result.difficulty = 'advanced';
      else result.difficulty = 'intermediate';
    } else if (trimmed.startsWith('maturity_level:')) {
      result.maturity_level = trimmed.replace('maturity_level:', '').trim().replace(/"/g, '');
    } else if (trimmed.startsWith('pressure_level:')) {
      result.pressure_level = trimmed.replace('pressure_level:', '').trim().replace(/"/g, '');
    } else if (trimmed.startsWith('uncertainty:') && !inIndicators) {
      result.uncertainty = trimmed.replace('uncertainty:', '').trim().replace(/"/g, '');
    } else if (trimmed.startsWith('subjectivity_load:')) {
      result.subjectivity_load = trimmed.replace('subjectivity_load:', '').trim().replace(/"/g, '');
    } else if (trimmed.startsWith('systemic_regress_risk:')) {
      result.systemic_regress_risk = trimmed.replace('systemic_regress_risk:', '').trim().replace(/"/g, '');
    } else if (trimmed.startsWith('symbols:')) {
      const symbolsStr = trimmed.replace('symbols:', '').trim();
      if (symbolsStr.startsWith('[')) {
        result.symbols = symbolsStr.replace(/[\[\]]/g, '').split(',').map(s => s.trim().replace(/"/g, ''));
      }
    } else if (trimmed.startsWith('strategic_tags:')) {
      const tagsStr = trimmed.replace('strategic_tags:', '').trim();
      if (tagsStr.startsWith('[')) {
        result.strategic_tags = tagsStr.replace(/[\[\]]/g, '').split(',').map(s => s.trim().replace(/"/g, ''));
      }
    }

    // Portal section
    else if (trimmed === 'portal:') {
      inPortal = true;
      result.portal = {};
    } else if (inPortal && trimmed.startsWith('header_title:')) {
      result.portal.header_title = trimmed.replace('header_title:', '').trim().replace(/"/g, '');
    } else if (inPortal && trimmed.startsWith('case_name:')) {
      result.portal.case_name = trimmed.replace('case_name:', '').trim().replace(/"/g, '');
      result.title = result.portal.case_name;
    } else if (inPortal && trimmed.startsWith('subtitle:')) {
      result.portal.subtitle = trimmed.replace('subtitle:', '').trim().replace(/"/g, '');
    } else if (inPortal && trimmed.startsWith('marker_icons:')) {
      const iconsStr = trimmed.replace('marker_icons:', '').trim();
      if (iconsStr.startsWith('[')) {
        result.portal.marker_icons = iconsStr.replace(/[\[\]]/g, '').split(',').map(s => s.trim().replace(/"/g, ''));
      }
    } else if (inPortal && trimmed.startsWith('access_bar:')) {
      result.portal.access_bar = trimmed.replace('access_bar:', '').trim().replace(/"/g, '');
      inPortal = false;
    }

    // Event section
    else if (trimmed === 'event:') {
      inEvent = true;
      result.event = {};
    } else if (inEvent && trimmed.startsWith('label:')) {
      result.event.label = trimmed.replace('label:', '').trim().replace(/"/g, '');
    } else if (inEvent && trimmed.startsWith('summary:')) {
      result.event.summary = trimmed.replace('summary:', '').trim().replace(/"/g, '');
    } else if (inEvent && trimmed.startsWith('urgency:')) {
      result.event.urgency = trimmed.replace('urgency:', '').trim().replace(/"/g, '');
      inEvent = false;
    }

    // Context / space_map section
    else if (trimmed === 'context:' || trimmed === 'space_map:') {
      inSpaceMap = true;
      result.space_map = {};
    } else if (inSpaceMap && trimmed.startsWith('company:')) {
      result.space_map.company = trimmed.replace('company:', '').trim().replace(/"/g, '');
    } else if (inSpaceMap && trimmed.startsWith('environment:')) {
      result.space_map.environment = trimmed.replace('environment:', '').trim().replace(/"/g, '');
    } else if (inSpaceMap && trimmed.startsWith('constraints:')) {
      result.space_map.constraints = trimmed.replace('constraints:', '').trim().replace(/"/g, '');
    } else if (inSpaceMap && trimmed.startsWith('people:')) {
      result.space_map.people = trimmed.replace('people:', '').trim().replace(/"/g, '');
    } else if (inSpaceMap && trimmed.startsWith('mode:')) {
      result.space_map.mode = trimmed.replace('mode:', '').trim().replace(/"/g, '');
      inSpaceMap = false;
    }

    // Facts section
    else if (trimmed === 'facts:') {
      inFacts = true;
      result.facts = {};
    } else if (inFacts && trimmed.startsWith('strict_facts:')) {
      result.facts.strict_facts = trimmed.replace('strict_facts:', '').trim().replace(/"/g, '');
      inFacts = false;
    }

    // Background section
    else if (trimmed === 'background:') {
      inBackground = true;
      result.background = {};
    } else if (inBackground && trimmed.startsWith('story:')) {
      result.background.story = trimmed.replace('story:', '').trim().replace(/"/g, '');
      inBackground = false;
    }

    // Dilemma section
    else if (trimmed === 'dilemma:') {
      inDilemma = true;
      result.dilemma = {};
    } else if (inDilemma && trimmed.startsWith('question:')) {
      result.dilemma.question = trimmed.replace('question:', '').trim().replace(/"/g, '');
    } else if (inDilemma && trimmed.startsWith('ambiance:')) {
      result.dilemma.ambiance = trimmed.replace('ambiance:', '').trim().replace(/"/g, '');
      inDilemma = false;
    }

    // Positions section
    else if (trimmed === 'positions:') {
      inPositions = true;
      currentPosition = null;
    } else if (inPositions && trimmed.startsWith('- id:')) {
      // Не добавляем здесь - добавление происходит при reflection_prompt
      currentPosition = {
        id: trimmed.replace('- id:', '').trim().replace(/"/g, ''),
        consequence: {}
      };
      currentConsequence = null;
    } else if (inPositions && currentPosition && trimmed.startsWith('description:')) {
      currentPosition.description = trimmed.replace('description:', '').trim().replace(/"/g, '');
    } else if (inPositions && currentPosition && trimmed.startsWith('position_type:')) {
      currentPosition.position_type = trimmed.replace('position_type:', '').trim().replace(/"/g, '');
    } else if (inPositions && currentPosition && trimmed.startsWith('consequence:')) {
      currentConsequence = currentPosition.consequence;
    } else if (inPositions && currentConsequence && trimmed.startsWith('immediate:')) {
      currentConsequence.immediate = trimmed.replace('immediate:', '').trim().replace(/"/g, '');
    } else if (inPositions && currentConsequence && trimmed.startsWith('second_order:')) {
      currentConsequence.second_order = trimmed.replace('second_order:', '').trim().replace(/"/g, '');
    } else if (inPositions && currentConsequence && trimmed.startsWith('systemic:')) {
      currentConsequence.systemic = trimmed.replace('systemic:', '').trim().replace(/"/g, '');
    } else if (inPositions && currentPosition && trimmed.startsWith('reflection_prompt:')) {
      currentPosition.reflection_prompt = trimmed.replace('reflection_prompt:', '').trim().replace(/"/g, '');
      // Добавляем position в массивы
      result.positions.push({...currentPosition});
      // В options.text НЕ включаем position_type - он показывается только после выбора
      result.options.push({
        id: currentPosition.id,
        text: currentPosition.description, // Только описание, без position_type
        skill_used: currentPosition.position_type,
        consequence: currentPosition.consequence,
        hint: currentPosition.reflection_prompt
      });
      currentPosition = null;
      currentConsequence = null;
    }

    // Indicators section
    else if (trimmed === 'indicators:') {
      inIndicators = true;
      result.indicators = {};
    } else if (inIndicators && trimmed.startsWith('maturity:')) {
      result.indicators.maturity = trimmed.replace('maturity:', '').trim().replace(/"/g, '');
    } else if (inIndicators && trimmed.startsWith('uncertainty:')) {
      result.indicators.uncertainty = trimmed.replace('uncertainty:', '').trim().replace(/"/g, '');
    } else if (inIndicators && trimmed.startsWith('subjectivity:')) {
      result.indicators.subjectivity = trimmed.replace('subjectivity:', '').trim().replace(/"/g, '');
    } else if (inIndicators && trimmed.startsWith('regress_risk:')) {
      result.indicators.regress_risk = trimmed.replace('regress_risk:', '').trim().replace(/"/g, '');
      inIndicators = false;
    }

    // Reflection section
    else if (trimmed === 'reflection:') {
      inReflection = true;
      inPositions = false;
      currentPosition = null;
      currentConsequence = null;
    } else if (inReflection && trimmed.startsWith('questions:')) {
      // Начало массива вопросов
    } else if (inReflection && trimmed.startsWith('- "')) {
      const question = trimmed.replace(/^- "/, '').replace(/"$/, '');
      result.reflection.questions.push(question);
    } else if (inReflection && trimmed.startsWith('after_choice_insights:')) {
      result.reflection.after_choice_insights = [];
    } else if (inReflection && result.reflection.after_choice_insights && trimmed.startsWith('- "')) {
      const insight = trimmed.replace(/^- "/, '').replace(/"$/, '');
      result.reflection.after_choice_insights.push(insight);
    }
  }

  // Позиции добавляются при парсинге reflection_prompt

  // Генерируем context для обратной совместимости
  if (result.space_map) {
    result.context = Object.entries(result.space_map)
      .filter(([k, v]) => v)
      .map(([k, v]) => {
        const labels = {
          company: 'Компания',
          environment: 'Среда',
          constraints: 'Ограничения',
          people: 'Участники',
          mode: 'Режим'
        };
        return `${labels[k] || k}: ${v}`;
      })
      .join('\n');
  }

  return result;
}

// Извлекаем блоки кейсов из файла
function extractCases(content) {
  const cases = [];

  // Ищем блоки case_card: или просто case_id:
  const casePattern = /case_card:\s*\n([\s\S]*?)(?=\n---|\ncase_card:|\n##|$)/g;
  const simplePattern = /case_id:\s*["']?(\w+)["']?\s*\n([\s\S]*?)(?=\ncase_id:|$)/g;

  let match;

  // Сначала пробуем найти блоки case_card
  const blocks = content.split(/\n---\n|\n## /);

  for (const block of blocks) {
    if (block.includes('case_id:') && block.includes('positions:')) {
      try {
        const parsed = parseCase(block);
        if (parsed.id && parsed.title && parsed.positions.length > 0) {
          cases.push(parsed);
        }
      } catch (e) {
        console.error('Error parsing case block:', e.message);
      }
    }
  }

  return cases;
}

// Основная логика
console.log('Reading content file...');
let cases = extractCases(content);

// Фильтруем шаблоны и невалидные кейсы
cases = cases.filter(c => {
  // Пропускаем шаблоны со значением "string"
  if (c.id === 'string' || c.title === 'string' || c.id?.includes('string')) {
    console.log('Skipping template case (string placeholder)');
    return false;
  }
  // Пропускаем шаблоны с placeholder значениями вида <node>, <branch>
  if (c.node_id?.includes('<') || c.branch_id?.includes('<') || c.id?.includes('Example')) {
    console.log(`Skipping template case: ${c.id}`);
    return false;
  }
  // Пропускаем кейсы без валидных позиций
  if (!c.positions || c.positions.length === 0) {
    console.log(`Skipping case ${c.id} - no positions`);
    return false;
  }
  // Проверяем что позиции имеют реальные данные
  const hasValidPositions = c.positions.some(p =>
    p.description && p.description !== 'string' && p.description.length > 5
  );
  if (!hasValidPositions) {
    console.log(`Skipping case ${c.id} - invalid positions`);
    return false;
  }
  return true;
});

console.log(`Found ${cases.length} valid cases`);

// Исправляем дубликаты ID
const seenIds = new Set();
cases.forEach((c, index) => {
  let originalId = c.id;
  let counter = 1;
  while (seenIds.has(c.id)) {
    c.id = `${originalId}_v${counter}`;
    counter++;
  }
  if (c.id !== originalId) {
    console.log(`Fixing duplicate ID: ${originalId} -> ${c.id}`);
  }
  seenIds.add(c.id);
});

// Записываем результат
const output = {
  interactive_cases: cases
};

fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');
console.log(`Written ${cases.length} cases to ${outputFile}`);

// Выводим статистику
const byDifficulty = {};
cases.forEach(c => {
  byDifficulty[c.difficulty] = (byDifficulty[c.difficulty] || 0) + 1;
});
console.log('By difficulty:', byDifficulty);
