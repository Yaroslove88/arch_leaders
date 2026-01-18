/**
 * Глубокий анализ кейсов - ищем все возможные форматы
 */

const fs = require('fs');
const path = require('path');

const contentFile = path.join(__dirname, '..', 'ТУТ НОВЫЙ контент кейсов.md');
const content = fs.readFileSync(contentFile, 'utf-8');

// Все case_id с номерами строк
const lines = content.split('\n');
const caseIdLines = [];

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('case_id:')) {
    const match = lines[i].match(/case_id:\s*["']?([^"'\n]+)["']?/);
    const id = match ? match[1].trim() : 'unknown';
    caseIdLines.push({ line: i + 1, id });
  }
}

console.log('All case_id occurrences with line numbers:');
caseIdLines.forEach(c => console.log(`  Line ${c.line}: ${c.id}`));

// Ищем заголовки ### case_*
const headerPattern = /^### (case_[a-z0-9_]+)/gm;
let headerMatch;
const headers = [];
while ((headerMatch = headerPattern.exec(content)) !== null) {
  headers.push(headerMatch[1]);
}
console.log('\n### case_* headers found:', headers.length);
console.log(headers.join(', '));

// Ищем yaml блоки с case_card
const yamlBlockPattern = /```yaml\s*\ncase_card:([\s\S]*?)```/g;
let yamlMatch;
let yamlCount = 0;
while ((yamlMatch = yamlBlockPattern.exec(content)) !== null) {
  yamlCount++;
}
console.log('\nYAML blocks with case_card:', yamlCount);

// Проверяем уникальность
const uniqueIds = [...new Set(caseIdLines.map(c => c.id))];
console.log('\nUnique case_id values:', uniqueIds.length);
console.log('Template entries (string, Example):', uniqueIds.filter(id => id.includes('string') || id.includes('Example')).length);
console.log('Valid unique case_ids:', uniqueIds.filter(id => !id.includes('string') && !id.includes('Example')).length);
