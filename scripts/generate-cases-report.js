const fs = require('fs');
const path = require('path');

// Читаем данные
const casesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/interactive-cases.json'), 'utf8'));
const treeData = JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/shared/src/seed/initial-ability-tree.json'), 'utf8'));

// Создаём мапы для быстрого поиска
const branchesMap = {};
treeData.branches.forEach(b => {
  branchesMap[b.branch_id] = b;
});

const nodesMap = {};
treeData.nodes.forEach(n => {
  nodesMap[n.node_id] = n;
});

// Группируем кейсы по веткам и узлам
const report = {};

casesData.interactive_cases.forEach(caseItem => {
  const branchId = caseItem.branch_id;
  const nodeId = caseItem.node_id;
  
  if (!report[branchId]) {
    report[branchId] = {
      branch_info: branchesMap[branchId] || { name: branchId, description: 'Не найдено в дереве' },
      nodes: {}
    };
  }
  
  if (!report[branchId].nodes[nodeId]) {
    report[branchId].nodes[nodeId] = {
      node_info: nodesMap[nodeId] || { name: nodeId, description: 'Не найдено в дереве' },
      cases: []
    };
  }
  
  report[branchId].nodes[nodeId].cases.push({
    id: caseItem.id,
    title: caseItem.title,
    difficulty: caseItem.difficulty
  });
});

// Генерируем Markdown отчёт
let md = `# Отчёт по кейсам в разрезе веток и узлов

> Сгенерировано: ${new Date().toLocaleString('ru-RU')}
> Всего кейсов: ${casesData.interactive_cases.length}

---

`;

// Сортируем ветки по порядку из дерева
const branchOrder = treeData.branches.map(b => b.branch_id);

Object.keys(report)
  .sort((a, b) => {
    const idxA = branchOrder.indexOf(a);
    const idxB = branchOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  })
  .forEach(branchId => {
    const branchData = report[branchId];
    const branchInfo = branchData.branch_info;
    
    md += `## ${branchInfo.name || branchId}\n\n`;
    md += `**ID ветки:** \`${branchId}\`  \n`;
    md += `**Описание:** ${branchInfo.description || 'Нет описания'}\n\n`;
    
    // Подсчитываем статистику по ветке
    let totalCases = 0;
    const difficultyCount = { basic: 0, intermediate: 0, advanced: 0 };
    
    Object.values(branchData.nodes).forEach(nodeData => {
      totalCases += nodeData.cases.length;
      nodeData.cases.forEach(c => {
        difficultyCount[c.difficulty] = (difficultyCount[c.difficulty] || 0) + 1;
      });
    });
    
    md += `**Статистика:**\n`;
    md += `- Всего кейсов: ${totalCases}\n`;
    md += `- Basic: ${difficultyCount.basic}\n`;
    md += `- Intermediate: ${difficultyCount.intermediate}\n`;
    md += `- Advanced: ${difficultyCount.advanced}\n\n`;
    
    // Сортируем узлы по tier
    const nodes = Object.entries(branchData.nodes).sort((a, b) => {
      const tierOrder = { basic: 1, intermediate: 2, advanced: 3 };
      const tierA = tierOrder[a[1].node_info.tier] || 99;
      const tierB = tierOrder[b[1].node_info.tier] || 99;
      if (tierA !== tierB) return tierA - tierB;
      return a[0].localeCompare(b[0]);
    });
    
    nodes.forEach(([nodeId, nodeData]) => {
      const nodeInfo = nodeData.node_info;
      
      md += `### ${nodeInfo.name || nodeId}\n\n`;
      md += `**ID узла:** \`${nodeId}\`  \n`;
      md += `**Tier:** ${nodeInfo.tier || 'не указан'}  \n`;
      md += `**Описание:** ${nodeInfo.description || 'Нет описания'}\n\n`;
      md += `**Кейсы (${nodeData.cases.length}):**\n\n`;
      
      // Сортируем кейсы по сложности
      const sortedCases = [...nodeData.cases].sort((a, b) => {
        const diffOrder = { basic: 1, intermediate: 2, advanced: 3 };
        return diffOrder[a.difficulty] - diffOrder[b.difficulty];
      });
      
      sortedCases.forEach((c, idx) => {
        md += `${idx + 1}. **${c.title}** (\`${c.id}\`) - ${c.difficulty}\n`;
      });
      
      md += `\n`;
    });
    
    md += `---\n\n`;
  });

// Сохраняем отчёт
const reportPath = path.join(__dirname, '../cases-report.md');
fs.writeFileSync(reportPath, md, 'utf8');

console.log(`Отчёт создан: ${reportPath}`);
console.log(`Всего веток: ${Object.keys(report).length}`);
console.log(`Всего узлов: ${Object.values(report).reduce((sum, b) => sum + Object.keys(b.nodes).length, 0)}`);
