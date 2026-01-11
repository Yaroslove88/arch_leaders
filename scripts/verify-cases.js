const fs = require('fs');
const d = JSON.parse(fs.readFileSync('./data/interactive-cases.json'));

const byNode = {};
d.interactive_cases.forEach(c => {
  byNode[c.node_id] = (byNode[c.node_id] || 0) + 1;
});

const incomplete = Object.entries(byNode).filter(([k, v]) => v !== 3);

console.log('=== ФИНАЛЬНАЯ ПРОВЕРКА ===');
console.log('Всего кейсов:', d.interactive_cases.length);
console.log('Всего нод:', Object.keys(byNode).length);
console.log('Нод с != 3 кейсами:', incomplete.length);

if (incomplete.length > 0) {
  console.log('\nНоды с неполным набором:');
  incomplete.forEach(([node, count]) => console.log(`  ${node}: ${count} кейсов`));
}

// Проверка по сложности
const byDiff = {};
d.interactive_cases.forEach(c => {
  byDiff[c.difficulty] = (byDiff[c.difficulty] || 0) + 1;
});
console.log('\nПо сложности:', byDiff);

// Ожидаемое: 40 нод * 3 уровня = 120 кейсов
console.log('\nОжидалось: 120 кейсов (40 нод × 3 уровня)');
console.log('Результат:', d.interactive_cases.length === 120 ? '✓ СООТВЕТСТВУЕТ' : '✗ НЕ СООТВЕТСТВУЕТ');
