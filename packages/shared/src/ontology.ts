/**
 * Онтология методологии Leadership Architect
 *
 * Этот файл является единым источником истины для методологических констант и типов.
 * Все системные решения должны опираться на эти определения.
 *
 * @see docs/DECISION_LOGIC.md для логики принятия решений
 * @see docs/audit/PROJECT_MATURITY_AUDIT_REPORT.md для текущего состояния
 */

// =============================================================================
// УРОВНИ РАЗВИТИЯ (Development Levels)
// =============================================================================

/**
 * Уровни интеграции способности
 * Отражают глубину освоения способа действия
 */
export enum IntegrationLevel {
  /** Novice: Знает о способе, пробует применять */
  NOVICE = 'Novice',
  /** Integrated: Применяет осознанно в подходящих ситуациях */
  INTEGRATED = 'Integrated',
  /** Embodied: Способ стал частью идентичности, применяется автоматически */
  EMBODIED = 'Embodied',
}

/**
 * Состояния узла в дереве способностей
 */
export enum NodeState {
  /** Узел заблокирован, prerequisites не выполнены */
  LOCKED = 'locked',
  /** Узел доступен для развития (prerequisites выполнены) */
  AVAILABLE = 'available',
  /** Пользователь активно работает над узлом (>30% XP) */
  ACTIVE = 'active',
  /** Узел разблокирован (100% XP), уровень Integrated */
  UNLOCKED = 'unlocked',
  /** Узел интегрирован (150% XP), уровень Embodied */
  INTEGRATED = 'integrated',
}

/**
 * Уровни сложности узлов (tier)
 * 
 * ВАЖНО: В БД (AbilityNode.level) используются legacy-значения: basic, mid, advanced, master
 * В seed файле и ontology используются: basic, intermediate, advanced
 * 
 * Используйте TIER_TO_LEGACY_LEVEL для маппинга при работе с БД
 */
export enum NodeTier {
  /** Базовые способности, доступны сразу */
  BASIC = 'basic',
  /** Промежуточные, требуют базовые prerequisites */
  INTERMEDIATE = 'intermediate',
  /** Продвинутые, требуют промежуточные prerequisites */
  ADVANCED = 'advanced',
}

/**
 * Маппинг tier на legacy level в БД
 * БД: basic, mid, advanced, master
 * Ontology: basic, intermediate, advanced
 */
export const TIER_TO_LEGACY_LEVEL: Record<NodeTier, string> = {
  [NodeTier.BASIC]: 'basic',
  [NodeTier.INTERMEDIATE]: 'mid',
  [NodeTier.ADVANCED]: 'advanced',
};

/**
 * Маппинг legacy level из БД на tier
 */
export const LEGACY_LEVEL_TO_TIER: Record<string, NodeTier> = {
  'basic': NodeTier.BASIC,
  'mid': NodeTier.INTERMEDIATE,
  'intermediate': NodeTier.INTERMEDIATE, // поддержка обоих вариантов
  'advanced': NodeTier.ADVANCED,
  'master': NodeTier.ADVANCED, // master маппится на advanced
};

/**
 * Типы развития способности
 */
export enum DevelopmentType {
  /** Развивается через практику в реальности */
  PRACTICE = 'practice',
  /** Развивается через рефлексию */
  REFLECTION = 'reflection',
  /** Развивается через изучение теории */
  THEORY = 'theory',
  /** Смешанный тип */
  MIXED = 'mixed',
}

// =============================================================================
// ДОМЕНЫ ОНТОЛОГИИ (Ontology Domains)
// =============================================================================

/**
 * Шесть доменов онтологии Leadership Architect
 * Каждый домен представляет аспект развития руководителя
 */
export enum OntologyDomain {
  /** Субъектность: способность действовать из себя */
  SUBJECTIVITY = 'subjectivity',
  /** Форма: структуры мышления и восприятия */
  FORM = 'form',
  /** Поле: пространство влияния и отношений */
  FIELD = 'field',
  /** Архитектура: системы и процессы */
  ARCHITECTURE = 'architecture',
  /** Интеграция: связывание разных аспектов */
  INTEGRATION = 'integration',
  /** Билд: стиль лидерства как целое */
  BUILD = 'build',
}

/**
 * Маппинг доменов на ветки дерева (LEADER)
 */
export const DOMAIN_TO_BRANCH: Record<OntologyDomain, string> = {
  [OntologyDomain.SUBJECTIVITY]: 'branch_leadership',
  [OntologyDomain.FORM]: 'branch_emergence',
  [OntologyDomain.FIELD]: 'branch_architecture',
  [OntologyDomain.ARCHITECTURE]: 'branch_dynamics',
  [OntologyDomain.INTEGRATION]: 'branch_execution',
  [OntologyDomain.BUILD]: 'branch_resilience',
};

// =============================================================================
// CORE LOOP
// =============================================================================

/**
 * Этапы Core Loop
 * Основной цикл развития: Ситуация → Анализ → Квест → Действие → Evidence → Сдвиг
 */
export enum CoreLoopStage {
  /** Пользователь описывает управленческую ситуацию */
  ENTRY = 'entry',
  /** Система анализирует ситуацию и выявляет паттерны */
  ANALYSIS = 'analysis',
  /** Генерация квеста на основе анализа */
  QUEST = 'quest',
  /** Пользователь выполняет действие в реальности */
  ACTION = 'action',
  /** Фиксация результата как evidence */
  EVIDENCE = 'evidence',
  /** Обновление дерева способностей */
  TREE_UPDATE = 'tree_update',
}

/**
 * Полный путь Core Loop
 */
export const CORE_LOOP_PATH: CoreLoopStage[] = [
  CoreLoopStage.ENTRY,
  CoreLoopStage.ANALYSIS,
  CoreLoopStage.QUEST,
  CoreLoopStage.ACTION,
  CoreLoopStage.EVIDENCE,
  CoreLoopStage.TREE_UPDATE,
];

// =============================================================================
// ТИПЫ КВЕСТОВ
// =============================================================================

/**
 * Типы квестов
 */
export enum QuestType {
  /** Микро-квест: 5-15 минут, одно действие */
  MICRO = 'micro',
  /** Недельный квест: серия действий в течение недели */
  WEEKLY = 'weekly',
  /** Сюжетный квест: длинная история с развитием */
  STORY = 'story',
  /** In-person квест: из анализа реальной ситуации */
  IN_PERSON = 'in-person',
}

/**
 * Статусы квестов
 */
export enum QuestStatus {
  /** В бэклоге, не начат */
  BACKLOG = 'backlog',
  /** Активен, пользователь работает */
  ACTIVE = 'active',
  /** Завершён успешно */
  DONE = 'done',
  /** Архивирован (не завершён, но неактуален) */
  ARCHIVED = 'archived',
}

// =============================================================================
// СЛОЖНОСТЬ КЕЙСОВ
// =============================================================================

/**
 * Уровни сложности кейсов
 */
export enum CaseDifficulty {
  /** Базовый: очевидный выбор, знакомство с паттерном */
  BASIC = 'basic',
  /** Средний: требует анализа, несколько факторов */
  INTERMEDIATE = 'intermediate',
  /** Продвинутый: сложная ситуация, неоднозначные решения */
  ADVANCED = 'advanced',
}

/**
 * Требования для доступа к кейсам по сложности
 */
export const CASE_ACCESS_REQUIREMENTS: Record<
  CaseDifficulty,
  { minProgress: number; minQuestsCompleted: number; requiresIntermediateCase: boolean }
> = {
  [CaseDifficulty.BASIC]: {
    minProgress: 0,
    minQuestsCompleted: 1,
    requiresIntermediateCase: false,
  },
  [CaseDifficulty.INTERMEDIATE]: {
    minProgress: 30,
    minQuestsCompleted: 1,
    requiresIntermediateCase: false,
  },
  [CaseDifficulty.ADVANCED]: {
    minProgress: 60,
    minQuestsCompleted: 2,
    requiresIntermediateCase: true,
  },
};

// =============================================================================
// XP И ПРОГРЕСС
// =============================================================================

/**
 * Пороги XP для изменения состояния узла
 */
export const XP_THRESHOLDS = {
  /** Процент XP для перехода в active */
  TO_ACTIVE: 30,
  /** Процент XP для перехода в unlocked (Integrated) */
  TO_UNLOCKED: 100,
  /** Процент XP для перехода в integrated (Embodied) */
  TO_INTEGRATED: 150,
} as const;

/**
 * Награды XP по типу квеста
 */
export const QUEST_XP_REWARDS: Record<QuestType, { min: number; max: number }> = {
  [QuestType.MICRO]: { min: 5, max: 10 },
  [QuestType.WEEKLY]: { min: 15, max: 30 },
  [QuestType.STORY]: { min: 30, max: 50 },
  [QuestType.IN_PERSON]: { min: 10, max: 25 },
};

/**
 * Награды XP по сложности кейса
 */
export const CASE_XP_REWARDS: Record<CaseDifficulty, number> = {
  [CaseDifficulty.BASIC]: 5,
  [CaseDifficulty.INTERMEDIATE]: 10,
  [CaseDifficulty.ADVANCED]: 15,
};

// =============================================================================
// ТИПЫ ДЛЯ ОБЪЯСНИМОСТИ (Explainability)
// =============================================================================

/**
 * Структура rationale для объяснения решения системы
 */
export interface Rationale {
  /** Краткое объяснение решения */
  summary: string;
  /** Причины, приведшие к решению */
  reasons: string[];
  /** Ссылки на evidence, поддерживающие решение */
  evidenceLinks?: string[];
  /** ID узлов дерева, связанных с решением */
  linkedNodes?: string[];
  /** Уверенность системы в решении (0-1) */
  confidence?: number;
}

/**
 * Типы решений, требующих rationale
 */
export enum DecisionType {
  /** Генерация квеста */
  QUEST_GENERATION = 'quest_generation',
  /** Обновление узла дерева */
  TREE_UPDATE = 'tree_update',
  /** Обнаружение билда */
  BUILD_DETECTION = 'build_detection',
  /** Анализ ситуации */
  ANALYSIS = 'analysis',
  /** Завершение квеста */
  QUEST_COMPLETION = 'quest_completion',
}

// =============================================================================
// БИЛДЫ (Leadership Styles)
// =============================================================================

/**
 * Предопределённые билды (стили лидерства)
 */
export enum BuildType {
  /** Архитектор: строит системы */
  ARCHITECT = 'architect',
  /** Стратег: видит долгосрочную перспективу */
  STRATEGIST = 'strategist',
  /** Катализатор: запускает изменения */
  CATALYST = 'catalyst',
  /** Координатор: связывает людей и процессы */
  COORDINATOR = 'coordinator',
  /** Наставник: развивает других */
  MENTOR = 'mentor',
}

/**
 * Минимальное количество узлов для обнаружения билда
 */
export const BUILD_DETECTION_THRESHOLD = {
  /** Минимум узлов в состоянии unlocked/integrated для детекции */
  MIN_NODES: 3,
  /** Минимальный средний уровень интеграции */
  MIN_AVG_INTEGRATION: IntegrationLevel.INTEGRATED,
} as const;

// =============================================================================
// ВАЛИДАЦИЯ И ТИПЫ УТИЛИТ
// =============================================================================

/**
 * Проверка, является ли значение валидным IntegrationLevel
 */
export function isValidIntegrationLevel(value: string): value is IntegrationLevel {
  return Object.values(IntegrationLevel).includes(value as IntegrationLevel);
}

/**
 * Проверка, является ли значение валидным NodeState
 */
export function isValidNodeState(value: string): value is NodeState {
  return Object.values(NodeState).includes(value as NodeState);
}

/**
 * Получить следующее состояние узла на основе прогресса
 */
export function getNextNodeState(currentProgress: number): NodeState {
  if (currentProgress >= XP_THRESHOLDS.TO_INTEGRATED) {
    return NodeState.INTEGRATED;
  }
  if (currentProgress >= XP_THRESHOLDS.TO_UNLOCKED) {
    return NodeState.UNLOCKED;
  }
  if (currentProgress >= XP_THRESHOLDS.TO_ACTIVE) {
    return NodeState.ACTIVE;
  }
  return NodeState.AVAILABLE;
}

/**
 * Получить IntegrationLevel на основе NodeState
 */
export function getIntegrationLevelFromState(state: NodeState): IntegrationLevel {
  switch (state) {
    case NodeState.INTEGRATED:
      return IntegrationLevel.EMBODIED;
    case NodeState.UNLOCKED:
      return IntegrationLevel.INTEGRATED;
    default:
      return IntegrationLevel.NOVICE;
  }
}
