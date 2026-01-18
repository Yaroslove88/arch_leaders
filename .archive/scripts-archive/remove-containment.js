const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, '../00_кейсы.md'), 'utf8');
const lines = content.split('\n');
const result = [];

for (let i = 0; i < lines.length; i++) {
  // Пропускаем строку Контейнирование в секции архитектурного мышления
  if (lines[i].trim() === '|Контейнирование|⚠️|кейс без "решения"|' && 
      i > 0 && lines[i-1].includes('|Сборка форм|')) {
    continue;
  }
  result.push(lines[i]);
}

fs.writeFileSync(path.join(__dirname, '../00_кейсы.md'), result.join('\n'), 'utf8');
console.log('Удалена строка Контейнирование из архитектурного мышления');
