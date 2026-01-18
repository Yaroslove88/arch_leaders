const fs = require('fs');
const path = require('path');

// Читаем JSON
const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/interactive-cases.json'), 'utf8'));

// Функция для очистки markdown форматирования из текста
function cleanMarkdown(text) {
  if (!text) return text;
  
  // Убираем markdown разметку, но сохраняем структуру
  let cleaned = text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Убираем жирный текст
    .replace(/\*([^*]+)\*/g, '$1') // Убираем курсив
    .replace(/`([^`]+)`/g, '$1') // Убираем код
    .replace(/^#{1,6}\s+/gm, '') // Убираем заголовки
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Убираем ссылки
    .replace(/\n{3,}/g, '\n\n') // Убираем лишние переносы
    .trim();
  
  // Убираем оставшиеся markdown символы
  cleaned = cleaned.replace(/\*\*/g, '').replace(/\*/g, '');
  
  return cleaned;
}

// Обновляем контексты всех кейсов
jsonData.interactive_cases.forEach((c, idx) => {
  if (c.context) {
    // Очищаем markdown форматирование
    c.context = cleanMarkdown(c.context);
    
    // Убираем подсказки типа "перестанет принимать решения", "не учится" и т.д.
    const hints = [
      /перестанет принимать.*решения/gi,
      /не учится.*самостоятельно/gi,
      /будет ждать.*одобрения/gi,
      /зависимость.*растёт/gi,
      /не развивается/gi,
      /создаёт.*зависимость/gi,
      /не учится работать/gi,
      /не учатся.*самостоятельно/gi,
      /привыкла.*что ты/gi,
      /ждут.*твоих.*решений/gi,
      /ждут.*твоего.*решения/gi,
    ];
    
    hints.forEach(hint => {
      c.context = c.context.replace(hint, '');
    });
    
    // Убираем лишние пробелы, но сохраняем структуру абзацев
    c.context = c.context
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Убираем множественные переносы
      .replace(/[ \t]+/g, ' ') // Убираем лишние пробелы
      .trim();
  }
});

// Сохраняем обновлённый JSON
fs.writeFileSync(
  path.join(__dirname, '../data/interactive-cases.json'),
  JSON.stringify(jsonData, null, 2),
  'utf8'
);

console.log('JSON updated: removed markdown formatting and hints from', jsonData.interactive_cases.length, 'cases');
