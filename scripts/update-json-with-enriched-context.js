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

// Читаем MD файл
const mdContent = fs.readFileSync(path.join(__dirname, '../cases-enriched.md'), 'utf8');

// Читаем JSON
const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/interactive-cases.json'), 'utf8'));

// Парсим MD и извлекаем обновлённый контекст
const caseBlocks = mdContent.split(/^## \d+\. /m).slice(1); // Пропускаем заголовок

caseBlocks.forEach((block, idx) => {
  const lines = block.split('\n');
  let inContext = false;
  let contextLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '### Контекст') {
      inContext = true;
      continue;
    }
    if (inContext && lines[i].trim().startsWith('###')) {
      break; // Конец секции контекста
    }
    if (inContext && lines[i].trim()) {
      contextLines.push(lines[i]);
    }
  }
  
  let enrichedContext = contextLines.join('\n').trim();
  
  // Очищаем markdown разметку
  enrichedContext = cleanMarkdown(enrichedContext);
  
  // Находим соответствующий кейс в JSON
  if (jsonData.interactive_cases[idx] && enrichedContext) {
    jsonData.interactive_cases[idx].context = enrichedContext;
  }
});

// Сохраняем обновлённый JSON
fs.writeFileSync(
  path.join(__dirname, '../data/interactive-cases.json'),
  JSON.stringify(jsonData, null, 2),
  'utf8'
);

console.log('JSON updated with enriched context for', jsonData.interactive_cases.length, 'cases');
