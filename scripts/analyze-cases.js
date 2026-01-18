/**
 * Анализ кейсов в исходном файле
 */

const fs = require('fs');
const path = require('path');

const contentFile = path.join(__dirname, '..', 'ТУТ НОВЫЙ контент кейсов.md');
const content = fs.readFileSync(contentFile, 'utf-8');

// Ищем все блоки с case_id и positions
const blocks = content.split(/\n---\n|\n## /);

console.log('Total blocks split by --- or ##:', blocks.length);

let validBlocks = 0;
let withCaseId = 0;
let withPositions = 0;
let withBoth = 0;
let issues = [];

for (let i = 0; i < blocks.length; i++) {
  const block = blocks[i];
  const hasCaseId = block.includes('case_id:');
  const hasPositions = block.includes('positions:');

  if (hasCaseId) withCaseId++;
  if (hasPositions) withPositions++;

  if (hasCaseId && hasPositions) {
    withBoth++;

    // Извлекаем case_id
    const idMatch = block.match(/case_id:\s*["']?([^"'\n]+)["']?/);
    const id = idMatch ? idMatch[1].trim() : 'unknown';

    // Проверяем, есть ли 2+ позиции
    const positionMatches = block.match(/- id:/g);
    const posCount = positionMatches ? positionMatches.length : 0;

    if (posCount < 2) {
      issues.push(`${id}: only ${posCount} positions`);
    }
  }

  if (hasCaseId && !hasPositions) {
    const idMatch = block.match(/case_id:\s*["']?([^"'\n]+)["']?/);
    const id = idMatch ? idMatch[1].trim() : 'unknown';
    issues.push(`${id}: has case_id but NO positions section`);
  }
}

console.log('\nBlocks with case_id:', withCaseId);
console.log('Blocks with positions:', withPositions);
console.log('Blocks with BOTH:', withBoth);

console.log('\nIssues found:');
issues.forEach(i => console.log(' -', i));

// Ищем альтернативные форматы - может быть yaml блоки?
const yamlBlocks = content.match(/```yaml[\s\S]*?```/g);
console.log('\nYAML code blocks found:', yamlBlocks ? yamlBlocks.length : 0);

// Ищем все уникальные case_id
const allIds = content.match(/case_id:\s*["']?([^"'\n]+)["']?/g);
if (allIds) {
  const cleaned = allIds.map(m => m.replace(/case_id:\s*["']?/, '').replace(/["']$/, '').trim());
  const unique = [...new Set(cleaned)];
  console.log('\nUnique case_ids:', unique.length);
  console.log('Duplicates:', allIds.length - unique.length);
}
