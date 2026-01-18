const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, '../00_кейсы.md'), 'utf8');

// Удаляем строку Контейнирование из архитектурного мышления (она уже есть в субъектности)
content = content.replace(/\|Сборка форм\|✅\|интеграционные кейсы\|❌ не создано\|\-\|\r?\n\|Контейнирование\|⚠️\|кейс без "решения"\|\r?\n/g, '|Сборка форм|✅|интеграционные кейсы|❌ не создано|-|\n');

fs.writeFileSync(path.join(__dirname, '../00_кейсы.md'), content, 'utf8');
console.log('Исправлено');
