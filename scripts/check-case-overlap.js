const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/gpt/Professional/leadership-architect/data/interactive-cases.json', 'utf8'));

const hasContent = c => {
  const p = c.positions?.[0] || c.options?.[0];
  return p?.consequence?.immediate || p?.consequence?.second_order || p?.consequence?.systemic;
};

const complete = data.interactive_cases.filter(hasContent);
const incomplete = data.interactive_cases.filter(c => !hasContent(c));

const completeNodes = [...new Set(complete.map(c => c.node_id))];
const incompleteNodes = [...new Set(incomplete.map(c => c.node_id))];

const overlap = incompleteNodes.filter(n => completeNodes.includes(n));
const onlyIncomplete = incompleteNodes.filter(n => !completeNodes.includes(n));

console.log('=== СТАТИСТИКА ===');
console.log('Всего кейсов:', data.interactive_cases.length);
console.log('Заполненных:', complete.length);
console.log('Пустых:', incomplete.length);
console.log('');
console.log('Нод с заполненными:', completeNodes.length);
console.log('Нод с пустыми:', incompleteNodes.length);
console.log('Пересечение:', overlap.length);
console.log('');

console.log('=== ПЕРЕСЕЧЕНИЕ (есть и заполненные, и пустые) ===');
overlap.forEach(nodeId => {
  const comp = complete.filter(c => c.node_id === nodeId).map(c => c.id);
  const incomp = incomplete.filter(c => c.node_id === nodeId).map(c => c.id);
  console.log(nodeId + ':');
  console.log('  ЗАПОЛНЕНЫ: ' + comp.join(', '));
  console.log('  ПУСТЫЕ: ' + incomp.join(', '));
});

console.log('');
console.log('=== НОДЫ ТОЛЬКО С ПУСТЫМИ (нет заполненных) ===');
onlyIncomplete.forEach(n => {
  const cases = incomplete.filter(c => c.node_id === n).map(c => c.id);
  console.log(n + ': ' + cases.join(', '));
});
