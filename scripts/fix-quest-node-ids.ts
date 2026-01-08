/**
 * Скрипт для исправления несоответствий между ID узлов в квестах и реальными узлами в дереве
 * Дерево - источник истины, квесты должны ссылаться на существующие узлы
 * 
 * Использование: 
 *   cd leadership-architect
 *   npx ts-node scripts/fix-quest-node-ids.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface AbilityNode {
  node_id: string;
  name: string;
  branch_id: string;
}

interface QuestTemplate {
  id: string;
  title: string;
  linked_nodes: string[];
  [key: string]: any;
}

// Маппинг старых ID на новые (на основе названий и смысла)
const nodeMapping: Record<string, string> = {
  // Дизайн мышление
  'node_design_thinking': 'node_thinking_through_form', // Мышление через форму
  
  // Организационная культура
  'node_organizational_culture': 'node_maturity_environment', // Среда зрелости
  
  // Заземление
  'node_grounding': 'node_grounding_point', // Точка опоры
  
  // Обратная связь
  'node_giving_feedback': 'node_feedback_types', // Типы обратной связи
  'node_receiving_feedback': 'node_feedback_through_vulnerability', // Обратная связь через уязвимость
  
  // Стресс и восстановление
  'node_stress_tolerance': 'node_personal_resilience', // Личная устойчивость
  'node_recovery': 'node_recovery_skills', // Навыки восстановления
  
  // Владение и ответственность
  'node_ownership': 'node_psychological_ownership', // Психологическое владение
  'node_accountability': 'node_responsibility_as_form', // Ответственность как форма
  
  // Развитие команды
  'node_team_development': 'node_shared_leadership', // Разделенное лидерство
};

async function fixQuestNodeIds() {
  console.log('🔍 Анализирую несоответствия между квестами и деревом...\n');

  // Загружаем дерево
  const treePath = path.resolve(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');
  const treeContent = fs.readFileSync(treePath, 'utf-8');
  const tree = JSON.parse(treeContent);
  
  const validNodeIds = new Set<string>();
  const nodeNames: Record<string, string> = {};
  
  for (const node of tree.nodes) {
    validNodeIds.add(node.node_id);
    nodeNames[node.node_id] = node.name;
  }
  
  console.log(`✅ Загружено ${validNodeIds.size} узлов из дерева\n`);

  // Загружаем квесты
  const questsPath = path.resolve(__dirname, '../data/quest-templates.json');
  const questsContent = fs.readFileSync(questsPath, 'utf-8');
  const questsData = JSON.parse(questsContent);
  
  // Проверяем структуру (может быть массив или объект с массивом)
  let quests: QuestTemplate[];
  if (Array.isArray(questsData)) {
    quests = questsData;
  } else if (questsData.quest_templates && Array.isArray(questsData.quest_templates)) {
    quests = questsData.quest_templates;
  } else if (questsData.quests && Array.isArray(questsData.quests)) {
    quests = questsData.quests;
  } else if (questsData.templates && Array.isArray(questsData.templates)) {
    quests = questsData.templates;
  } else {
    quests = Object.values(questsData) as QuestTemplate[];
  }
  
  console.log(`✅ Загружено ${quests.length} квестов\n`);

  // Анализируем несоответствия
  const issues: Array<{
    questId: string;
    questTitle: string;
    invalidNodes: string[];
    suggestions: Array<{ old: string; new: string; reason: string }>;
  }> = [];

  for (const quest of quests) {
    if (!quest.linked_nodes || quest.linked_nodes.length === 0) {
      continue;
    }

    const invalidNodes: string[] = [];
    const suggestions: Array<{ old: string; new: string; reason: string }> = [];

    for (const nodeId of quest.linked_nodes) {
      if (!validNodeIds.has(nodeId)) {
        invalidNodes.push(nodeId);
        
        // Проверяем маппинг
        if (nodeMapping[nodeId]) {
          const newId = nodeMapping[nodeId];
          suggestions.push({
            old: nodeId,
            new: newId,
            reason: `Маппинг: ${nodeNames[newId] || newId}`,
          });
        } else {
          // Ищем похожие узлы по названию
          const searchTerm = nodeId.replace('node_', '').replace(/_/g, ' ');
          const similar = Array.from(validNodeIds).find(id => 
            nodeNames[id]?.toLowerCase().includes(searchTerm) ||
            id.toLowerCase().includes(searchTerm)
          );
          
          if (similar) {
            suggestions.push({
              old: nodeId,
              new: similar,
              reason: `Похожий узел: ${nodeNames[similar]}`,
            });
          } else {
            suggestions.push({
              old: nodeId,
              new: '',
              reason: 'Не найдено соответствие',
            });
          }
        }
      }
    }

    if (invalidNodes.length > 0) {
      issues.push({
        questId: quest.id,
        questTitle: quest.title,
        invalidNodes,
        suggestions,
      });
    }
  }

  // Выводим отчет
  console.log('📊 Найдено несоответствий:\n');
  for (const issue of issues) {
    console.log(`❌ Квест: ${issue.questTitle} (${issue.questId})`);
    console.log(`   Неверные узлы: ${issue.invalidNodes.join(', ')}`);
    for (const suggestion of issue.suggestions) {
      if (suggestion.new) {
        console.log(`   → ${suggestion.old} → ${suggestion.new} (${suggestion.reason})`);
      } else {
        console.log(`   → ${suggestion.old} - ${suggestion.reason}`);
      }
    }
    console.log('');
  }

  if (issues.length === 0) {
    console.log('✅ Все узлы в квестах соответствуют дереву!\n');
    return;
  }

  // Исправляем квесты
  console.log(`\n🔧 Исправляю ${issues.length} квестов...\n`);
  
  let fixedCount = 0;
  for (const quest of quests) {
    if (!quest.linked_nodes) continue;
    
    let wasFixed = false;
    const newLinkedNodes = quest.linked_nodes.map(nodeId => {
      if (!validNodeIds.has(nodeId) && nodeMapping[nodeId]) {
        wasFixed = true;
        const newId = nodeMapping[nodeId];
        console.log(`   ✅ ${quest.title}: ${nodeId} → ${newId}`);
        return newId;
      }
      return nodeId;
    });
    
    if (wasFixed) {
      quest.linked_nodes = newLinkedNodes;
      fixedCount++;
    }
  }

  // Сохраняем исправленные квесты
  if (fixedCount > 0) {
    const backupPath = questsPath + '.backup';
    fs.copyFileSync(questsPath, backupPath);
    console.log(`\n💾 Создан бэкап: ${backupPath}`);
    
    // Сохраняем в правильной структуре
    const output = Array.isArray(questsData) 
      ? quests 
      : { ...questsData, quest_templates: quests };
    
    fs.writeFileSync(questsPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ Исправлено ${fixedCount} квестов\n`);
  } else {
    console.log('\n⚠️  Не удалось автоматически исправить квесты');
    console.log('   Проверьте маппинг в скрипте\n');
  }

  // Выводим узлы, которые не удалось исправить
  const remainingIssues = issues.filter(issue => {
    const quest = quests.find(q => q.id === issue.questId);
    if (!quest) return true;
    return issue.invalidNodes.some(nodeId => 
      quest.linked_nodes?.includes(nodeId) && !nodeMapping[nodeId]
    );
  });

  if (remainingIssues.length > 0) {
    console.log('⚠️  Остались неисправленные узлы:\n');
    for (const issue of remainingIssues) {
      const unfixed = issue.suggestions.filter(s => !s.new || !nodeMapping[s.old]);
      if (unfixed.length > 0) {
        console.log(`   ${issue.questTitle}:`);
        for (const s of unfixed) {
          console.log(`     - ${s.old}: ${s.reason}`);
        }
      }
    }
    console.log('\n💡 Нужно вручную добавить маппинг в скрипт\n');
  }
}

fixQuestNodeIds();

