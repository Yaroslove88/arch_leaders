import * as fs from 'fs';
import * as path from 'path';

interface CaseOption {
  id: string;
  text: string;
  skill_used?: string;
  consequence: {
    immediate: string;
    second_order: string;
    systemic: string;
  };
  sm_impact?: Record<string, number>;
  hint?: string;
  warning?: string;
  explanation?: string;
}

interface CaseReflection {
  questions: string[];
  mirror?: Record<string, string>;
  key_insight?: string;
}

interface ParsedCase {
  id: string;
  title: string;
  node_id?: string;
  branch_id?: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  context: string;
  indicators?: Record<string, string>;
  pattern?: {
    trigger: string;
    behavior: string;
    result: string;
  };
  options?: CaseOption[];
  reflection?: CaseReflection;
}

function cleanMarkdown(text: string): string {
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

function parseCaseBlock(block: string): ParsedCase | null {
  // Извлекаем метаданные
  const idMatch = block.match(/\*\*ID:\*\*\s+`([^`]+)`/);
  const nodeIdMatch = block.match(/\*\*Узел:\*\*\s+(\S+)/);
  const branchIdMatch = block.match(/\*\*Ветка:\*\*\s+(\S+)/);
  const difficultyMatch = block.match(/\*\*Сложность:\*\*\s+(\S+)/);
  const titleMatch = block.match(/^## \d+\. (.+?)$/m) || block.match(/^## (.+?)$/m);
  
  if (!idMatch) {
    return null;
  }
  
  const id = idMatch[1];
  const nodeId = nodeIdMatch ? nodeIdMatch[1] : undefined;
  const branchId = branchIdMatch ? branchIdMatch[1] : undefined;
  const difficulty = (difficultyMatch ? difficultyMatch[1] : 'basic') as 'basic' | 'intermediate' | 'advanced';
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  // Извлекаем контекст
  let context = '';
  const contextStart = block.indexOf('### Контекст');
  if (contextStart !== -1) {
    let contextEnd = block.indexOf('### Индикаторы', contextStart);
    if (contextEnd === -1) contextEnd = block.indexOf('### Паттерн', contextStart);
    if (contextEnd === -1) contextEnd = block.indexOf('### Варианты действий', contextStart);
    if (contextEnd === -1) contextEnd = block.indexOf('### Рефлексия', contextStart);
    if (contextEnd === -1) contextEnd = block.length;
    
    context = block.substring(contextStart + '### Контекст'.length, contextEnd)
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('**') || line.includes(':'))
      .join('\n')
      .trim();
    context = cleanMarkdown(context);
  }
  
  // Извлекаем индикаторы
  const indicators: Record<string, string> = {};
  const indicatorsMatch = block.match(/### Индикаторы\n\n((?:- \*\*[^*]+\*\*:[^\n]+\n?)+)/);
  if (indicatorsMatch) {
    indicatorsMatch[1].split('\n').forEach(line => {
      const match = line.match(/- \*\*([^*]+)\*\*:\s*(\S+)/);
      if (match) {
        indicators[match[1].trim()] = match[2].trim();
      }
    });
  }
  
  // Извлекаем паттерн (опционально)
  let pattern: { trigger: string; behavior: string; result: string } | undefined;
  const patternMatch = block.match(/### Паттерн\n\n- \*\*Триггер:\*\* ([^\n]+)\n- \*\*Поведение:\*\* ([^\n]+)\n- \*\*Результат:\*\* ([^\n]+)/);
  if (patternMatch) {
    pattern = {
      trigger: patternMatch[1].trim(),
      behavior: patternMatch[2].trim(),
      result: patternMatch[3].trim()
    };
  }
  
  // Извлекаем варианты действий
  const options: CaseOption[] = [];
  const optionsStart = block.indexOf('### Варианты действий');
  if (optionsStart !== -1) {
    let optionsBlock = block.substring(optionsStart);
    // Ограничиваем до следующей секции
    const nextSection = optionsBlock.indexOf('### Рефлексия');
    if (nextSection !== -1) {
      optionsBlock = optionsBlock.substring(0, nextSection);
    }
    
    // Находим все варианты по заголовкам #### A., #### B., и т.д.
    const optionHeaders: Array<{ id: string; start: number; end: number }> = [];
    const headerRegex = /#### ([A-D])\./g;
    let headerMatch;
    while ((headerMatch = headerRegex.exec(optionsBlock)) !== null) {
      const optionId = headerMatch[1];
      const start = headerMatch.index;
      // Ищем конец этого варианта (начало следующего или конец блока)
      const nextHeaderMatch = optionsBlock.substring(start + headerMatch[0].length).match(/#### [A-D]\./);
      const end = nextHeaderMatch && nextHeaderMatch.index !== undefined
        ? start + headerMatch[0].length + nextHeaderMatch.index
        : optionsBlock.length;
      optionHeaders.push({ id: optionId, start, end });
    }
    
    // Парсим каждый вариант
    for (const header of optionHeaders) {
      const optionSection = optionsBlock.substring(header.start, header.end);
      
      // Извлекаем текст варианта (после #### A. до следующей пустой строки)
      const textMatch = optionSection.match(/#### [A-D]\.\s+(.+?)(?:\n\n|$)/s);
      if (!textMatch) continue;
      const optionText = textMatch[1].trim();
      
      // Извлекаем навык
      const skillMatch = optionSection.match(/\*\*Навык:\*\*\s+(.+?)(?:\n\n|$)/s);
      if (!skillMatch) continue;
      const skillUsed = skillMatch[1].trim();
      
      // Извлекаем последствия
      const immediateMatch = optionSection.match(/- \*\*Немедленные:\*\*\s+(.+?)(?:\n|$)/s);
      const secondOrderMatch = optionSection.match(/- \*\*Второго порядка:\*\*\s+(.+?)(?:\n|$)/s);
      const systemicMatch = optionSection.match(/- \*\*Системные:\*\*\s+(.+?)(?:\n|$)/s);
      
      if (!immediateMatch || !secondOrderMatch || !systemicMatch) continue;
      
      const immediate = immediateMatch[1].trim();
      const secondOrder = secondOrderMatch[1].trim();
      const systemic = systemicMatch[1].trim();
      
      // Извлекаем sm_impact
      const smImpact: Record<string, number> = {};
      const smImpactSection = optionSection.match(/\*\*Влияние на систему:\*\*\n((?:- [CKRSF]: [^\n]+\n?)+)/s);
      if (smImpactSection) {
        smImpactSection[1].split('\n').forEach(line => {
          // Поддерживаем форматы: "- S: +1", "- S: -2", "- S: 0"
          const impactMatch = line.match(/- ([CKRSF]):\s*([+-]?\d+)/);
          if (impactMatch) {
            const value = impactMatch[2].startsWith('+') 
              ? parseInt(impactMatch[2].substring(1))
              : parseInt(impactMatch[2]);
            smImpact[impactMatch[1]] = value;
          }
        });
      }
      
      // Извлекаем hint, warning, explanation
      const hintMatch = optionSection.match(/💡 \*\*Подсказка:\*\* (.+?)(?:\n\n|$)/s);
      const warningMatch = optionSection.match(/⚠️ \*\*Предупреждение:\*\* (.+?)(?:\n\n|$)/s);
      const explanationMatch = optionSection.match(/📝 \*\*Объяснение:\*\* (.+?)(?:\n\n|####|###|$)/s);
      
      const option: CaseOption = {
        id: header.id,
        text: cleanMarkdown(optionText),
        skill_used: cleanMarkdown(skillUsed),
        consequence: {
          immediate: cleanMarkdown(immediate),
          second_order: cleanMarkdown(secondOrder),
          systemic: cleanMarkdown(systemic)
        }
      };
      
      if (Object.keys(smImpact).length > 0) {
        option.sm_impact = smImpact;
      }
      
      if (hintMatch) option.hint = cleanMarkdown(hintMatch[1].trim());
      if (warningMatch) option.warning = cleanMarkdown(warningMatch[1].trim());
      if (explanationMatch) option.explanation = cleanMarkdown(explanationMatch[1].trim());
      
      options.push(option);
    }
  }
  
  // Извлекаем рефлексию
  const reflection: CaseReflection = { questions: [] };
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
    const mirror: Record<string, string> = {};
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
  
  const caseObj: ParsedCase = {
    id,
    title,
    node_id: nodeId,
    branch_id: branchId,
    difficulty,
    context
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
  
  if (reflection.questions.length > 0 || reflection.mirror || reflection.key_insight) {
    caseObj.reflection = reflection;
  }
  
  return caseObj;
}

function parseMarkdownFile(filePath: string): ParsedCase[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const cases: ParsedCase[] = [];
  
  // Разделяем на блоки кейсов
  // Кейсы начинаются с ## N. Название или ## Название
  const caseBlocks = content.split(/(?=^## \d+\. |^## [^#])/m).filter(block => block.trim());
  
  for (const block of caseBlocks) {
    if (!block.includes('**ID:**')) continue;
    
    const parsedCase = parseCaseBlock(block);
    if (parsedCase) {
      cases.push(parsedCase);
    }
  }
  
  return cases;
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const mdFile1 = path.join(projectRoot, 'cases-enriched.md');
  const mdFile2 = path.join(projectRoot, 'cases-enriched2.md');
  const jsonFile = path.join(projectRoot, 'data', 'interactive-cases.json');
  
  console.log('Парсинг markdown файлов...');
  
  // Парсим оба markdown файла
  const casesFromMd1 = parseMarkdownFile(mdFile1);
  const casesFromMd2 = parseMarkdownFile(mdFile2);
  
  console.log(`Найдено ${casesFromMd1.length} кейсов в cases-enriched.md`);
  console.log(`Найдено ${casesFromMd2.length} кейсов в cases-enriched2.md`);
  
  // Объединяем кейсы (приоритет у cases-enriched2.md при дубликатах)
  const casesMap = new Map<string, ParsedCase>();
  
  // Сначала добавляем из первого файла
  for (const case_ of casesFromMd1) {
    casesMap.set(case_.id, case_);
  }
  
  // Затем обновляем/добавляем из второго файла (приоритет)
  for (const case_ of casesFromMd2) {
    casesMap.set(case_.id, case_);
  }
  
  console.log(`Всего уникальных кейсов: ${casesMap.size}`);
  
  // Читаем существующий JSON
  const existingJson = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  const existingCases = existingJson.interactive_cases || [];
  const existingCasesMap = new Map<string, any>();
  
  for (const case_ of existingCases) {
    existingCasesMap.set(case_.id, case_);
  }
  
  console.log(`Существующих кейсов в JSON: ${existingCasesMap.size}`);
  
  // Обновляем существующие кейсы и добавляем новые
  const updatedCases: any[] = [];
  let updatedCount = 0;
  let addedCount = 0;
  
  for (const [id, mdCase] of casesMap.entries()) {
    const existingCase = existingCasesMap.get(id);
    
    if (existingCase) {
      // Обновляем существующий кейс
      // Всегда обновляем options из markdown, если они есть
      const hadNoOptions = !existingCase.options || existingCase.options.length === 0;
      const mdHasOptions = mdCase.options && mdCase.options.length > 0;
      
      // Проверяем, нужно ли обновить options (если в markdown есть и они отличаются)
      const existingHasMarkdown = existingCase.options && existingCase.options.length > 0 && 
        (existingCase.options[0]?.text?.includes('**') || existingCase.options[0]?.text?.includes('\r\n\r\n') || 
         existingCase.options[0]?.skill_used?.includes('**') || existingCase.options[0]?.skill_used?.includes('\r\n\r\n'));
      
      const needsUpdate = mdHasOptions && (
        hadNoOptions || 
        !existingCase.options || 
        existingCase.options.length !== (mdCase.options?.length || 0) ||
        existingHasMarkdown
      );
      
      const updatedCase = {
        ...existingCase,
        ...mdCase,
        // Принудительно обновляем options, если они есть в markdown и нужны обновления
        options: mdHasOptions ? mdCase.options : (existingCase.options || undefined),
        reflection: mdCase.reflection || existingCase.reflection,
        indicators: mdCase.indicators || existingCase.indicators,
        pattern: mdCase.pattern || existingCase.pattern
      };
      updatedCases.push(updatedCase);
      
      // Проверяем, было ли обновление
      if (needsUpdate && mdCase.options) {
        updatedCount++;
        console.log(`  Обновлён кейс: ${id} (${hadNoOptions ? 'добавлено' : 'исправлено'} ${mdCase.options.length} вариантов)`);
      }
    } else {
      // Добавляем новый кейс
      updatedCases.push(mdCase);
      addedCount++;
    }
  }
  
  // Добавляем кейсы, которых нет в markdown (на случай, если они были добавлены вручную)
  for (const [id, existingCase] of existingCasesMap.entries()) {
    if (!casesMap.has(id)) {
      updatedCases.push(existingCase);
    }
  }
  
  // Сохраняем обновлённый JSON
  const output = {
    interactive_cases: updatedCases
  };
  
  fs.writeFileSync(jsonFile, JSON.stringify(output, null, 2), 'utf8');
  
  console.log(`\nРезультат:`);
  console.log(`- Обновлено кейсов с options: ${updatedCount}`);
  console.log(`- Добавлено новых кейсов: ${addedCount}`);
  console.log(`- Всего кейсов в JSON: ${updatedCases.length}`);
  console.log(`\nJSON файл обновлён: ${jsonFile}`);
}

main();
