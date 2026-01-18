/**
 * Удаление сгенерированных кейсов, оставляем только оригинальные
 */

const fs = require('fs');
const path = require('path');

const casesFile = path.join(__dirname, '..', 'data', 'interactive-cases.json');
const casesData = JSON.parse(fs.readFileSync(casesFile, 'utf-8'));

// Ноды, для которых были оригинальные кейсы (из исходного MD файла)
const originalNodes = [
  'node_containment',
  'node_thinking_through_form',
  'node_scenario_thinking',
  'node_role_differentiation',
  'node_architecture_coupling',
  'node_delegation_as_coupling',
  'node_system_thinking',
  'node_responsibility_sag_diagnosis',
  'node_subjectivity_transfer',
  'node_scenario_analysis',
  'node_subject_in_system',
  'node_decision_authorship',
  'node_field_of_differences',
  'node_form_assembly',
  'node_responsibility_as_form',
  'node_upper_field_work'
];

console.log('До фильтрации:', casesData.interactive_cases.length, 'кейсов');

// Оставляем только кейсы для оригинальных нод
const originalCases = casesData.interactive_cases.filter(c =>
  originalNodes.includes(c.node_id)
);

console.log('После фильтрации:', originalCases.length, 'кейсов');

// Статистика по нодам
const byNode = {};
originalCases.forEach(c => {
  byNode[c.node_id] = (byNode[c.node_id] || 0) + 1;
});
console.log('\nПо нодам:');
Object.entries(byNode).forEach(([node, count]) => {
  console.log(`  ${node}: ${count}`);
});

// Записываем
fs.writeFileSync(casesFile, JSON.stringify({ interactive_cases: originalCases }, null, 2));
console.log('\nЗаписано в', casesFile);
