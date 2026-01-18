/**
 * Поиск пропущенных кейсов
 */

const fs = require('fs');
const path = require('path');

const contentFile = path.join(__dirname, '..', 'ТУТ НОВЫЙ контент кейсов.md');
const content = fs.readFileSync(contentFile, 'utf-8');

// Извлекаем все case_id
const allIds = [];
const regex = /case_id:\s*["']?([^"'\n#]+)["']?/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const id = match[1].trim();
  if (!id.includes('string') && !id.includes('Example')) {
    allIds.push(id);
  }
}

const uniqueIds = [...new Set(allIds)];

// Группируем по базовому имени (без _1, _2, _3)
const byBase = {};
uniqueIds.forEach(id => {
  const base = id.replace(/_[123]$/, '');
  if (!byBase[base]) byBase[base] = [];
  const num = id.match(/_([123])$/);
  byBase[base].push(num ? parseInt(num[1]) : 0);
});

console.log('Кейсы по базовому имени:');
console.log('========================');

const expectedNodes = [
  'case_let_it_break',
  'case_crisis_real',
  'case_containment_conflict',
  'case_rule_creation_bugs',
  'case_decision_uncertainty',
  'case_role_differentiation',
  'case_architecture_coupling',
  'case_delegation_coupling',
  'case_system_thinking',
  'case_responsibility_sag',
  'case_subjectivity_transfer',
  'case_scenario_thinking',
  'case_scenario_breakdown',
  'case_subject_in_system',
  'case_decision_authorship',
  'case_difference_field',
  'case_form_assembly',
  'case_thinking_through_form',
  'case_responsibility_as_form',
  'case_upper_field_work'
];

let total = 0;
let missing = [];

expectedNodes.forEach(base => {
  const levels = byBase[base] || [];
  const hasLevels = levels.sort().join(',');
  const expected = '1,2,3';

  if (hasLevels !== expected && hasLevels !== '0') {
    console.log(`${base}: имеет уровни [${hasLevels}], ожидалось [${expected}]`);
    [1, 2, 3].forEach(l => {
      if (!levels.includes(l)) {
        missing.push(`${base}_${l}`);
      }
    });
  }
  total += levels.length || 0;
});

console.log('\n========================');
console.log('Всего кейсов в файле:', uniqueIds.length);
console.log('Ожидается (20 нод * 3 уровня):', 20 * 3);
console.log('Пропущено:', missing.length);
console.log('\nПропущенные кейсы:');
missing.forEach(m => console.log(' -', m));
