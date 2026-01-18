/**
 * Фильтрует кейсы для не применимых узлов
 * Удаляет все кейсы для узлов, где кейсы не уместны (психология, концепции, метрики)
 */

const fs = require('fs');
const path = require('path');

// Список НЕ применимых узлов (из АНАЛИЗ_ПРИМЕНИМОСТИ_КЕЙСОВ.md)
const excludedNodes = [
  // Психологические/Внутренние процессы
  'node_grounding_point',       // внутренняя рефлексия
  'node_self_regulation',       // саморегуляция
  'node_weak_zone_diagnosis',   // диагностика
  'node_recovery_skills',       // практики восстановления
  'node_emotional_work',        // эмоциональная работа
  'node_cognitive_maturity',    // когнитивная зрелость
  'node_role_energy',           // энергия ролей
  
  // Концепции/Метрики
  'node_psychological_ownership', // внутреннее чувство
  'node_collective_efficacy',     // метрика эффективности
  'node_vertical_development',    // концепция развития
  'node_ddo',                     // организационная модель
  
  // Сомнительные/Master
  'node_thinking_through_form',   // слишком абстрактно
  'node_personal_resilience'      // branch_resilience - весь branch сомнительный
];

const jsonFile = path.join(__dirname, '..', 'data', 'interactive-cases.json');
const backupFile = path.join(__dirname, '..', 'backups', 'cases', `interactive-cases.pre-filter.${Date.now()}.json`);

// Читаем
const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

console.log('=== Фильтрация не применимых кейсов ===\n');
console.log('До фильтрации:', data.interactive_cases.length, 'кейсов');

// Создаём бэкап
const backupDir = path.dirname(backupFile);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}
fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf-8');
console.log('Бэкап:', backupFile);

// Показываем что будет удалено
const toRemove = data.interactive_cases.filter(c => excludedNodes.includes(c.node_id));
console.log('\nБудет удалено (не применимые узлы):');
toRemove.forEach(c => console.log('  -', c.id, '->', c.node_id));
console.log('\nИтого к удалению:', toRemove.length);

// Фильтруем
const filtered = data.interactive_cases.filter(c => !excludedNodes.includes(c.node_id));

console.log('\n=== После фильтрации ===');
console.log('Осталось кейсов:', filtered.length);

// Записываем
const output = { interactive_cases: filtered };
fs.writeFileSync(jsonFile, JSON.stringify(output, null, 2), 'utf-8');

// Статистика по веткам
const byBranch = {};
filtered.forEach(c => {
  if (c.branch_id) {
    byBranch[c.branch_id] = (byBranch[c.branch_id] || 0) + 1;
  }
});
console.log('\nПо веткам:', JSON.stringify(byBranch, null, 2));

// Статистика по сложности
const byDifficulty = {};
filtered.forEach(c => {
  byDifficulty[c.difficulty] = (byDifficulty[c.difficulty] || 0) + 1;
});
console.log('По сложности:', JSON.stringify(byDifficulty, null, 2));

console.log('\nГотово!');
