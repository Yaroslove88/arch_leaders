import * as fs from 'fs';
import * as path from 'path';

interface InteractiveCase {
  id: string;
  title: string;
  node_id?: string;
  branch_id?: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  context: string;
  options?: any[];
}

interface AbilityNode {
  node_id: string;
  name: string;
  branch_id?: string;
  xp_required: number;
  [key: string]: any;
}

interface SemanticTree {
  nodes: AbilityNode[];
  [key: string]: any;
}

interface CaseRankingInfo {
  position: number;
  case: InteractiveCase;
  isSolved: boolean;
  nodeLevel: number;
  nodeId: string;
  difficultyOrder: number;
  rankingFactors: {
    solved: boolean;
    level: number;
    nodeId: string;
    difficulty: string;
  };
}

function getNodeLevel(nodeId: string | undefined, tree: SemanticTree | null): number {
  if (!nodeId || !tree || !tree.nodes) return 1;
  
  // Ищем узел в дереве
  const node = tree.nodes.find((n: AbilityNode) => n.node_id === nodeId);
  
  if (!node) {
    return 1; // Fallback
  }
  
  // Если у узла нет branch_id, считаем его узлом уровня 1
  if (!node.branch_id) {
    return 1;
  }
  
  // Получаем все узлы этой ветки
  const branchNodes = tree.nodes.filter((n: AbilityNode) => n.branch_id === node.branch_id);
  
  if (branchNodes.length === 0) {
    return 1;
  }
  
  // Сортируем узлы ветки по xp_required для определения уровня
  const sortedNodes = [...branchNodes].sort((a, b) => 
    (a.xp_required || 0) - (b.xp_required || 0)
  );
  
  // Определяем уровень на основе позиции в отсортированном списке
  // Узлы с меньшим xp_required - уровень 1, с большим - уровень 2
  const nodeIndex = sortedNodes.findIndex((n: AbilityNode) => 
    n.node_id === nodeId
  );
  
  if (nodeIndex === -1) {
    return 1;
  }
  
  // Разделяем на уровни: первые 50% - уровень 1, остальные - уровень 2
  const threshold = Math.ceil(sortedNodes.length / 2);
  return nodeIndex < threshold ? 1 : 2;
}

function rankCases(cases: InteractiveCase[], solvedCases: string[], tree: SemanticTree | null): CaseRankingInfo[] {
  const difficultyOrder = { basic: 1, intermediate: 2, advanced: 3 };
  
  const ranked = cases.map((case_, index) => {
    const isSolved = solvedCases.includes(case_.id);
    const nodeLevel = getNodeLevel(case_.node_id, tree);
    const difficultyOrderValue = difficultyOrder[case_.difficulty];
    
    return {
      originalIndex: index,
      case: case_,
      isSolved,
      nodeLevel,
      nodeId: case_.node_id || 'нет',
      difficultyOrder: difficultyOrderValue,
      difficulty: case_.difficulty,
    };
  });
  
  // Сортируем
  ranked.sort((a, b) => {
    // 1. Решённые кейсы в конец
    if (a.isSolved !== b.isSolved) return a.isSolved ? 1 : -1;
    
    // 2. По уровню узла (1 → 2)
    if (a.nodeLevel !== b.nodeLevel) {
      return a.nodeLevel - b.nodeLevel;
    }
    
    // 3. Если уровень одинаковый, сортируем по node_id для группировки по узлам
    if (a.nodeId !== b.nodeId) {
      return (a.nodeId || '').localeCompare(b.nodeId || '');
    }
    
    // 4. По сложности внутри узла (basic → intermediate → advanced)
    return a.difficultyOrder - b.difficultyOrder;
  });
  
  return ranked.map((item, index) => ({
    position: index + 1,
    case: item.case,
    isSolved: item.isSolved,
    nodeLevel: item.nodeLevel,
    nodeId: item.nodeId,
    difficultyOrder: item.difficultyOrder,
    rankingFactors: {
      solved: item.isSolved,
      level: item.nodeLevel,
      nodeId: item.nodeId,
      difficulty: item.difficulty,
    },
  }));
}

function generateReport(rankingInfo: CaseRankingInfo[]): string {
  let report = '# Отчет о ранжировании кейсов\n\n';
  report += `**Дата генерации:** ${new Date().toLocaleString('ru-RU')}\n\n`;
  report += `**Всего кейсов:** ${rankingInfo.length}\n\n`;
  report += `**Решённых кейсов:** ${rankingInfo.filter(c => c.isSolved).length}\n\n`;
  
  report += '## Формула ранжирования\n\n';
  report += 'Кейсы сортируются по следующему приоритету:\n\n';
  report += '1. **Решённые кейсы** → перемещаются в конец списка\n';
  report += '2. **Уровень узла** → сначала уровень 1, затем уровень 2\n';
  report += '3. **ID узла** → группировка по узлам (алфавитный порядок)\n';
  report += '4. **Сложность** → внутри узла: basic → intermediate → advanced\n\n';
  
  report += '---\n\n';
  
  report += '## Детальная информация по каждому кейсу\n\n';
  
  for (const info of rankingInfo) {
    report += `### ${info.position}. ${info.case.title}\n\n`;
    report += `- **ID кейса:** \`${info.case.id}\`\n`;
    report += `- **Позиция:** ${info.position}\n`;
    report += `- **Решён:** ${info.isSolved ? '✅ Да' : '❌ Нет'}\n`;
    report += `- **Узел:** ${info.nodeId}\n`;
    report += `- **Уровень узла:** ${info.nodeLevel}\n`;
    report += `- **Сложность:** ${info.case.difficulty}\n`;
    report += `- **Порядок сложности:** ${info.difficultyOrder}\n\n`;
    
    report += '**Факторы, повлиявшие на позицию:**\n\n';
    
    if (info.isSolved) {
      report += `- ⬇️ **Решённый кейс** → перемещён в конец списка\n`;
    } else {
      report += `- ✅ **Не решён** → остаётся в начале\n`;
    }
    
    report += `- 📊 **Уровень ${info.nodeLevel}** → ${info.nodeLevel === 1 ? 'приоритет выше' : 'приоритет ниже'}\n`;
    report += `- 🔗 **Узел:** \`${info.nodeId}\` → группировка с другими кейсами этого узла\n`;
    report += `- 📈 **Сложность:** ${info.case.difficulty} (порядок: ${info.difficultyOrder}) → внутри узла сортировка по сложности\n\n`;
    
    // Сравнение с соседями
    const currentIndex = rankingInfo.indexOf(info);
    if (currentIndex > 0) {
      const prev = rankingInfo[currentIndex - 1];
      report += `**Почему после предыдущего (${prev.position}. ${prev.case.title}):**\n\n`;
      
      if (info.isSolved && !prev.isSolved) {
        report += `- ❌ Не должно быть после нерешённого (решённые должны быть в конце)\n\n`;
      } else if (!info.isSolved && prev.isSolved) {
        report += `- ✅ Правильно: нерешённые выше решённых\n\n`;
      } else if (info.nodeLevel < prev.nodeLevel) {
        report += `- ✅ Уровень ${info.nodeLevel} < ${prev.nodeLevel} (уровень 1 выше уровня 2)\n\n`;
      } else if (info.nodeLevel > prev.nodeLevel) {
        report += `- ❌ Уровень ${info.nodeLevel} > ${prev.nodeLevel} (должно быть выше в списке)\n\n`;
      } else if (info.nodeId !== prev.nodeId) {
        // Разные узлы - проверяем алфавитный порядок
        if (info.nodeId < prev.nodeId) {
          report += `- ❌ node_id "${info.nodeId}" < "${prev.nodeId}" (должно быть выше в списке, т.к. алфавитный порядок)\n\n`;
        } else {
          report += `- ✅ node_id "${info.nodeId}" > "${prev.nodeId}" (правильный алфавитный порядок)\n\n`;
        }
      } else {
        // Одинаковые узлы - проверяем сложность (должна быть по возрастанию)
        if (info.difficultyOrder < prev.difficultyOrder) {
          report += `- ❌ Сложность ${info.case.difficulty} (${info.difficultyOrder}) < ${prev.case.difficulty} (${prev.difficultyOrder}) (должно быть выше, т.к. basic → intermediate → advanced)\n\n`;
        } else if (info.difficultyOrder > prev.difficultyOrder) {
          report += `- ✅ Сложность ${info.case.difficulty} (${info.difficultyOrder}) > ${prev.case.difficulty} (${prev.difficultyOrder}) (правильный порядок: basic → intermediate → advanced)\n\n`;
        } else {
          report += `- ⚠️ Одинаковые параметры (возможно, порядок не определён)\n\n`;
        }
      }
    }
    
    report += '---\n\n';
  }
  
  // Статистика
  report += '## Статистика по уровням\n\n';
  const byLevel = rankingInfo.reduce((acc, info) => {
    if (!info.isSolved) {
      acc[info.nodeLevel] = (acc[info.nodeLevel] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);
  
  for (const [level, count] of Object.entries(byLevel).sort()) {
    report += `- **Уровень ${level}:** ${count} нерешённых кейсов\n`;
  }
  
  report += '\n## Статистика по узлам\n\n';
  const byNode = rankingInfo.reduce((acc, info) => {
    if (!info.isSolved) {
      const nodeId = info.nodeId;
      if (!acc[nodeId]) acc[nodeId] = [];
      acc[nodeId].push(info);
    }
    return acc;
  }, {} as Record<string, CaseRankingInfo[]>);
  
  for (const [nodeId, cases] of Object.entries(byNode).sort()) {
    report += `- **${nodeId}:** ${cases.length} кейсов\n`;
  }
  
  return report;
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const casesFile = path.join(projectRoot, 'data', 'interactive-cases.json');
  
  // Пробуем разные пути к дереву
  const possibleTreePaths = [
    path.join(projectRoot, 'data', 'semantic-tree.json'),
    path.join(projectRoot, 'apps', 'api', 'src', 'data', 'semantic-tree.json'),
    path.join(projectRoot, 'apps', 'api', 'data', 'semantic-tree.json'),
  ];
  
  const outputFile = path.join(projectRoot, 'cases-ranking-report.md');
  
  console.log('Загрузка данных...');
  
  // Загружаем кейсы
  const casesData = JSON.parse(fs.readFileSync(casesFile, 'utf8'));
  const cases: InteractiveCase[] = casesData.interactive_cases || [];
  
  // Загружаем дерево
  let tree: SemanticTree | null = null;
  for (const treePath of possibleTreePaths) {
    try {
      if (fs.existsSync(treePath)) {
        const treeData = JSON.parse(fs.readFileSync(treePath, 'utf8'));
        tree = treeData;
        console.log(`✅ Дерево загружено из: ${treePath}`);
        break;
      }
    } catch (error) {
      // Пробуем следующий путь
    }
  }
  
  if (!tree) {
    console.warn('⚠️ Не удалось загрузить semantic-tree.json, используем fallback (все узлы = уровень 1)');
  }
  
  // Для отчета используем пустой список решённых (можно расширить)
  const solvedCases: string[] = [];
  
  console.log(`Обработка ${cases.length} кейсов...`);
  
  const rankingInfo = rankCases(cases, solvedCases, tree);
  
  console.log('Генерация отчета...');
  const report = generateReport(rankingInfo);
  
  fs.writeFileSync(outputFile, report, 'utf8');
  
  console.log(`\n✅ Отчет сохранён: ${outputFile}`);
  console.log(`\nСтатистика:`);
  console.log(`- Всего кейсов: ${rankingInfo.length}`);
  console.log(`- Решённых: ${rankingInfo.filter(c => c.isSolved).length}`);
  console.log(`- Нерешённых: ${rankingInfo.filter(c => !c.isSolved).length}`);
  
  const byLevel = rankingInfo.reduce((acc, info) => {
    if (!info.isSolved) {
      acc[info.nodeLevel] = (acc[info.nodeLevel] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);
  
  console.log(`\nПо уровням (нерешённые):`);
  for (const [level, count] of Object.entries(byLevel).sort()) {
    console.log(`  Уровень ${level}: ${count}`);
  }
}

main();
