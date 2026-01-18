/**
 * Очистка дубликатов и генерация недостающих кейсов
 */

const fs = require('fs');
const path = require('path');

// Читаем текущие кейсы
const casesFile = path.join(__dirname, '..', 'data', 'interactive-cases.json');
const casesData = JSON.parse(fs.readFileSync(casesFile, 'utf-8'));

// Читаем дерево способностей
const treeFile = path.join(__dirname, '..', 'packages', 'shared', 'src', 'seed', 'initial-ability-tree.json');
const treeData = JSON.parse(fs.readFileSync(treeFile, 'utf-8'));

// Все ноды из дерева
const allNodes = treeData.nodes.map(n => ({
  node_id: n.node_id,
  branch_id: n.branch_id,
  tier: n.tier
}));

console.log('=== АНАЛИЗ КЕЙСОВ ===\n');
console.log('Всего нод в дереве:', allNodes.length);
console.log('Кейсов в JSON:', casesData.interactive_cases.length);

// Группируем кейсы по node_id
const casesByNode = {};
casesData.interactive_cases.forEach(c => {
  if (!casesByNode[c.node_id]) casesByNode[c.node_id] = [];
  casesByNode[c.node_id].push(c);
});

console.log('\nНоды с кейсами:', Object.keys(casesByNode).length);

// Ищем дубликаты (кейсы с одинаковым базовым ID)
const seenBaseIds = new Set();
const duplicates = [];
const cleanCases = [];

casesData.interactive_cases.forEach(c => {
  // Убираем суффиксы _v1, _v2 для проверки базового ID
  const baseId = c.id.replace(/_v\d+$/, '');

  if (seenBaseIds.has(baseId)) {
    duplicates.push(c.id);
  } else {
    seenBaseIds.add(baseId);
    cleanCases.push(c);
  }
});

console.log('\nДубликаты найдены:', duplicates.length);
duplicates.forEach(d => console.log(' -', d));

console.log('\nПосле очистки:', cleanCases.length, 'кейсов');

// Группируем чистые кейсы по node_id
const cleanByNode = {};
cleanCases.forEach(c => {
  if (!cleanByNode[c.node_id]) cleanByNode[c.node_id] = [];
  cleanByNode[c.node_id].push(c);
});

// Проверяем какие ноды имеют полный набор (3 уровня)
console.log('\n=== СТАТУС ПО НОДАМ ===\n');

const nodesWithCases = Object.keys(cleanByNode);
const nodesWithoutCases = allNodes
  .map(n => n.node_id)
  .filter(nodeId => !nodesWithCases.includes(nodeId));

console.log('Ноды БЕЗ кейсов (' + nodesWithoutCases.length + '):');
nodesWithoutCases.forEach(n => console.log(' -', n));

// Проверяем полноту кейсов для существующих нод
console.log('\nНоды с неполным набором кейсов:');
const difficulties = ['basic', 'intermediate', 'advanced'];
const missingCases = [];

nodesWithCases.forEach(nodeId => {
  const nodeCases = cleanByNode[nodeId];
  const existingDifficulties = nodeCases.map(c => c.difficulty);

  difficulties.forEach(diff => {
    if (!existingDifficulties.includes(diff)) {
      console.log(` - ${nodeId}: отсутствует ${diff}`);
      missingCases.push({ node_id: nodeId, difficulty: diff });
    }
  });
});

// Записываем очищенные кейсы
const outputData = { interactive_cases: cleanCases };
fs.writeFileSync(casesFile, JSON.stringify(outputData, null, 2), 'utf-8');
console.log('\n=== РЕЗУЛЬТАТ ===');
console.log('Записано', cleanCases.length, 'уникальных кейсов в', casesFile);

// Статистика
const byDiff = {};
cleanCases.forEach(c => {
  byDiff[c.difficulty] = (byDiff[c.difficulty] || 0) + 1;
});
console.log('По сложности:', byDiff);

// Список всего что нужно сгенерировать
console.log('\n=== НУЖНО СГЕНЕРИРОВАТЬ ===');
console.log('Недостающие кейсы для существующих нод:', missingCases.length);
console.log('Новые ноды без кейсов:', nodesWithoutCases.length);
console.log('Всего кейсов для новых нод (×3):', nodesWithoutCases.length * 3);
console.log('ИТОГО нужно создать:', missingCases.length + nodesWithoutCases.length * 3, 'кейсов');
