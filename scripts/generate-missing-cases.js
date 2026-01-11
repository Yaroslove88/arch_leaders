/**
 * Генератор недостающих кейсов
 * Создаёт кейсы на основе описаний нод и уровней сложности
 */

const fs = require('fs');
const path = require('path');

// Читаем данные
const casesFile = path.join(__dirname, '..', 'data', 'interactive-cases.json');
const casesData = JSON.parse(fs.readFileSync(casesFile, 'utf-8'));

const missingFile = path.join(__dirname, '..', 'data', 'missing-cases.json');
const missingData = JSON.parse(fs.readFileSync(missingFile, 'utf-8'));

const descFile = path.join(__dirname, '..', 'data', 'node-descriptions.json');
const descData = JSON.parse(fs.readFileSync(descFile, 'utf-8'));

const treeFile = path.join(__dirname, '..', 'packages', 'shared', 'src', 'seed', 'initial-ability-tree.json');
const treeData = JSON.parse(fs.readFileSync(treeFile, 'utf-8'));

// Шаблоны компаний по сложности
const companyTemplates = {
  basic: [
    'Небольшой стартап, 8 человек',
    'Малый бизнес, 15 сотрудников',
    'Проектная команда из 5 человек',
    'Отдел в небольшой компании',
    'Начинающая команда разработки'
  ],
  intermediate: [
    'Средняя IT-компания, 80 человек',
    'Производственная компания, 150 сотрудников',
    'Консалтинговое агентство, 50 человек',
    'Региональный филиал банка',
    'Маркетинговое агентство, 40 человек'
  ],
  advanced: [
    'Крупный холдинг, 500+ сотрудников',
    'Федеральная компания с филиалами',
    'Международная корпорация',
    'Группа компаний с матричной структурой',
    'Быстрорастущий единорог'
  ]
};

const environmentTemplates = {
  basic: [
    'Стабильная среда, понятные задачи',
    'Рост без серьёзных вызовов',
    'Знакомые процессы и клиенты',
    'Предсказуемый рынок'
  ],
  intermediate: [
    'Умеренная конкуренция, изменения рынка',
    'Период роста и трансформации',
    'Новые вызовы и возможности',
    'Смена стратегии компании'
  ],
  advanced: [
    'Высокая неопределённость, кризис',
    'Радикальные изменения отрасли',
    'Жёсткая конкуренция, давление стейкхолдеров',
    'Системная трансформация'
  ]
};

const pressureLevels = {
  basic: 'низкое',
  intermediate: 'среднее',
  advanced: 'высокое'
};

const maturityLevels = {
  basic: 'низкая',
  intermediate: 'средняя',
  advanced: 'высокая'
};

const accessBars = {
  basic: 'Уровень I',
  intermediate: 'Уровень II',
  advanced: 'Уровень III'
};

// Генерация case_id
function generateCaseId(nodeId, difficulty) {
  const baseName = nodeId.replace('node_', 'case_');
  const level = difficulty === 'basic' ? '1' : difficulty === 'intermediate' ? '2' : '3';
  return `${baseName}_${level}`;
}

// Случайный элемент из массива
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Генерация кейса для конкретной ноды и сложности
function generateCase(nodeId, branchId, difficulty, nodeDesc) {
  const caseId = generateCaseId(nodeId, difficulty);
  const nodeName = nodeDesc.name || nodeId;
  const examples = nodeDesc.examples || [];
  const reflectionPrompts = nodeDesc.reflection_prompts || [];
  const practicalMeaning = nodeDesc.practical_meaning || '';
  const fullDescription = nodeDesc.full_description || '';

  // Создаём контекстно-релевантный кейс
  const company = randomFrom(companyTemplates[difficulty]);
  const environment = randomFrom(environmentTemplates[difficulty]);

  // Генерируем позиции на основе описания ноды
  const positions = generatePositions(nodeId, nodeDesc, difficulty);

  const caseData = {
    id: caseId,
    node_id: nodeId,
    branch_id: branchId,
    difficulty: difficulty,
    title: generateTitle(nodeName, difficulty),
    maturity_level: maturityLevels[difficulty],
    pressure_level: pressureLevels[difficulty],
    uncertainty: maturityLevels[difficulty],
    subjectivity_load: maturityLevels[difficulty],
    systemic_regress_risk: difficulty === 'advanced' ? 'средний' : 'низкий',
    symbols: [nodeName.split(' ')[0]],
    strategic_tags: [branchId.replace('branch_', '').replace(/_/g, ' ')],

    portal: {
      header_title: 'КЕЙС',
      case_name: generateTitle(nodeName, difficulty),
      subtitle: generateSubtitle(nodeDesc, difficulty),
      marker_icons: [nodeName.split(' ')[0]],
      access_bar: accessBars[difficulty]
    },

    event: {
      label: generateEventLabel(difficulty),
      summary: generateEventSummary(nodeDesc, difficulty),
      urgency: pressureLevels[difficulty]
    },

    space_map: {
      company: company,
      environment: environment,
      constraints: generateConstraints(difficulty),
      people: generatePeople(difficulty),
      mode: generateMode(difficulty)
    },

    facts: {
      strict_facts: generateFacts(nodeDesc, difficulty)
    },

    background: {
      story: generateStory(nodeDesc, difficulty)
    },

    dilemma: {
      question: generateDilemma(nodeDesc, difficulty),
      ambiance: generateAmbiance(nodeDesc)
    },

    positions: positions,

    options: positions.map(p => ({
      id: p.id,
      text: p.description,
      skill_used: p.position_type,
      consequence: p.consequence,
      hint: p.reflection_prompt
    })),

    indicators: {
      maturity: maturityLevels[difficulty],
      uncertainty: maturityLevels[difficulty],
      subjectivity: maturityLevels[difficulty],
      regress_risk: difficulty === 'advanced' ? 'средний' : 'низкий'
    },

    reflection: {
      questions: reflectionPrompts.slice(0, 3).length > 0
        ? reflectionPrompts.slice(0, 3)
        : generateReflectionQuestions(nodeDesc),
      after_choice_insights: generateInsights(nodeDesc)
    }
  };

  // Генерируем context для обратной совместимости
  caseData.context = Object.entries(caseData.space_map)
    .filter(([k, v]) => v)
    .map(([k, v]) => {
      const labels = {
        company: 'Компания',
        environment: 'Среда',
        constraints: 'Ограничения',
        people: 'Участники',
        mode: 'Режим'
      };
      return `${labels[k] || k}: ${v}`;
    })
    .join('\n');

  return caseData;
}

function generateTitle(nodeName, difficulty) {
  const prefixes = {
    basic: ['Простой случай:', 'Начальный уровень:', 'Базовая ситуация:'],
    intermediate: ['Рабочий случай:', 'Типичная ситуация:', 'Практический кейс:'],
    advanced: ['Сложный случай:', 'Системный вызов:', 'Стратегическая дилемма:']
  };
  return `${randomFrom(prefixes[difficulty])} ${nodeName}`;
}

function generateSubtitle(nodeDesc, difficulty) {
  const words = (nodeDesc.practical_meaning || nodeDesc.full_description || '').split(' ').slice(0, 3);
  return words.join(' · ');
}

function generateEventLabel(difficulty) {
  const labels = {
    basic: ['Ситуация', 'Момент', 'Эпизод'],
    intermediate: ['Вызов', 'Задача', 'Проблема'],
    advanced: ['Кризис', 'Развилка', 'Точка невозврата']
  };
  return randomFrom(labels[difficulty]);
}

function generateEventSummary(nodeDesc, difficulty) {
  const examples = nodeDesc.examples || [];
  if (examples.length > 0) {
    return examples[Math.min(difficulty === 'basic' ? 0 : difficulty === 'intermediate' ? 1 : 2, examples.length - 1)];
  }
  return nodeDesc.practical_meaning || 'Ситуация требует принятия решения.';
}

function generateConstraints(difficulty) {
  const constraints = {
    basic: ['Ограниченное время', 'Небольшой бюджет', 'Мало опыта в команде'],
    intermediate: ['Сжатые сроки и ресурсы', 'Противоречивые требования', 'Недостаток информации'],
    advanced: ['Жёсткие дедлайны и высокие ставки', 'Конфликт интересов стейкхолдеров', 'Системные ограничения']
  };
  return randomFrom(constraints[difficulty]);
}

function generatePeople(difficulty) {
  const people = {
    basic: ['Небольшая команда, 3-5 человек', 'Один коллега и руководитель', 'Команда новичков'],
    intermediate: ['Кросс-функциональная команда', 'Несколько отделов', 'Команда с разным опытом'],
    advanced: ['Множество стейкхолдеров', 'Совет директоров и топ-менеджмент', 'Распределённые команды']
  };
  return randomFrom(people[difficulty]);
}

function generateMode(difficulty) {
  const modes = {
    basic: ['Обучение на практике', 'Поддерживающая среда', 'Право на ошибку'],
    intermediate: ['Рабочий режим с вызовами', 'Баланс контроля и автономии', 'Ожидание результата'],
    advanced: ['Высокие ставки', 'Нет права на ошибку', 'Стратегические последствия']
  };
  return randomFrom(modes[difficulty]);
}

function generateFacts(nodeDesc, difficulty) {
  const meaning = nodeDesc.practical_meaning || nodeDesc.full_description || '';
  return `Ситуация связана с ${meaning.toLowerCase().slice(0, 100)}...`;
}

function generateStory(nodeDesc, difficulty) {
  const guidance = nodeDesc.situation_guidance || '';
  if (guidance) {
    return guidance.slice(0, 150) + (guidance.length > 150 ? '...' : '');
  }
  return 'Ситуация требует осознанного выбора между разными подходами.';
}

function generateDilemma(nodeDesc, difficulty) {
  const prompts = nodeDesc.reflection_prompts || [];
  if (prompts.length > 0) {
    return prompts[0];
  }
  return `Как применить ${nodeDesc.name || 'навык'} в этой ситуации?`;
}

function generateAmbiance(nodeDesc) {
  return nodeDesc.practical_meaning || 'Выбор определяет дальнейшее развитие.';
}

function generatePositions(nodeId, nodeDesc, difficulty) {
  const examples = nodeDesc.examples || [];
  const integrationLevels = nodeDesc.integration_levels || {};

  // Базовые позиции: консервативный vs прогрессивный подход
  const positions = [
    {
      id: 'A',
      description: generatePositionA(nodeDesc, difficulty),
      position_type: 'Консервативный подход',
      consequence: {
        immediate: 'Быстрый результат, минимум рисков',
        second_order: 'Возможно упущение возможностей для роста',
        systemic: 'Система остаётся в зоне комфорта'
      },
      reflection_prompt: 'Что для тебя важнее: безопасность или развитие?'
    },
    {
      id: 'B',
      description: generatePositionB(nodeDesc, difficulty),
      position_type: 'Развивающий подход',
      consequence: {
        immediate: 'Требует больше времени и усилий',
        second_order: 'Создаёт условия для роста',
        systemic: 'Формирует новые паттерны поведения'
      },
      reflection_prompt: 'Готов ли ты инвестировать в долгосрочное развитие?'
    }
  ];

  // Для advanced добавляем третью позицию
  if (difficulty === 'advanced') {
    positions.push({
      id: 'C',
      description: generatePositionC(nodeDesc),
      position_type: 'Трансформационный подход',
      consequence: {
        immediate: 'Высокий риск, высокая неопределённость',
        second_order: 'Потенциал для прорыва',
        systemic: 'Возможность системной трансформации'
      },
      reflection_prompt: 'Готов ли ты к радикальным изменениям?'
    });
  }

  return positions;
}

function generatePositionA(nodeDesc, difficulty) {
  const name = nodeDesc.name || 'навык';
  const options = [
    `Применить стандартный подход к ${name.toLowerCase()}`,
    `Использовать проверенные методы`,
    `Действовать по знакомому сценарию`,
    `Минимизировать риски, следуя правилам`
  ];
  return randomFrom(options);
}

function generatePositionB(nodeDesc, difficulty) {
  const examples = nodeDesc.examples || [];
  if (examples.length > 0) {
    return examples[0];
  }
  const name = nodeDesc.name || 'навык';
  const options = [
    `Осознанно развивать ${name.toLowerCase()}`,
    `Экспериментировать с новым подходом`,
    `Создать условия для развития`,
    `Инвестировать в долгосрочный результат`
  ];
  return randomFrom(options);
}

function generatePositionC(nodeDesc) {
  const name = nodeDesc.name || 'навык';
  return `Радикально пересмотреть подход к ${name.toLowerCase()}, создать новую форму`;
}

function generateReflectionQuestions(nodeDesc) {
  const name = nodeDesc.name || 'навык';
  return [
    `Что изменилось в твоём понимании ${name.toLowerCase()}?`,
    `Какой подход ближе твоему стилю лидерства?`,
    `Что мешает применять этот навык регулярно?`
  ];
}

function generateInsights(nodeDesc) {
  const name = nodeDesc.name || 'Навык';
  return [
    `${name} развивается через осознанную практику.`,
    `Выбор подхода зависит от контекста и зрелости системы.`
  ];
}

// Основная логика
console.log('Генерация недостающих кейсов...\n');

const newCases = [];

missingData.missing.forEach(m => {
  const nodeDesc = descData.node_descriptions[m.node_id] || { name: m.node_name };
  const newCase = generateCase(m.node_id, m.branch_id, m.difficulty, nodeDesc);
  newCases.push(newCase);
  console.log(`✓ ${newCase.id}: ${newCase.title}`);
});

console.log(`\nСгенерировано: ${newCases.length} кейсов`);

// Объединяем с существующими
const allCases = [...casesData.interactive_cases, ...newCases];

// Сортируем по node_id и difficulty
allCases.sort((a, b) => {
  if (a.node_id !== b.node_id) return a.node_id.localeCompare(b.node_id);
  const diffOrder = { basic: 1, intermediate: 2, advanced: 3 };
  return (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0);
});

// Записываем результат
const outputData = { interactive_cases: allCases };
fs.writeFileSync(casesFile, JSON.stringify(outputData, null, 2), 'utf-8');

console.log(`\nИТОГО: ${allCases.length} кейсов записано в ${casesFile}`);

// Статистика
const byDiff = {};
const byNode = {};
allCases.forEach(c => {
  byDiff[c.difficulty] = (byDiff[c.difficulty] || 0) + 1;
  byNode[c.node_id] = (byNode[c.node_id] || 0) + 1;
});

console.log('\nПо сложности:', byDiff);
console.log('Нод с кейсами:', Object.keys(byNode).length);
