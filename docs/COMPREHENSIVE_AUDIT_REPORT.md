# Комплексный аудит проекта Leadership Architect

**Дата:** 2025-01-10
**Версия:** 1.0

---

## Содержание

1. [Executive Summary](#1-executive-summary)
2. [Архитектура Backend](#2-архитектура-backend)
3. [Архитектура Frontend](#3-архитектура-frontend)
4. [RPG-система и прогрессия](#4-rpg-система-и-прогрессия)
5. [Путь пользователя](#5-путь-пользователя)
6. [Критические проблемы](#6-критические-проблемы)
7. [Рекомендации по улучшению](#7-рекомендации-по-улучшению)
8. [Идеальная архитектура](#8-идеальная-архитектура)

---

## 1. Executive Summary

### Общая оценка

| Область | Оценка | Статус |
|---------|--------|--------|
| Backend архитектура | 6/10 | Требует доработки |
| Frontend UX/UI | 6/10 | Требует доработки |
| RPG-механики | 5/10 | Критические проблемы |
| Безопасность | 6/10 | Требует доработки |
| Производительность | 7/10 | Хорошо |

### Ключевые находки

**Сильные стороны:**
- Чёткая модульная структура NestJS
- Хорошо продуманная система Single Source of Truth (после улучшений)
- Качественная валидация DTO с class-validator
- Продуманный дизайн-система "Architectural Dark"

**Критические проблемы:**
- RPG-прогрессия нереалистично медленная (5-7 лет до мастера)
- Несоответствие типов quest/difficulty в XP-механике
- Незавершённые endpoints (entries update/delete)
- API Key Guard с логикой default-allow

---

## 2. Архитектура Backend

### 2.1 Модульная структура

```
apps/api/src/
├── auth/           # JWT аутентификация
├── entries/        # Записи пользователя (ситуации, рефлексии)
├── sessions/       # AI-анализ записей
├── quests/         # Квесты и задания
├── tree/           # Дерево способностей
├── ability/        # Движок прогрессии
├── cases/          # Интерактивные кейсы
├── evidence/       # Доказательства применения
├── admin/          # Админ-панель (12 подмодулей)
├── jobs/           # Фоновые задачи
├── achievements/   # Достижения
└── common/         # Общие компоненты (guards, filters, dto)
```

### 2.2 Найденные проблемы

#### Критические

| Проблема | Файл | Строки | Влияние |
|----------|------|--------|---------|
| API Key Guard default-allow | api-key.guard.ts | 16 | Если API_KEY не настроен, доступ открыт всем |
| Незавершённые endpoints | entries.controller.ts | 98, 113 | update/delete бросают Error |
| Нарушение SRP | quests.service.ts | 45-629 | Сервис делает слишком много |

#### Средние

| Проблема | Файл | Влияние |
|----------|------|---------|
| Циклические зависимости | auth.service.ts, jwt.strategy.ts | Использование forwardRef |
| Чрезмерное использование `any` | quests.service.ts (8+ мест) | Потеря типобезопасности |
| Подавление ошибок | quests.service.ts:326 | XP может теряться без логирования |
| N+1 запросы в AdminAuthGuard | admin-auth.guard.ts | 2 запроса к БД на каждый запрос |

### 2.3 Безопасность

**Хорошо:**
- JWT с проверкой expiration
- CORS whitelist
- Rate limiting (100 req/min)
- Bcrypt для паролей

**Плохо:**
- Нет проверки сложности паролей
- Глобальный rate limit (не per-user)
- Timing attack vector в API key сравнении
- Privilege escalation: user с role='admin' получает super_admin права

---

## 3. Архитектура Frontend

### 3.1 Структура компонентов

```
apps/web/src/
├── app/                    # 22+ страниц (App Router)
├── components/             # 67 TSX компонентов
│   ├── admin/             # Админ-компоненты
│   ├── cards/             # Card компоненты
│   ├── modals/            # Модальные окна
│   ├── gamification/      # Геймификация
│   └── icons/             # Иконки
├── hooks/                  # Кастомные хуки
└── lib/                    # API клиент, утилиты
```

### 3.2 React Query

**Хорошо:**
- 44+ использований useQuery
- Правильные retry/refetch стратегии
- Отдельные хуки для данных

**Плохо:**
- Нет useMutation обёрток
- Дублирование запросов на разных страницах
- Не используется staleTime/gcTime для кэширования

### 3.3 UX-паттерны

| Паттерн | Статус | Комментарий |
|---------|--------|-------------|
| Loading states | ✅ | Spinner есть, но нет skeleton |
| Error states | ⚠️ | Непоследовательно, часто console.error |
| Empty states | ⚠️ | Есть не везде |
| Retry механизм | ❌ | Только reload страницы |
| Toast уведомления | ✅ | Реализовано правильно |

### 3.4 Accessibility (a11y)

**Хорошо:**
- ARIA-labels на навигации
- Semantic HTML
- Мобильное меню с aria-expanded

**Плохо:**
- Form labels отсутствуют (login)
- Нет keyboard navigation на картах
- Нет focus trap в модальных окнах
- Проблемы с контрастностью

---

## 4. RPG-система и прогрессия

### 4.1 Структура дерева способностей

```
37 узлов в 6 ветках:
├── Субъектность (7 узлов)
├── Архитектурное мышление (7 узлов)
├── Устойчивость (6 узлов)
├── Ответственность (8 узлов)
├── Обратная связь (6 узлов)
└── Среда зрелости (7 узлов)
```

### 4.2 XP-механика (ОБНОВЛЕНО: новая система Base + Reflection XP)

**Источники XP:**
| Тип | Base XP | Reflection XP | Максимум |
|-----|---------|---------------|----------|
| Micro quest | 20 | 80 | 100 |
| Weekly quest | 40 | 160 | 200 |
| Story quest | 60 | 240 | 300 |
| In-person quest | 100 | 400 | 500 |

**Ключевое изменение:** Рефлексия — основной источник XP (80% от максимума). Без рефлексии → только Base XP.

**Множители (упрощенные):**

1. **Node Level Multiplier:**
   - Basic: 1.0x
   - Mid: 0.8x
   - Advanced: 0.6x
   - Master: 0.4x

2. **State Multiplier:**
   - Locked: 0.0x (XP копится, но не применяется)
   - Available: 0.7x
   - Active: 1.0x
   - Unlocked: 0.8x
   - Integrated: 0.6x

**Формула расчета:**
```
Applied XP = (Base XP + Reflection XP) × Node Level Multiplier × State Multiplier
```

**Убрано:**
- ❌ Prerequisite Multiplier (больше не используется)
- ❌ Diminishing Returns (убрано для упрощения)

### 4.3 Состояния узлов

```
locked → available → active → unlocked → integrated
         (0.1+)     (30%+)    (70%+)     (100%+)
                   + relevance 30%+
```

### 4.4 КРИТИЧЕСКАЯ ПРОБЛЕМА: Скорость прогрессии

**Расчёт времени до интеграции (при 2 квестах/неделю):**

| Уровень | Квестов | Недель | Месяцев |
|---------|---------|--------|---------|
| Basic (100 XP) | 20-25 | 10-12 | 2.5-3 |
| Mid (200 XP) | 40-50 | 20-25 | 5-6 |
| Advanced (500 XP) | 100-125 | 50-62 | 12-15 |
| Master (1000 XP) | 200-250 | 100-125 | 24-30 |

**Полное прохождение:**
- 37 узлов × ~25 квестов = **925 квестов**
- При 2 квестах/неделю = **~9 лет**

Это **нереалистично** и демотивирует пользователей.

### 4.5 Найденные несоответствия

1. **Quest type vs Difficulty:**
   - quests.service использует 'micro'/'weekly'/'story'
   - ability-engine ожидает 'basic'/'intermediate'/'advanced'
   - **Маппинг отсутствует**

2. **xp_required = 0 для basic узлов:**
   - progress = xp_current / 0 = NaN
   - Показывает 0% прогресса несмотря на available

3. **Relevance deadlock:**
   - Для перехода в 'active' нужно 30% relevance
   - Relevance не увеличивается от квестов
   - Можно застрять на 70% прогресса без перехода

---

## 5. Путь пользователя

### 5.1 Контекст использования

Пользователь:
- Параллельно слушает лекции (теория)
- Имеет 1-on-1 сессии (практика)
- Использует приложение для закрепления

### 5.2 Journey Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        РЕГИСТРАЦИЯ                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. Telegram OAuth / Email регистрация                           │
│ 2. Инициализация профиля (базовые квесты + unlocked nodes)     │
│                                                                 │
│ ПРОБЛЕМЫ:                                                       │
│ • Нет onboarding-тура                                          │
│ • Нет объяснения RPG-механики                                  │
│ • Дерево показывает 0% прогресса (xp_required=0)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ПЕРВЫЕ ШАГИ (Week 1-2)                       │
├─────────────────────────────────────────────────────────────────┤
│ ДЕЙСТВИЯ:                                                       │
│ • Просмотр дерева способностей                                 │
│ • Выбор первого квеста (micro)                                 │
│ • Запись первой ситуации                                       │
│                                                                 │
│ ПРОБЛЕМЫ:                                                       │
│ • Не понятно с чего начать                                     │
│ • Квесты без приоритизации                                     │
│ • Нет связи с лекциями ("применить сегодняшний материал")     │
│ • Первый квест даёт 5% прогресса (демотивация)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   АКТИВНОЕ ОБУЧЕНИЕ (Week 3-12)                 │
├─────────────────────────────────────────────────────────────────┤
│ ДЕЙСТВИЯ:                                                       │
│ • Регулярная запись ситуаций (после лекций)                   │
│ • Прохождение интерактивных кейсов                             │
│ • 1-on-1: разбор ситуаций с наставником                       │
│ • Выполнение квестов                                           │
│                                                                 │
│ ПРОБЛЕМЫ:                                                       │
│ • "Relevance trap": 70% прогресса, но всё ещё "available"     │
│ • Нет интеграции с календарём лекций                          │
│ • Нет подготовки к 1-on-1 (список тем для обсуждения)         │
│ • Кейсы не связаны с текущими квестами                        │
│ • Достижения не показываются (нет уведомлений)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                ПЕРВЫЙ UNLOCKED УЗЕЛ (Month 3-4)                 │
├─────────────────────────────────────────────────────────────────┤
│ ДОСТИЖЕНИЕ:                                                     │
│ • Первый узел достигает 70% → unlocked                        │
│ • Открывается следующий узел в цепочке                        │
│                                                                 │
│ ПРОБЛЕМЫ:                                                       │
│ • 3-4 месяца до первого ощутимого результата                  │
│ • Prerequisite chain блокирует параллельное развитие          │
│ • Нет celebration момента                                      │
│ • Нет бейджа/сертификата                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│             РАЗВИТИЕ ВЕТКИ (Month 5-18)                         │
├─────────────────────────────────────────────────────────────────┤
│ ДЕЙСТВИЯ:                                                       │
│ • Последовательный unlock узлов в ветке                       │
│ • Story quests для продвинутых узлов                          │
│ • In-person квесты (применение на работе)                     │
│                                                                 │
│ ПРОБЛЕМЫ:                                                       │
│ • Линейность прогрессии (нельзя перепрыгнуть)                │
│ • Diminishing returns делают прогресс всё медленнее          │
│ • Нет визуализации долгосрочного прогресса                   │
│ • Отсутствие milestone celebrations                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              МАСТЕРСТВО (Year 2-5+)                             │
├─────────────────────────────────────────────────────────────────┤
│ ЦЕЛЬ:                                                           │
│ • Integrated состояние для master-узлов                        │
│ • Звание "Архитектурный лидер"                                │
│                                                                 │
│ ПРОБЛЕМЫ:                                                       │
│ • Master узлы требуют 1000 XP × 0.4 multiplier = 2500 raw XP │
│ • С diminishing returns практически недостижимо               │
│ • Platinum achievement (1000% progress) математически невозможен│
│ • Нет финального celebration/сертификации                     │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Болевые точки по этапам

| Этап | Боль | Решение |
|------|------|---------|
| Регистрация | Нет onboarding | Интерактивный тур + первый квест |
| Первые шаги | Не понятно с чего начать | Рекомендованный путь + связь с лекциями |
| Активное обучение | Relevance trap | Автоматическое обновление relevance от квестов |
| Первый unlock | 3-4 месяца ожидания | Увеличить XP в 3x, снизить пороги |
| Развитие ветки | Линейность | Разрешить параллельное развитие от 'active' |
| Мастерство | Недостижимо | Убрать/смягчить diminishing returns |

---

## 6. Критические проблемы

### 6.1 Приоритет: КРИТИЧЕСКИЙ

| # | Проблема | Влияние | Решение |
|---|----------|---------|---------|
| 1 | Quest type не маппится на difficulty | XP считается неправильно | Добавить маппинг micro→basic |
| 2 | xp_required = 0 для basic | NaN в расчётах | Установить xp_required = 100 |
| 3 | Прогрессия нереалистична | 5-7 лет до мастера | Увеличить XP в 3x |
| 4 | API Key Guard default-allow | Безопасность | Fail-closed логика |
| 5 | Незавершённые endpoints | Runtime ошибки | Реализовать или 501 |

### 6.2 Приоритет: ВЫСОКИЙ

| # | Проблема | Влияние | Решение |
|---|----------|---------|---------|
| 6 | Relevance deadlock | Застревание на 70% | Увеличивать от квестов |
| 7 | Prerequisite требует unlocked | Медленная цепочка | Снизить до active |
| 8 | Нет achievement notifications | Нет celebration | Event system |
| 9 | Admin privilege escalation | Безопасность | Отдельная проверка ролей |
| 10 | N+1 в AdminAuthGuard | Performance | Кэширование |

### 6.3 Приоритет: СРЕДНИЙ

| # | Проблема | Решение |
|---|----------|---------|
| 11 | Нет skeleton loaders | Добавить для UX |
| 12 | Нет retry в UI | Кнопки повторной загрузки |
| 13 | Нет focus trap в модальных | A11y улучшение |
| 14 | Чрезмерное использование any | Типизация |
| 15 | Нет onboarding | Интерактивный тур |

---

## 7. Рекомендации по улучшению

### 7.1 RPG-механика (Приоритет 1)

```typescript
// 1. Маппинг quest type → difficulty
const QUEST_DIFFICULTY_MAP = {
  'micro': 'basic',
  'weekly': 'intermediate',
  'story': 'advanced',
  'in-person': 'advanced',
};

// 2. Увеличение XP наград (×3)
const QUEST_REWARDS = {
  micro: { xp: 300, skill_xp: 150 },    // было 100/50
  weekly: { xp: 600, skill_xp: 300 },   // было 200/100
  story: { xp: 900, skill_xp: 450 },    // было 300/150
  'in-person': { xp: 1500, skill_xp: 750 }, // было 500/250
};

// 3. Снижение порогов prereq
// Было: unlocked (70%) → Стало: active (30%)

// 4. Смягчение diminishing returns
const DIMINISHING_RETURNS = {
  threshold_start: 0.95,  // было 0.8
  multiplier_100_120: 0.75,  // было 0.5
  multiplier_120_200: 0.5,   // было 0.25
  multiplier_200_plus: 0.25, // было 0.1
};
```

### 7.2 Backend (Приоритет 2)

```typescript
// 1. Исправить API Key Guard
if (!apiKey) {
  throw new UnauthorizedException('API key not configured');
}

// 2. Реализовать entries endpoints
@Patch(':id')
async update(@Param('id') id: string, @Body() dto: UpdateEntryDto) {
  return this.entriesService.update(id, dto, user.sub);
}

// 3. Добавить кэширование admin users
@Injectable()
export class AdminAuthGuard {
  private cache = new Map<string, { data: any; expires: number }>();

  private async getAdminUser(id: string) {
    const cached = this.cache.get(id);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    // ...fetch and cache
  }
}

// 4. Увеличивать relevance от квестов
async complete(questId: string) {
  // ...existing logic
  for (const nodeId of quest.linked_nodes) {
    await this.updateRelevance(userId, nodeId, 0.1); // +10% relevance
  }
}
```

### 7.3 Frontend (Приоритет 3)

```tsx
// 1. Skeleton loaders
function CaseCardSkeleton() {
  return (
    <div className="bg-bg-panel rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-ui-border-soft rounded w-3/4 mb-2" />
      <div className="h-3 bg-ui-border-soft rounded w-full mb-2" />
    </div>
  );
}

// 2. Error states с retry
function ErrorState({ error, onRetry }) {
  return (
    <div className="text-center p-8">
      <p className="text-system-critical mb-4">{error.message}</p>
      <button onClick={onRetry} className="btn-primary">
        Попробовать снова
      </button>
    </div>
  );
}

// 3. useMutation обёртки
function useCompleteQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeQuest,
    onSuccess: () => {
      queryClient.invalidateQueries(['quests']);
      queryClient.invalidateQueries(['tree']);
    },
  });
}
```

### 7.4 User Experience (Приоритет 4)

1. **Onboarding тур:**
   - Показать дерево способностей
   - Объяснить XP-механику
   - Выполнить первый микро-квест
   - Связать с лекционным материалом

2. **Интеграция с лекциями:**
   - Теги квестов по темам лекций
   - "Применить сегодняшний материал" секция
   - Подготовка к 1-on-1 (список тем)

3. **Celebration moments:**
   - Toast при unlock узла
   - Анимация при achievement
   - Milestone badges (10%, 50%, 100%)

4. **Progress visualization:**
   - Weekly progress summary
   - Predicted time to next unlock
   - Comparison with cohort (anonymized)

---

## 8. Идеальная архитектура

### 8.1 Backend (Целевое состояние)

```
apps/api/src/
├── core/                    # Инфраструктура
│   ├── config/             # Конфигурация, валидация env
│   ├── database/           # Prisma, migrations
│   ├── auth/               # JWT, guards, strategies
│   ├── cache/              # Redis, in-memory cache
│   └── events/             # Event bus для notifications
│
├── domain/                  # Бизнес-логика (DDD)
│   ├── user/               # User aggregate
│   │   ├── entities/
│   │   ├── services/
│   │   └── repositories/
│   ├── ability/            # Ability aggregate
│   │   ├── entities/       # Node, Branch, State
│   │   ├── services/       # AbilityEngine
│   │   └── events/         # NodeUnlocked, XPGained
│   ├── quest/              # Quest aggregate
│   │   ├── entities/
│   │   ├── services/
│   │   └── events/
│   ├── achievement/        # Achievement aggregate
│   └── learning/           # Entries, Sessions, Cases
│
├── application/             # Use cases
│   ├── commands/           # CompleteQuest, RecordSituation
│   ├── queries/            # GetTree, GetQuests
│   └── event-handlers/     # OnQuestCompleted, OnNodeUnlocked
│
├── infrastructure/          # Внешние сервисы
│   ├── llm/                # OpenAI, Anthropic
│   ├── telegram/           # Bot integration
│   └── notifications/      # Push, email
│
└── api/                     # Presentation layer
    ├── rest/               # Controllers
    ├── graphql/            # (future)
    └── websocket/          # Real-time updates
```

### 8.2 Frontend (Целевое состояние)

```
apps/web/src/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Auth group
│   ├── (dashboard)/        # Main app group
│   └── (onboarding)/       # Onboarding flow
│
├── entities/                # Business entities
│   ├── user/
│   ├── quest/
│   ├── ability/
│   └── achievement/
│
├── features/                # Feature slices
│   ├── tree-view/          # Ability tree visualization
│   ├── quest-list/         # Quest management
│   ├── situation-entry/    # Recording situations
│   └── case-solver/        # Interactive cases
│
├── shared/                  # Shared infrastructure
│   ├── api/                # API client, React Query
│   ├── ui/                 # Design system components
│   ├── lib/                # Utilities
│   └── hooks/              # Common hooks
│
└── widgets/                 # Composed UI blocks
    ├── navigation/
    ├── progress-bar/
    └── achievement-toast/
```

### 8.3 Data Flow (Целевое состояние)

```
┌─────────────────────────────────────────────────────────────────┐
│                        SOURCES OF TRUTH                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Structure          Content              User Data               │
│  ───────────       ─────────            ──────────              │
│  seed JSON    →    node-descriptions    UserAbilityState        │
│  (tree shape)      (names, desc)        (xp, state, progress)   │
│                                                                  │
│                         ↓ Runtime merge ↓                        │
│                                                                  │
│                    ┌─────────────────┐                          │
│                    │  TreeService    │                          │
│                    │  getSemantic()  │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│                    Merged Tree + User State                     │
│                             ↓                                   │
│                    ┌─────────────────┐                          │
│                    │    Frontend     │                          │
│                    │   React Query   │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 Event-Driven Architecture (Целевое состояние)

```
Quest Completed
      ↓
┌─────────────────────────────────────────┐
│           Event Bus                      │
├─────────────────────────────────────────┤
│                                         │
│  → AbilityEngine.applyExperience()     │
│  → AchievementService.check()          │
│  → NotificationService.send()          │
│  → AnalyticsService.track()            │
│                                         │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│           Side Effects                   │
├─────────────────────────────────────────┤
│                                         │
│  • Node state updated                  │
│  • Achievement unlocked (maybe)        │
│  • Push notification sent              │
│  • Weekly stats updated                │
│                                         │
└─────────────────────────────────────────┘
```

---

## Заключение

Проект Leadership Architect имеет **солидную архитектурную основу**, но требует существенных улучшений в:

1. **RPG-балансировке** — текущие параметры делают прогрессию нереалистичной
2. **UX-паттернах** — отсутствие skeleton, error states, onboarding
3. **Безопасности** — несколько уязвимостей требуют исправления
4. **Интеграции с обучением** — связь с лекциями и 1-on-1 сессиями

**Рекомендуемый порядок действий:**

1. **Неделя 1-2:** Критические исправления (API Key, quest mapping, XP balance)
2. **Неделя 3-4:** UX улучшения (skeleton, error states, retry)
3. **Месяц 2:** Event-driven notifications, achievement celebrations
4. **Месяц 3:** Onboarding, интеграция с лекционным материалом

При выполнении этих улучшений время до первого значимого результата сократится с **3-4 месяцев до 3-4 недель**, что критически важно для мотивации пользователей.
