const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/interactive-cases.json'), 'utf8'));

let md = `# Интерактивные кейсы для симулятора зрелого лидерства

> Этот файл содержит кейсы в структурированном формате с детальным контекстом для системно-думающих людей.
> Контекст расширяется с ростом сложности кейса.

---

`;

data.interactive_cases.forEach((c, idx) => {
  md += `## ${idx + 1}. ${c.title}\n\n`;
  md += `**ID:** \`${c.id}\`  \n`;
  md += `**Узел:** ${c.node_id}  \n`;
  md += `**Ветка:** ${c.branch_id}  \n`;
  md += `**Сложность:** ${c.difficulty}  \n\n`;
  
  md += `### Контекст\n\n${c.context}\n\n`;
  
  if (c.indicators) {
    md += `### Индикаторы\n\n`;
    Object.entries(c.indicators).forEach(([k, v]) => {
      md += `- **${k}:** ${v}\n`;
    });
    md += `\n`;
  }
  
  if (c.pattern) {
    md += `### Паттерн\n\n`;
    md += `- **Триггер:** ${c.pattern.trigger}\n`;
    md += `- **Поведение:** ${c.pattern.behavior}\n`;
    md += `- **Результат:** ${c.pattern.result}\n\n`;
  }
  
  md += `### Варианты действий\n\n`;
  
  c.options.forEach((opt) => {
    md += `#### ${opt.id}. ${opt.text}\n\n`;
    md += `**Навык:** ${opt.skill_used || 'Не указан'}\n\n`;
    md += `**Последствия:**\n`;
    md += `- **Немедленные:** ${opt.consequence.immediate}\n`;
    md += `- **Второго порядка:** ${opt.consequence.second_order}\n`;
    md += `- **Системные:** ${opt.consequence.systemic}\n\n`;
    
    if (opt.sm_impact) {
      md += `**Влияние на систему:**\n`;
      Object.entries(opt.sm_impact).forEach(([k, v]) => {
        md += `- ${k}: ${v > 0 ? '+' : ''}${v}\n`;
      });
      md += `\n`;
    }
    
    if (opt.hint) md += `💡 **Подсказка:** ${opt.hint}\n\n`;
    if (opt.warning) md += `⚠️ **Предупреждение:** ${opt.warning}\n\n`;
    if (opt.explanation) md += `📝 **Объяснение:** ${opt.explanation}\n\n`;
  });
  
  md += `### Рефлексия\n\n`;
  
  if (c.reflection.questions) {
    md += `**Вопросы:**\n`;
    c.reflection.questions.forEach(q => {
      md += `- ${q}\n`;
    });
    md += `\n`;
  }
  
  if (c.reflection.mirror) {
    md += `**Зеркало:**\n`;
    Object.entries(c.reflection.mirror).forEach(([k, v]) => {
      md += `- **${k}:** ${v}\n`;
    });
    md += `\n`;
  }
  
  if (c.reflection.key_insight) {
    md += `**Ключевое понимание:** ${c.reflection.key_insight}\n\n`;
  }
  
  md += `---\n\n`;
});

fs.writeFileSync(path.join(__dirname, '../cases-enriched.md'), md, 'utf8');
console.log('MD file created with', data.interactive_cases.length, 'cases');
