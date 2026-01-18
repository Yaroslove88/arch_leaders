/**
 * Скрипт для конвертации кейсов из YAML в JSON (v2)
 * Поддерживает multiline YAML и мержит с существующими кейсами
 * 
 * Читает файл "ТУТ НОВЫЙ контент кейсов.md" и извлекает все кейсы
 * БЕЗ внешних зависимостей — собственный YAML парсер
 */

const fs = require('fs');
const path = require('path');

// Читаем файлы
const contentFile = path.join(__dirname, '..', 'ТУТ НОВЫЙ контент кейсов.md');
const outputFile = path.join(__dirname, '..', 'data', 'interactive-cases.json');
const backupFile = path.join(__dirname, '..', 'backups', 'cases', `interactive-cases.backup.${Date.now()}.json`);

/**
 * Простой парсер YAML с поддержкой multiline (|)
 */
function parseSimpleYaml(yamlContent) {
  const result = {};
  const lines = yamlContent.split('\n');
  
  const stack = [{ obj: result, indent: -1 }];
  let currentKey = null;
  let multilineValue = null;
  let multilineIndent = 0;
  let inArray = false;
  let currentArray = null;
  let currentArrayKey = null;
  let arrayItemIndent = 0;
  let currentArrayItem = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Пропускаем пустые строки и комментарии (но не в multiline)
    if (multilineValue === null && (!trimmed || trimmed.startsWith('#'))) {
      continue;
    }
    
    // Считаем отступ
    const indent = line.search(/\S/);
    
    // Обработка multiline значения
    if (multilineValue !== null) {
      if (indent > multilineIndent || (indent === multilineIndent && trimmed === '')) {
        multilineValue.push(trimmed);
        continue;
      } else {
        // Конец multiline — сохраняем значение
        const value = multilineValue.join('\n').trim();
        if (currentArrayItem && currentKey) {
          currentArrayItem[currentKey] = value;
        } else {
          const parent = stack[stack.length - 1].obj;
          parent[currentKey] = value;
        }
        multilineValue = null;
        currentKey = null;
      }
    }
    
    // Пропускаем пустые после multiline check
    if (!trimmed) continue;
    
    // Массив элемент (- id: ...)
    if (trimmed.startsWith('- ')) {
      const itemContent = trimmed.substring(2).trim();
      
      // Если это начало нового элемента массива
      if (itemContent.includes(':')) {
        // Сохраняем предыдущий элемент
        if (currentArrayItem && currentArray) {
          currentArray.push(currentArrayItem);
        }
        
        // Создаём новый элемент
        currentArrayItem = {};
        arrayItemIndent = indent;
        
        // Парсим первое поле элемента
        const [key, ...valueParts] = itemContent.split(':');
        const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
        currentArrayItem[key.trim()] = value;
        currentKey = key.trim();
      }
      continue;
    }
    
    // Обычная пара ключ: значение
    if (trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex).trim();
      let value = trimmed.substring(colonIndex + 1).trim();
      
      // Убираем кавычки
      value = value.replace(/^["']|["']$/g, '');
      
      // Multiline начало
      if (value === '|' || value === '>') {
        multilineValue = [];
        multilineIndent = indent;
        currentKey = key;
        continue;
      }
      
      // Массив начало
      if (value === '' && !trimmed.endsWith('|')) {
        // Проверяем, это объект или массив
        const nextLine = lines[i + 1];
        if (nextLine && nextLine.trim().startsWith('-')) {
          // Это массив
          if (currentArrayItem) {
            currentArrayItem[key] = [];
            currentArray = currentArrayItem[key];
          } else {
            const parent = stack[stack.length - 1].obj;
            parent[key] = [];
            currentArray = parent[key];
          }
          currentArrayKey = key;
          continue;
        } else {
          // Это вложенный объект
          const newObj = {};
          if (currentArrayItem && indent > arrayItemIndent) {
            currentArrayItem[key] = newObj;
          } else {
            const parent = stack[stack.length - 1].obj;
            parent[key] = newObj;
          }
          stack.push({ obj: newObj, indent: indent });
          continue;
        }
      }
      
      // Inline массив [a, b, c]
      if (value.startsWith('[') && value.endsWith(']')) {
        const items = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        if (currentArrayItem && indent > arrayItemIndent) {
          currentArrayItem[key] = items;
        } else {
          const parent = stack[stack.length - 1].obj;
          parent[key] = items;
        }
        continue;
      }
      
      // Обычное значение
      if (currentArrayItem && indent > arrayItemIndent) {
        currentArrayItem[key] = value;
        currentKey = key;
      } else {
        // Возвращаемся к правильному уровню
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
          stack.pop();
        }
        const parent = stack[stack.length - 1].obj;
        parent[key] = value;
        currentKey = key;
      }
    }
  }
  
  // Сохраняем последний multiline
  if (multilineValue !== null && currentKey) {
    const value = multilineValue.join('\n').trim();
    if (currentArrayItem) {
      currentArrayItem[currentKey] = value;
    } else {
      const parent = stack[stack.length - 1].obj;
      parent[currentKey] = value;
    }
  }
  
  // Сохраняем последний элемент массива
  if (currentArrayItem && currentArray) {
    currentArray.push(currentArrayItem);
  }
  
  return result;
}

/**
 * Парсит полный YAML блок кейса с case_card структурой
 */
function parseCaseYaml(yamlContent) {
  const lines = yamlContent.split('\n');
  const result = {
    meta: {},
    portal: {},
    event: {},
    context: { space_map: {} },
    facts: {},
    background: {},
    dilemma: {},
    positions: [],
    indicators: {},
    reflection: { questions: [], after_choice_insights: [] }
  };
  
  let currentSection = null;
  let currentPosition = null;
  let currentSubSection = null;
  let multilineKey = null;
  let multilineValue = [];
  let multilineIndent = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const indent = line.search(/\S/);
    
    // Обработка multiline
    if (multilineKey !== null) {
      if (indent > multilineIndent && trimmed) {
        multilineValue.push(trimmed);
        continue;
      } else {
        // Сохраняем multiline значение
        const value = multilineValue.join('\n').trim();
        if (currentPosition && currentSubSection === 'consequence') {
          currentPosition.consequence[multilineKey] = value;
        } else if (currentPosition) {
          currentPosition[multilineKey] = value;
        } else if (currentSection === 'space_map' || currentSubSection === 'space_map') {
          result.context.space_map[multilineKey] = value;
        } else if (currentSection === 'facts') {
          result.facts[multilineKey] = value;
        } else if (currentSection === 'background') {
          result.background[multilineKey] = value;
        } else if (currentSection === 'dilemma') {
          result.dilemma[multilineKey] = value;
        } else if (currentSection === 'event') {
          result.event[multilineKey] = value;
        } else if (currentSection === 'portal') {
          result.portal[multilineKey] = value;
        } else if (currentSection === 'meta') {
          result.meta[multilineKey] = value;
        }
        multilineKey = null;
        multilineValue = [];
      }
    }
    
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Определяем секции
    if (trimmed === 'case_card:') continue;
    if (trimmed === 'meta:') { currentSection = 'meta'; currentSubSection = null; continue; }
    if (trimmed === 'portal:') { currentSection = 'portal'; currentSubSection = null; continue; }
    if (trimmed === 'event:') { currentSection = 'event'; currentSubSection = null; continue; }
    if (trimmed === 'context:') { currentSection = 'context'; currentSubSection = null; continue; }
    if (trimmed === 'space_map:') { currentSubSection = 'space_map'; continue; }
    if (trimmed === 'facts:') { currentSection = 'facts'; currentSubSection = null; continue; }
    if (trimmed === 'background:') { currentSection = 'background'; currentSubSection = null; continue; }
    if (trimmed === 'dilemma:') { currentSection = 'dilemma'; currentSubSection = null; continue; }
    if (trimmed === 'positions:') { currentSection = 'positions'; currentSubSection = null; continue; }
    if (trimmed === 'indicators:') { currentSection = 'indicators'; currentSubSection = null; continue; }
    if (trimmed === 'reflection:') { currentSection = 'reflection'; currentSubSection = null; continue; }
    if (trimmed === 'consequence:') { currentSubSection = 'consequence'; if (currentPosition) currentPosition.consequence = {}; continue; }
    if (trimmed === 'questions:') { currentSubSection = 'questions'; continue; }
    if (trimmed === 'after_choice_insights:') { currentSubSection = 'after_choice_insights'; continue; }
    
    // Новый элемент массива positions
    if (currentSection === 'positions' && trimmed.startsWith('- id:')) {
      if (currentPosition) {
        result.positions.push(currentPosition);
      }
      currentPosition = { 
        id: trimmed.replace('- id:', '').trim().replace(/"/g, ''),
        consequence: {}
      };
      currentSubSection = null;
      continue;
    }
    
    // Элемент массива (questions, after_choice_insights)
    if (trimmed.startsWith('- "') || trimmed.startsWith("- '") || (trimmed.startsWith('- ') && currentSubSection)) {
      let value = trimmed.substring(2).trim().replace(/^["']|["']$/g, '');
      if (currentSubSection === 'questions') {
        result.reflection.questions.push(value);
      } else if (currentSubSection === 'after_choice_insights') {
        result.reflection.after_choice_insights.push(value);
      }
      continue;
    }
    
    // Парсим ключ: значение
    if (trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex).trim();
      let value = trimmed.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      
      // Multiline начало
      if (value === '|' || value === '>') {
        multilineKey = key;
        multilineValue = [];
        multilineIndent = indent;
        continue;
      }
      
      // Inline array
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      }
      
      // Сохраняем в нужную секцию
      if (currentPosition) {
        if (currentSubSection === 'consequence') {
          currentPosition.consequence[key] = value;
        } else {
          currentPosition[key] = value;
        }
      } else if (currentSection === 'meta') {
        result.meta[key] = value;
      } else if (currentSection === 'portal') {
        result.portal[key] = value;
      } else if (currentSection === 'event') {
        result.event[key] = value;
      } else if (currentSubSection === 'space_map' || currentSection === 'space_map') {
        result.context.space_map[key] = value;
      } else if (currentSection === 'facts') {
        result.facts[key] = value;
      } else if (currentSection === 'background') {
        result.background[key] = value;
      } else if (currentSection === 'dilemma') {
        result.dilemma[key] = value;
      } else if (currentSection === 'indicators') {
        result.indicators[key] = value;
      } else if (currentSection === 'reflection') {
        if (key === 'key_insight') {
          result.reflection.key_insight = value;
        }
      }
    }
  }
  
  // Сохраняем последнюю позицию
  if (currentPosition) {
    result.positions.push(currentPosition);
  }
  
  return result;
}

/**
 * Конвертирует спарсенный YAML в формат JSON для API
 */
function convertToApiFormat(parsed) {
  const meta = parsed.meta || {};
  const portal = parsed.portal || {};
  const event = parsed.event || {};
  const spaceMap = parsed.context?.space_map || {};
  const facts = parsed.facts || {};
  const background = parsed.background || {};
  const dilemma = parsed.dilemma || {};
  const positions = parsed.positions || [];
  const indicators = parsed.indicators || {};
  const reflection = parsed.reflection || {};
  
  // Маппинг difficulty
  let difficulty = 'intermediate';
  const accessLevel = meta.access_level || '';
  if (accessLevel === 'базовый' || accessLevel === 'I' || accessLevel === 'basic') {
    difficulty = 'basic';
  } else if (accessLevel === 'промежуточный' || accessLevel === 'II' || accessLevel === 'intermediate') {
    difficulty = 'intermediate';
  } else if (accessLevel === 'продвинутый' || accessLevel === 'III' || accessLevel === 'advanced') {
    difficulty = 'advanced';
  }
  
  // Собираем options для обратной совместимости
  const options = positions.map(pos => ({
    id: pos.id,
    text: pos.description || '',
    skill_used: pos.position_type || '',
    consequence: {
      immediate: pos.consequence?.immediate || '',
      second_order: pos.consequence?.second_order || '',
      systemic: pos.consequence?.systemic || ''
    },
    hint: pos.reflection_prompt || ''
  }));
  
  // Генерируем context string для обратной совместимости
  const contextParts = [];
  if (spaceMap.company) contextParts.push(`Компания: ${spaceMap.company}`);
  if (spaceMap.environment) contextParts.push(`Среда: ${spaceMap.environment}`);
  if (spaceMap.constraints) contextParts.push(`Ограничения: ${spaceMap.constraints}`);
  if (spaceMap.people) contextParts.push(`Участники: ${spaceMap.people}`);
  if (spaceMap.mode) contextParts.push(`Режим: ${spaceMap.mode}`);
  
  const result = {
    id: meta.case_id,
    title: portal.case_name || meta.case_id,
    node_id: meta.node_id,
    branch_id: meta.branch_id,
    difficulty: difficulty,
    
    // V2 формат
    portal: {
      header_title: portal.header_title || 'КЕЙС',
      case_name: portal.case_name || meta.case_id,
      subtitle: portal.subtitle || '',
      marker_icons: portal.marker_icons,
      access_bar: portal.access_bar
    },
    event: {
      label: event.label || 'Ситуация',
      summary: event.summary || '',
      urgency: event.urgency
    },
    space_map: {
      company: spaceMap.company || '',
      environment: spaceMap.environment || '',
      constraints: spaceMap.constraints || '',
      people: spaceMap.people || '',
      mode: spaceMap.mode || ''
    },
    dilemma: {
      question: dilemma.question || 'Какое решение ты примешь?',
      ambiance: dilemma.ambiance
    },
    positions: positions.map(pos => ({
      id: pos.id,
      description: pos.description || '',
      position_type: pos.position_type || '',
      consequence: pos.consequence || {},
      reflection_prompt: pos.reflection_prompt || ''
    })),
    
    // V1 формат (обратная совместимость)
    context: contextParts.join('\n'),
    options: options,
    reflection: {
      questions: reflection.questions || [],
      after_choice_insights: reflection.after_choice_insights,
      key_insight: reflection.key_insight
    },
    
    // Дополнительные поля V2
    maturity_level: meta.maturity_level,
    symbols: meta.symbols,
    strategic_tags: meta.strategic_tags,
    pressure_level: meta.pressure_level,
    uncertainty: meta.uncertainty,
    subjectivity_load: meta.subjectivity_load,
    systemic_regress_risk: meta.systemic_regress_risk
  };
  
  // Добавляем опциональные поля если есть данные
  if (facts.strict_facts) {
    result.facts = { strict_facts: facts.strict_facts };
  }
  if (background.story) {
    result.background = { story: background.story };
  }
  if (Object.keys(indicators).length > 0) {
    result.indicators = indicators;
  }
  
  // Удаляем undefined и пустые поля
  Object.keys(result).forEach(key => {
    if (result[key] === undefined || result[key] === null) {
      delete result[key];
    }
  });
  
  return result;
}

/**
 * Извлекает YAML блоки из markdown
 */
function extractYamlBlocks(content) {
  const blocks = [];
  const yamlBlockRegex = /```yaml\s*\n([\s\S]*?)```/g;
  let match;
  
  while ((match = yamlBlockRegex.exec(content)) !== null) {
    const yamlContent = match[1];
    if (yamlContent.includes('case_id:') && yamlContent.includes('positions:')) {
      blocks.push(yamlContent);
    }
  }
  
  return blocks;
}

// ==================== MAIN ====================

console.log('=== Convert YAML Cases to JSON (v2) ===\n');

// Читаем контент
console.log('Reading content file...');
const content = fs.readFileSync(contentFile, 'utf-8');

// Извлекаем YAML блоки
console.log('Extracting YAML blocks...');
const yamlBlocks = extractYamlBlocks(content);
console.log(`Found ${yamlBlocks.length} YAML blocks`);

// Парсим кейсы
console.log('Parsing cases...');
let newCases = [];
for (const block of yamlBlocks) {
  try {
    const parsed = parseCaseYaml(block);
    if (parsed.meta?.case_id) {
      const apiCase = convertToApiFormat(parsed);
      if (apiCase.id) {
        newCases.push(apiCase);
      }
    }
  } catch (e) {
    console.error('Error parsing block:', e.message);
  }
}

// Фильтруем шаблоны и невалидные кейсы
newCases = newCases.filter(c => {
  if (!c.id || c.id === 'string' || c.id.includes('Example') || c.id.includes('<')) {
    console.log(`  Skipping template: ${c.id}`);
    return false;
  }
  if (!c.positions || c.positions.length === 0) {
    console.log(`  Skipping (no positions): ${c.id}`);
    return false;
  }
  const hasValidPositions = c.positions.some(p => 
    p.description && p.description.length > 3
  );
  if (!hasValidPositions) {
    console.log(`  Skipping (invalid positions): ${c.id}`);
    return false;
  }
  return true;
});

console.log(`Valid new cases: ${newCases.length}`);

// Читаем существующий JSON
console.log('\nReading existing JSON...');
let existingData = { interactive_cases: [] };
try {
  existingData = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
  console.log(`Existing cases: ${existingData.interactive_cases.length}`);
} catch (e) {
  console.log('No existing JSON found, creating new');
}

// Создаём бэкап
console.log('\nCreating backup...');
const backupDir = path.dirname(backupFile);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}
fs.writeFileSync(backupFile, JSON.stringify(existingData, null, 2), 'utf-8');
console.log(`Backup saved: ${backupFile}`);

// Мержим кейсы (новые заменяют старые по ID)
const existingMap = new Map();
for (const c of existingData.interactive_cases) {
  existingMap.set(c.id, c);
}

let addedCount = 0;
let updatedCount = 0;

for (const newCase of newCases) {
  if (existingMap.has(newCase.id)) {
    updatedCount++;
  } else {
    addedCount++;
  }
  existingMap.set(newCase.id, newCase);
}

// Собираем финальный список
const mergedCases = Array.from(existingMap.values());

// Записываем результат
console.log('\nWriting output...');
const output = { interactive_cases: mergedCases };
fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');

// Статистика
console.log('\n=== Summary ===');
console.log(`Total cases: ${mergedCases.length}`);
console.log(`Added: ${addedCount}`);
console.log(`Updated: ${updatedCount}`);

const byDifficulty = {};
mergedCases.forEach(c => {
  byDifficulty[c.difficulty] = (byDifficulty[c.difficulty] || 0) + 1;
});
console.log('By difficulty:', byDifficulty);

const byBranch = {};
mergedCases.forEach(c => {
  if (c.branch_id) {
    byBranch[c.branch_id] = (byBranch[c.branch_id] || 0) + 1;
  }
});
console.log('By branch:', byBranch);

console.log(`\nOutput: ${outputFile}`);
