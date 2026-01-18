const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'ТУТ НОВЫЙ контент кейсов.md'), 'utf-8');

// Извлекаем node_id
const matches = content.match(/node_id:\s*["']?([^"'\n<]+)["']?/g) || [];
const nodes = matches
  .filter(m => !m.includes('<'))
  .map(m => m.replace(/node_id:\s*["']?/, '').replace(/["']$/, '').trim());

const unique = [...new Set(nodes)];
console.log('Unique node_ids:', unique.length);
unique.forEach(n => console.log(' -', n));

// Считаем кейсы по нодам
const byNode = {};
nodes.forEach(n => { byNode[n] = (byNode[n] || 0) + 1; });

console.log('\nCases per node:');
Object.entries(byNode).sort((a, b) => b[1] - a[1]).forEach(([n, c]) => {
  console.log(` ${n}: ${c}`);
});
