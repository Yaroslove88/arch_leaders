/**
 * Типы для метрик Core Loop
 */

/**
 * Метрики за период
 */
export interface PeriodMetrics {
  /** Период */
  period: {
    start: Date;
    end: Date;
    days: number;
  };
  /** Core Loop метрики */
  coreLoop: {
    /** Количество начатых Core Loop (Entry -> Analysis) */
    started: number;
    /** Количество завершённых Core Loop (Evidence -> Tree Update) */
    completed: number;
    /** Completion rate в процентах */
    completionRate: number;
    /** Среднее время от Entry до первого Evidence (мс) */
    avgTimeToFirstResult?: number;
  };
  /** Метрики по компонентам */
  components: {
    entries: number;
    sessions: number;
    quests: number;
    evidences: number;
  };
  /** Прогресс дерева */
  tree: {
    /** Количество обновлённых узлов */
    nodesUpdated: number;
    /** Общий XP за период */
    totalXpGained: number;
    /** Новые разблокированные узлы */
    nodesUnlocked: number;
  };
}

/**
 * Ежедневная статистика пользователя
 */
export interface DailyStats {
  date: string;
  entriesCount: number;
  sessionsSucceeded: number;
  questsCompleted: number;
  evidencesCount: number;
}

/**
 * Запрос метрик
 */
export interface MetricsRequest {
  /** Количество дней (default: 7) */
  days?: number;
  /** Начало периода */
  startDate?: Date;
  /** Конец периода */
  endDate?: Date;
}

/**
 * Сводка метрик для dashboard
 */
export interface MetricsSummary {
  /** Текущая неделя */
  thisWeek: PeriodMetrics;
  /** Прошлая неделя */
  lastWeek: PeriodMetrics;
  /** Тренд (процент изменения) */
  trend: {
    completionRate: number;
    entries: number;
    evidences: number;
  };
}
