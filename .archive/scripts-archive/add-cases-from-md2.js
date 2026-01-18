const fs = require('fs');
const path = require('path');

// Функция для очистки markdown из текста
function cleanMarkdown(text) {
  if (!text) return text;
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Читаем MD файл с новыми кейсами
const mdContent = fs.readFileSync(path.join(__dirname, '../cases-enriched2.md'), 'utf8');

// Читаем существующий JSON
const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/interactive-cases.json'), 'utf8'));

// Создаём мапу существующих кейсов по ID для проверки дубликатов
const existingCaseIds = new Set(jsonData.interactive_cases.map(c => c.id));

// Парсим MD и извлекаем кейсы
const caseBlocks = mdContent.split(/^## \d+\. /m).slice(1); // Пропускаем заголовок

const newCases = [];

caseBlocks.forEach((block) => {
  const lines = block.split('\n');
  
  // Извлекаем метаданные
  const idMatch = block.match(/\*\*ID:\*\*\s+`([^`]+)`/);
  const nodeIdMatch = block.match(/\*\*Узел:\*\*\s+(\S+)/);
  const branchIdMatch = block.match(/\*\*Ветка:\*\*\s+(\S+)/);
  const difficultyMatch = block.match(/\*\*Сложность:\*\*\s+(\S+)/);
  const titleMatch = block.match(/^## \d+\. (.+?)\n/);
  
  if (!idMatch || !nodeIdMatch || !branchIdMatch || !difficultyMatch) {
    console.log('Пропущен блок - не хватает метаданных');
    return;
  }
  
  const id = idMatch[1];
  const nodeId = nodeIdMatch[1];
  const branchId = branchIdMatch[1];
  const difficulty = difficultyMatch[1];
  const title = titleMatch ? titleMatch[1] : block.split('\n')[0].trim();
  
  // Проверяем дубликаты
  if (existingCaseIds.has(id)) {
    console.log(`Пропущен дубликат: ${id}`);
    return;
  }
  
  // Извлекаем контекст
  let contextStart = block.indexOf('### Контекст');
  let contextEnd = block.indexOf('### Индикаторы', contextStart);
  if (contextEnd === -1) contextEnd = block.indexOf('### Паттерн', contextStart);
  if (contextEnd === -1) contextEnd = block.indexOf('### Варианты действий', contextStart);
  
  let context = '';
  if (contextStart !== -1 && contextEnd !== -1) {
    context = block.substring(contextStart + '### Контекст'.length, contextEnd)
      .split('\n')
      .filter(line => !line.trim().startsWith('**') || !line.trim().endsWith('**'))
      .join('\n')
      .trim();
    context = cleanMarkdown(context);
  }
  
  // Извлекаем индикаторы
  const indicators = {};
  const indicatorsMatch = block.match(/### Индикаторы\n\n((?:- \*\*[^*]+\*\*:[^\n]+\n?)+)/);
  if (indicatorsMatch) {
    indicatorsMatch[1].split('\n').forEach(line => {
      const match = line.match(/- \*\*([^*]+)\*\*:\s*(\S+)/);
      if (match) {
        indicators[match[1]] = match[2];
      }
    });
  }
  
  // Извлекаем паттерн (опционально)
  let pattern = null;
  const patternMatch = block.match(/### Паттерн\n\n- \*\*Триггер:\*\* ([^\n]+)\n- \*\*Поведение:\*\* ([^\n]+)\n- \*\*Результат:\*\* ([^\n]+)/);
  if (patternMatch) {
    pattern = {
      trigger: patternMatch[1],
      behavior: patternMatch[2],
      result: patternMatch[3]
    };
  }
  
  // Извлекаем варианты действий
  const options = [];
  const optionsStart = block.indexOf('### Варианты действий');
  if (optionsStart !== -1) {
    const optionsBlock = block.substring(optionsStart);
    const optionMatches = optionsBlock.matchAll(/#### ([A-D])\. (.+?)\n\n\*\*Навык:\*\* (.+?)\n\n\*\*Последствия:\*\*\n- \*\*Немедленные:\*\* (.+?)\n- \*\*Второго порядка:\*\* (.+?)\n- \*\*Системные:\*\* (.+?)\n\n/g);
    
    for (const match of optionMatches) {
      const optionId = match[1];
      const optionText = match[2];
      const skillUsed = match[3];
      const immediate = match[4];
      const secondOrder = match[5];
      const systemic = match[6];
      
      // Извлекаем sm_impact
      const smImpact = {};
      const smImpactMatch = optionsBlock.substring(match.index).match(/\*\*Влияние на систему:\*\*\n((?:- [CKRSF]: [^\n]+\n?)+)/);
      if (smImpactMatch) {
        smImpactMatch[1].split('\n').forEach(line => {
          const impactMatch = line.match(/- ([CKRSF]):\s*([+-]?\d+)/);
          if (impactMatch) {
            smImpact[impactMatch[1]] = parseInt(impactMatch[2]);
          }
        });
      }
      
      // Извлекаем hint, warning, explanation
      const hintMatch = optionsBlock.substring(match.index).match(/💡 \*\*Подсказка:\*\* (.+?)(?:\n\n|$)/);
      const warningMatch = optionsBlock.substring(match.index).match(/⚠️ \*\*Предупреждение:\*\* (.+?)(?:\n\n|$)/);
      const explanationMatch = optionsBlock.substring(match.index).match(/📝 \*\*Объяснение:\*\* (.+?)(?:\n\n|###|$)/);
      
      const option = {
        id: optionId,
        text: optionText,
        skill_used: skillUsed,
        consequence: {
          immediate: immediate.trim(),
          second_order: secondOrder.trim(),
          systemic: systemic.trim()
        }
      };
      
      if (Object.keys(smImpact).length > 0) {
        option.sm_impact = smImpact;
      }
      
      if (hintMatch) option.hint = hintMatch[1].trim();
      if (warningMatch) option.warning = warningMatch[1].trim();
      if (explanationMatch) option.explanation = explanationMatch[1].trim();
      
      options.push(option);
    }
  }
  
  // Извлекаем рефлексию
  const reflection = {};
  const reflectionStart = block.indexOf('### Рефлексия');
  if (reflectionStart !== -1) {
    const reflectionBlock = block.substring(reflectionStart);
    
    // Вопросы
    const questionsMatch = reflectionBlock.match(/\*\*Вопросы:\*\*\n((?:- [^\n]+\n?)+)/);
    if (questionsMatch) {
      reflection.questions = questionsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(q => q);
    }
    
    // Зеркало
    const mirror = {};
    const mirrorMatches = reflectionBlock.matchAll(/- \*\*([A-D]):\*\* (.+?)(?:\n|$)/g);
    for (const match of mirrorMatches) {
      mirror[match[1]] = match[2].trim();
    }
    if (Object.keys(mirror).length > 0) {
      reflection.mirror = mirror;
    }
    
    // Ключевое понимание
    const keyInsightMatch = reflectionBlock.match(/\*\*Ключевое понимание:\*\* (.+?)(?:\n\n|---|$)/);
    if (keyInsightMatch) {
      reflection.key_insight = keyInsightMatch[1].trim();
    }
  }
  
  // Создаём объект кейса
  const caseObj = {
    id,
    title: title.trim(),
    node_id: nodeId,
    branch_id: branchId,
    difficulty,
    context: context.trim()
  };
  
  if (Object.keys(indicators).length > 0) {
    caseObj.indicators = indicators;
  }
  
  if (pattern) {
    caseObj.pattern = pattern;
  }
  
  if (options.length > 0) {
    caseObj.options = options;
  }
  
  if (Object.keys(reflection).length > 0) {
    caseObj.reflection = reflection;
  }
  
  newCases.push(caseObj);
  existingCaseIds.add(id);
});

// Добавляем новые кейсы в JSON
jsonData.interactive_cases.push(...newCases);

// Сохраняем обновлённый JSON
fs.writeFileSync(
  path.join(__dirname, '../data/interactive-cases.json'),
  JSON.stringify(jsonData, null, 2),
  'utf8'
);

console.log(`Добавлено ${newCases.length} новых кейсов в JSON`);
console.log(`Всего кейсов в файле: ${jsonData.interactive_cases.length}`);
