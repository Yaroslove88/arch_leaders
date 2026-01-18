const fs = require('fs');

const data = JSON.parse(fs.readFileSync('d:/gpt/Professional/leadership-architect/КЕЙСЫ_ДЛЯ_ДОЗАПОЛНЕНИЯ.json', 'utf8'));

const cases = data.incomplete_cases;

let markdown = `# Кейсы для дозаполнения контентом

**Дата экспорта**: ${data.metadata.date}
**Всего кейсов**: ${data.metadata.total_cases}

## Инструкция по заполнению

Для каждого кейса нужно заполнить:

1. **event.summary** — описание ситуации (если пустое)
2. **positions[].consequence** — последствия для каждой позиции:
   - \`immediate\` — что произойдёт сразу
   - \`second_order\` — что произойдёт потом
   - \`systemic\` — системный эффект
3. **positions[].consequence.reflection_prompt** — вопрос для рефлексии после выбора
4. **Опционально**: заполнить пустые поля в space_map (environment, constraints, mode)

---

`;

// Группируем по node_id
const byNode = {};
cases.forEach(c => {
  if (!byNode[c.node_id]) byNode[c.node_id] = [];
  byNode[c.node_id].push(c);
});

Object.keys(byNode).sort().forEach(nodeId => {
  markdown += `\n## ${nodeId}\n\n`;
  markdown += `**Кейсов**: ${byNode[nodeId].length}\n\n`;
  
  byNode[nodeId].forEach(case_ => {
    markdown += `### ${case_.id}\n\n`;
    markdown += '```yaml\n';
    markdown += 'case_card:\n';
    markdown += '  meta:\n';
    markdown += `    case_id: ${case_.id}\n`;
    markdown += `    node_id: ${case_.node_id}\n`;
    markdown += `    branch_id: ${case_.branch_id}\n`;
    markdown += `    difficulty: ${case_.difficulty}\n`;
    
    markdown += '  portal:\n';
    markdown += `    header_title: "${case_.portal.header_title}"\n`;
    markdown += `    case_name: "${case_.portal.case_name}"\n`;
    markdown += `    subtitle: "${case_.portal.subtitle || '??? ЗАПОЛНИТЬ'}"\n`;
    
    markdown += '  event:\n';
    markdown += `    label: "${case_.event.label}"\n`;
    if (case_.event.summary) {
      markdown += `    summary: "${case_.event.summary}"\n`;
    } else {
      markdown += `    summary: "??? ЗАПОЛНИТЬ — описание ситуации"\n`;
    }
    
    markdown += '  context:\n';
    markdown += '    space_map:\n';
    markdown += `      company: "${case_.space_map.company}"\n`;
    markdown += `      environment: "${case_.space_map.environment || '??? ЗАПОЛНИТЬ (опционально)'}"\n`;
    markdown += `      constraints: "${case_.space_map.constraints || '??? ЗАПОЛНИТЬ (опционально)'}"\n`;
    markdown += `      people: "${case_.space_map.people || '??? ЗАПОЛНИТЬ (опционально)'}"\n`;
    markdown += `      mode: "${case_.space_map.mode || '??? ЗАПОЛНИТЬ (опционально)'}"\n`;
    
    if (case_.facts?.strict_facts) {
      markdown += '  facts:\n';
      markdown += `    strict_facts: "${case_.facts.strict_facts}"\n`;
    }
    
    if (case_.background?.story) {
      markdown += '  background:\n';
      markdown += `    story: "${case_.background.story}"\n`;
    }
    
    markdown += '  dilemma:\n';
    markdown += `    question: "${case_.dilemma.question}"\n`;
    if (case_.dilemma.ambiance) {
      markdown += `    ambiance: "${case_.dilemma.ambiance}"\n`;
    }
    
    markdown += '  positions:\n';
    case_.positions.forEach(pos => {
      markdown += `    - id: ${pos.id}\n`;
      markdown += `      description: "${pos.description}"\n`;
      markdown += `      position_type: "${pos.position_type || '??? ЗАПОЛНИТЬ'}"\n`;
      markdown += '      consequence:\n';
      markdown += `        immediate: "??? ЗАПОЛНИТЬ — что произойдёт сразу"\n`;
      markdown += `        second_order: "??? ЗАПОЛНИТЬ — что произойдёт потом"\n`;
      markdown += `        systemic: "??? ЗАПОЛНИТЬ — системный эффект"\n`;
      markdown += `        reflection_prompt: "??? ЗАПОЛНИТЬ — вопрос для рефлексии"\n`;
    });
    
    markdown += '```\n\n---\n\n';
  });
});

fs.writeFileSync(
  'd:/gpt/Professional/leadership-architect/КЕЙСЫ_ДЛЯ_ДОЗАПОЛНЕНИЯ.md',
  markdown,
  'utf8'
);

console.log('✓ Файл КЕЙСЫ_ДЛЯ_ДОЗАПОЛНЕНИЯ.md создан');
console.log('  Кейсов:', data.metadata.total_cases);
console.log('  Нод:', Object.keys(byNode).length);
