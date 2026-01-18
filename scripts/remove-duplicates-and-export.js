const fs = require('fs');

// Читаем JSON
const data = JSON.parse(fs.readFileSync('d:/gpt/Professional/leadership-architect/data/interactive-cases.json', 'utf8'));

// ID дублей для удаления
const duplicatesToRemove = [
  'case_sag_diagnosis_1', 'case_sag_diagnosis_2', 'case_sag_diagnosis_3',
  'case_delegation_1', 'case_delegation_2', 'case_delegation_3',
  'case_shared_leadership_1', 'case_shared_leadership_2', 'case_shared_leadership_3',
  'case_scenario_analysis_1', 'case_scenario_analysis_2', 'case_scenario_analysis_3'
];

// Фильтруем
const beforeCount = data.interactive_cases.length;
data.interactive_cases = data.interactive_cases.filter(c => !duplicatesToRemove.includes(c.id));
const afterCount = data.interactive_cases.length;

console.log('Удалено дублей:', beforeCount - afterCount);
console.log('Осталось кейсов:', afterCount);

// Сохраняем обновлённый JSON
fs.writeFileSync(
  'd:/gpt/Professional/leadership-architect/data/interactive-cases.json',
  JSON.stringify(data, null, 2),
  'utf8'
);

console.log('✓ Файл interactive-cases.json обновлён');

// Теперь экспортируем оставшиеся пустые кейсы
const hasContent = c => {
  const p = c.positions?.[0] || c.options?.[0];
  return p?.consequence?.immediate || p?.consequence?.second_order || p?.consequence?.systemic;
};

const incompleteCases = data.interactive_cases.filter(c => !hasContent(c));

console.log('Пустых кейсов для экспорта:', incompleteCases.length);

// Экспортируем
const output = {
  metadata: {
    description: 'Незаполненные кейсы для дозаполнения контентом',
    date: new Date().toISOString().split('T')[0],
    total_cases: incompleteCases.length
  },
  incomplete_cases: incompleteCases
};

fs.writeFileSync(
  'd:/gpt/Professional/leadership-architect/КЕЙСЫ_ДЛЯ_ДОЗАПОЛНЕНИЯ.json',
  JSON.stringify(output, null, 2),
  'utf8'
);

console.log('✓ Файл КЕЙСЫ_ДЛЯ_ДОЗАПОЛНЕНИЯ.json создан');
