/**
 * Очистка лишних кейсов - оставляем по 3 на ноду
 */

const fs = require('fs');
const path = require('path');

const casesFile = path.join(__dirname, '..', 'data', 'interactive-cases.json');
const casesData = JSON.parse(fs.readFileSync(casesFile, 'utf-8'));

console.log('До очистки:', casesData.interactive_cases.length, 'кейсов');

// Группируем по node_id и difficulty
const byNodeAndDiff = {};

casesData.interactive_cases.forEach(c => {
  const key = `${c.node_id}_${c.difficulty}`;
  if (!byNodeAndDiff[key]) {
    byNodeAndDiff[key] = [];
  }
  byNodeAndDiff[key].push(c);
});

// Оставляем только первый кейс для каждой комбинации node_id + difficulty
const cleanCases = [];
const difficulties = ['basic', 'intermediate', 'advanced'];

// Получаем все уникальные node_id
const nodeIds = [...new Set(casesData.interactive_cases.map(c => c.node_id))];

nodeIds.forEach(nodeId => {
  difficulties.forEach(diff => {
    const key = `${nodeId}_${diff}`;
    const cases = byNodeAndDiff[key];
    if (cases && cases.length > 0) {
      // Берём первый кейс
      cleanCases.push(cases[0]);
      if (cases.length > 1) {
        console.log(`Удалены лишние для ${key}: ${cases.length - 1} шт`);
      }
    }
  });
});

// Сортируем
cleanCases.sort((a, b) => {
  if (a.node_id !== b.node_id) return a.node_id.localeCompare(b.node_id);
  const diffOrder = { basic: 1, intermediate: 2, advanced: 3 };
  return (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0);
});

console.log('После очистки:', cleanCases.length, 'кейсов');

// Записываем
fs.writeFileSync(casesFile, JSON.stringify({ interactive_cases: cleanCases }, null, 2));

// Проверяем
const byNode = {};
cleanCases.forEach(c => {
  byNode[c.node_id] = (byNode[c.node_id] || 0) + 1;
});

const incomplete = Object.entries(byNode).filter(([k, v]) => v !== 3);
console.log('Нод всего:', Object.keys(byNode).length);
console.log('Нод с != 3 кейсами:', incomplete.length);

const byDiff = {};
cleanCases.forEach(c => {
  byDiff[c.difficulty] = (byDiff[c.difficulty] || 0) + 1;
});
console.log('По сложности:', byDiff);
