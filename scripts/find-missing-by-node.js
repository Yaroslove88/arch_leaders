/**
 * Анализ недостающих кейсов по нодам
 */

const fs = require('fs');
const path = require('path');

// Читаем текущие кейсы
const casesFile = path.join(__dirname, '..', 'data', 'interactive-cases.json');
const casesData = JSON.parse(fs.readFileSync(casesFile, 'utf-8'));

// Читаем дерево
const treeFile = path.join(__dirname, '..', 'packages', 'shared', 'src', 'seed', 'initial-ability-tree.json');
const treeData = JSON.parse(fs.readFileSync(treeFile, 'utf-8'));

// Читаем описания нод
const descFile = path.join(__dirname, '..', 'data', 'node-descriptions.json');
const descData = JSON.parse(fs.readFileSync(descFile, 'utf-8'));

const allNodes = treeData.nodes;
const difficulties = ['basic', 'intermediate', 'advanced'];

// Группируем существующие кейсы по node_id и difficulty
const existingByNode = {};
casesData.interactive_cases.forEach(c => {
  if (!existingByNode[c.node_id]) existingByNode[c.node_id] = {};
  existingByNode[c.node_id][c.difficulty] = c;
});

console.log('=== АНАЛИЗ НЕДОСТАЮЩИХ КЕЙСОВ ===\n');
console.log('Существующих кейсов:', casesData.interactive_cases.length);

const missing = [];

allNodes.forEach(node => {
  const nodeId = node.node_id;
  const branchId = node.branch_id;
  const existing = existingByNode[nodeId] || {};
  const nodeName = descData.node_descriptions[nodeId]?.name || nodeId;

  difficulties.forEach(diff => {
    if (!existing[diff]) {
      missing.push({
        node_id: nodeId,
        branch_id: branchId,
        difficulty: diff,
        node_name: nodeName
      });
    }
  });
});

console.log('Недостающих кейсов:', missing.length);
console.log('\n=== СПИСОК НЕДОСТАЮЩИХ ===\n');

// Группируем по нодам для читаемости
const byNode = {};
missing.forEach(m => {
  if (!byNode[m.node_id]) byNode[m.node_id] = { name: m.node_name, branch: m.branch_id, missing: [] };
  byNode[m.node_id].missing.push(m.difficulty);
});

Object.entries(byNode).forEach(([nodeId, data]) => {
  console.log(`${data.name} (${nodeId}):`);
  console.log(`  Branch: ${data.branch}`);
  console.log(`  Missing: ${data.missing.join(', ')}`);
  console.log('');
});

console.log('=== ИТОГО ===');
console.log('Нод с неполным набором:', Object.keys(byNode).length);
console.log('Всего кейсов к генерации:', missing.length);

// Записываем список в файл для использования
fs.writeFileSync(
  path.join(__dirname, '..', 'data', 'missing-cases.json'),
  JSON.stringify({ missing, byNode }, null, 2)
);
console.log('\nСписок сохранён в data/missing-cases.json');
