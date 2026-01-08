# План реализации проекта "Архитектор лидерства"

**Версия:** 1.0  
**Дата:** 2025-01-27  
**Основа:** Анализ Life-RPG + PRD "Архитектор лидерства"

---

## 📋 Общая стратегия

Проект реализуется поэтапно, начиная с MVP (вертикальный срез):
1. **Фаза 0:** Настройка окружения и инфраструктуры
2. **Фаза 1:** Базовые модули API (P0 - MVP Core)
3. **Фаза 2:** Аналитический пайплайн (LLM)
4. **Фаза 3:** Дерево способностей и визуализация
5. **Фаза 4:** Квесты и Evidence
6. **Фаза 5:** Telegram интеграция
7. **Фаза 6:** Frontend (Web UI)
8. **Фаза 7:** Полировка и оптимизация

---

## 🎯 ФАЗА 0: Настройка окружения (1-2 дня)

### Задачи

#### 0.1. Установка PostgreSQL и pgAdmin4

**Цель:** Локальная база данных для разработки

**Шаги:**
1. Скачать и установить PostgreSQL 15+ с pgAdmin4
   - https://www.postgresql.org/download/windows/
   - При установке запомнить пароль для пользователя `postgres`

2. Создать пользователя и базу данных через pgAdmin4:
   ```sql
   -- В pgAdmin4: Tools → Query Tool
   CREATE USER leadership_architect WITH PASSWORD 'neofitus2023';
   CREATE DATABASE leadership_architect OWNER leadership_architect;
   GRANT ALL PRIVILEGES ON DATABASE leadership_architect TO leadership_architect;
   ```

3. Или через командную строку:
   ```powershell
   # Найти путь к psql (обычно в Program Files\PostgreSQL\XX\bin)
   & "D:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
   
   # В psql выполнить:
   CREATE USER leadership_architect WITH PASSWORD 'neofitus2023';
   CREATE DATABASE leadership_architect OWNER leadership_architect;
   GRANT ALL PRIVILEGES ON DATABASE leadership_architect TO leadership_architect;
   \q
   ```

**Проверка:**
```powershell
& "D:\Program Files\PostgreSQL\18\bin\psql.exe" -U leadership_architect -d leadership_architect
# Пароль: neofitus2023
# Если подключились - всё работает!
```

**✅ Если база уже создана:** Проверьте подключение командой выше.

#### 0.2. Настройка Prisma

**Шаги:**
1. Создать `.env` в `apps/api/`:
   ```env
   DATABASE_URL="postgresql://leadership_architect:neofitus2023@localhost:5432/leadership_architect?schema=public"
   PORT=3001
   NODE_ENV=development
   ```

2. Сгенерировать Prisma Client:
   ```bash
   cd apps/api
   pnpm prisma generate
   # или
   pnpm prisma:generate
   ```

3. Применить миграции:
   ```bash
   pnpm prisma migrate dev --name init
   ```

4. Проверить через Prisma Studio:
   ```bash
   pnpm prisma studio
   # или
   pnpm prisma:studio
   # Откроется на http://localhost:5555
   ```

**Результат:** База данных готова, таблицы созданы

#### 0.3. Установка зависимостей

```bash
# Из корня проекта
pnpm install
```

**Проверка:** Все пакеты установлены без ошибок

---

## 🏗️ ФАЗА 1: Базовые модули API (P0 - MVP Core) (3-5 дней)

### 1.1. Prisma Module

**Файл:** `apps/api/src/prisma/prisma.module.ts`, `prisma.service.ts`

**Задачи:**
- ✅ Создать PrismaService (уже есть базовая структура)
- ✅ Настроить подключение к БД
- ✅ Добавить логирование подключения/отключения

**Референс:** `life-rpg/apps/api/src/prisma/prisma.service.ts`

**Критерии готовности:**
- API запускается без ошибок
- В логах видно "✅ Prisma connected to database"

---

### 1.2. Config Module

**Файл:** `apps/api/src/config/`

**Задачи:**
- Создать `config.module.ts` с глобальным ConfigModule
- Создать `env.validation.ts` для валидации переменных окружения
- Создать `path-config.service.ts` для управления путями к данным
  - Адаптировать под пути для лидерства (не "Психотерапия - Сессии", а "Лидерство/Ситуации")

**Референс:** `life-rpg/apps/api/src/config/`

**Критерии готовности:**
- Переменные окружения валидируются при старте
- PathConfigService находит папку с данными (если существует)

---

### 1.3. Entries Module

**Файл:** `apps/api/src/entries/`

**Задачи:**
- Создать `entries.module.ts`, `entries.service.ts`, `entries.controller.ts`
- Реализовать CRUD операции:
  - `getAll()` - список записей с фильтрацией
  - `getById()` - получение по ID
  - `create()` - создание новой записи
  - `update()` - обновление
  - `delete()` - удаление

**Адаптация под лидерство:**
- Типы entry: `situation`, `reflection`, `feedback`, `voice`, `import`
- Добавить поле `participants` (массив участников)
- Добавить поле `context_json` (контекст: встреча, решение, результат)

**Референс:** `life-rpg/apps/api/src/entries/entries.service.ts`

**API Endpoints:**
```
GET    /entries          - список
GET    /entries/:id      - по ID
POST   /entries          - создать
PATCH  /entries/:id      - обновить
DELETE /entries/:id      - удалить
```

**Критерии готовности:**
- Все endpoints работают
- Можно создать entry через API
- Данные сохраняются в БД

---

### 1.4. Sessions Module

**Файл:** `apps/api/src/sessions/`

**Задачи:**
- Создать `sessions.module.ts`, `sessions.service.ts`, `sessions.controller.ts`
- Реализовать:
  - `getAll()` - список сессий
  - `getById()` - получение по ID
  - `getByEntryId()` - получение по entry_id
  - `create()` - создание сессии (пока без анализа)
  - `update()` - обновление статуса

**Адаптация под лидерство:**
- Добавить поля: `patterns`, `tensions`, `ability_signals_json`
- Убрать `parts` (специфично для терапии)

**Референс:** `life-rpg/apps/api/src/sessions/`

**API Endpoints:**
```
GET    /sessions         - список
GET    /sessions/:id     - по ID
GET    /sessions/entry/:entryId - по entry_id
POST   /sessions        - создать
PATCH  /sessions/:id     - обновить
```

**Критерии готовности:**
- Можно создать session для entry
- Связь Entry → Session работает

---

### 1.5. Evidence Module

**Файл:** `apps/api/src/evidence/` (новый модуль)

**Задачи:**
- Создать модуль для работы с Evidence
- Реализовать CRUD операции
- Связь с Quest и AbilityNode

**API Endpoints:**
```
GET    /evidence         - список
GET    /evidence/:id     - по ID
POST   /evidence         - создать
PATCH  /evidence/:id     - обновить
DELETE /evidence/:id    - удалить
```

**Критерии готовности:**
- Можно создавать evidence
- Связи с quest и ability_node работают

---

## 🤖 ФАЗА 2: Аналитический пайплайн (5-7 дней)

### 2.1. Analysis Parser Service

**Файл:** `apps/api/src/sync/analysis-parser.service.ts`

**Задачи:**
- Создать сервис для парсинга анализа через LLM
- Адаптировать под лидерство:
  - Извлечение тем (управленческие ситуации)
  - Паттерны поведения лидера
  - Напряжения (конфликты, противоречия)
  - Сигналы способностей (ability signals)

**Промпты для LLM:**
- Создать промпты для анализа управленческих ситуаций
- Извлечение архитектурных способностей
- Генерация инсайтов

**Референс:** `life-rpg/apps/api/src/sync/analysis-parser.service.ts`

**Структура промпта:**
```
Проанализируй управленческую ситуацию:
- Текст: {entry.text}
- Участники: {entry.participants}
- Контекст: {entry.context_json}

Извлеки:
1. Темы (повторяющиеся мотивы)
2. Паттерны поведения
3. Напряжения
4. Проявленные способности (ability signals)
5. Инсайты
```

**Критерии готовности:**
- Парсер извлекает темы, паттерны, напряжения
- Генерирует ability signals
- Создает структурированный JSON для Session

---

### 2.2. Sync Service

**Файл:** `apps/api/src/sync/sync.service.ts`

**Задачи:**
- Адаптировать SyncService под лидерство
- Изменить пути к данным (не "Психотерапия - Сессии", а "Лидерство/Ситуации")
- Реализовать синхронизацию:
  - Чтение файлов из папки ситуаций
  - Создание Entry
  - Запуск анализа
  - Создание Session

**Адаптация:**
- Путь к данным: `D:\gpt\Professional\Лидерство\Ситуации` (или через PathConfigService)
- Типы файлов: `.md` файлы с описанием ситуаций

**Референс:** `life-rpg/apps/api/src/sync/sync.service.ts`

**API Endpoints:**
```
POST   /sync/entries     - синхронизировать entries из файлов
POST   /sync/analyze/:entryId - запустить анализ для entry
```

**Критерии готовности:**
- Можно синхронизировать файлы из папки
- Анализ запускается и создает Session

---

### 2.3. LLM Integration

**Задачи:**
- Настроить интеграцию с LLM API (OpenAI / Anthropic)
- Создать сервис для работы с LLM
- Реализовать retry логику и обработку ошибок

**Переменные окружения:**
```env
OPENAI_API_KEY=sk-...
# или
ANTHROPIC_API_KEY=sk-ant-...
```

**Критерии готовности:**
- LLM отвечает на запросы
- Анализ работает end-to-end

---

## 🌳 ФАЗА 3: Дерево способностей (5-7 дней)

### 3.1. Seed данные

**Файл:** `packages/shared/src/seed/initial-ability-tree.json`

**Задачи:**
- Создать JSON с деревом архитектурных способностей
- 6 веток:
  1. Субъектность (Subjectivity)
  2. Архитектурное мышление (Architectural Thinking)
  3. Устойчивость (Resilience)
  4. Ответственность (Responsibility)
  5. Обратная связь (Feedback)
  6. Среда зрелости (Maturity Environment)

**Структура узла:**
```json
{
  "id": "node_001",
  "name": "Точка опоры",
  "description": "Внутренняя устойчивость",
  "branch": "subjectivity",
  "tier": "basic",
  "state": "locked",
  "unlock_conditions": {
    "type": "quests",
    "quests_count": 3,
    "quest_type": "reflection"
  }
}
```

**Референс:** `life-rpg/packages/shared/src/seed/initial-semantic-tree.json`

**Критерии готовности:**
- JSON валиден
- Все 6 веток определены
- Условия открытия узлов прописаны

---

### 3.2. Tree Service

**Файл:** `apps/api/src/tree/tree.service.ts`

**Задачи:**
- Адаптировать TreeService под дерево способностей
- Реализовать:
  - `getSemantic()` - получение семантического дерева
  - `getLayout()` - получение layout дерева
  - `applyChange()` - применение изменений
  - `undoChange()` - откат изменений
  - `updateNodeProgress()` - обновление прогресса узла

**Адаптация:**
- Изменить терминологию: "perk" → "ability"
- Состояния узлов: `locked`, `available`, `active`, `unlocked`, `integrated`
- Интеграционные уровни: `Novice`, `Integrated`, `Embodied`

**Референс:** `life-rpg/apps/api/src/tree/tree.service.ts`

**API Endpoints:**
```
GET    /tree/semantic    - семантическое дерево
GET    /tree/layout      - layout дерева
POST   /tree/change      - применить изменение
POST   /tree/undo        - откат изменения
PATCH  /tree/node/:id    - обновить узел
```

**Критерии готовности:**
- Можно получить дерево через API
- Изменения применяются и фиксируются в ChangeLog
- Undo работает

---

### 3.3. ChangeLog система

**Задачи:**
- Убедиться, что ChangeLog работает
- Каждое изменение фиксируется с rationale
- Поддержка Undo

**Критерии готовности:**
- Все изменения логируются
- Можно откатить последнее изменение

---

### 3.4. Tree Visualization (Frontend)

**Файл:** `apps/web/src/components/TreeVisualization.tsx`

**Задачи:**
- Адаптировать визуализацию дерева
- Использовать React Flow
- Отобразить узлы способностей
- Цветовая схема по состояниям

**Адаптация:**
- `CyberpunkPerkNode` → `AbilityNode`
- Стиль под тему лидерства (не киберпанк)

**Референс:** `life-rpg/apps/web/src/components/TreeVisualization.tsx`

**Критерии готовности:**
- Дерево отображается на странице
- Zoom/Pan работает
- Клик на узел показывает карточку

---

## 🎯 ФАЗА 4: Квесты и Evidence (3-5 дней)

### 4.1. Quests Module

**Файл:** `apps/api/src/quests/quests.service.ts`

**Задачи:**
- Адаптировать QuestsService под лидерство
- Типы квестов: `micro`, `weekly`, `story`, `in-person`
- Связь с узлами дерева способностей

**Адаптация:**
- Критерии выполнения под лидерские практики
- Привязка к ability nodes (не perks)

**Референс:** `life-rpg/apps/api/src/quests/quests.service.ts`

**API Endpoints:**
```
GET    /quests           - список
GET    /quests/:id       - по ID
POST   /quests           - создать
PATCH  /quests/:id       - обновить
POST   /quests/:id/complete - завершить
```

**Критерии готовности:**
- Можно создавать квесты
- Связь с узлами работает
- Завершение через evidence

---

### 4.2. Quest Generation

**Задачи:**
- Реализовать генерацию квестов на основе:
  - Активных тем
  - Разблокированных узлов
  - Зон развития

**Логика:**
- После анализа Session генерируются квесты
- Лимит активных: 5
- Остальные в backlog

**Критерии готовности:**
- Квесты генерируются автоматически
- Лимит активных соблюдается

---

### 4.3. Evidence System

**Задачи:**
- Интеграция Evidence с Quest и AbilityNode
- Валидация evidence для завершения квеста
- Использование evidence для интеграции способностей

**Критерии готовности:**
- Можно привязать evidence к квесту
- Evidence влияет на прогресс узла

---

## 📱 ФАЗА 5: Telegram интеграция (2-3 дня)

### 5.1. Telegram Service

**Файл:** `apps/api/src/telegram/telegram.service.ts`

**Задачи:**
- Адаптировать TelegramService под лидерство
- Типы постов:
  - `SESSION_SUMMARY` - итоги ситуации
  - `NEXT_WEEK_FOCUS` - фокус на неделю
  - `INSIGHTS` - инсайты
  - `QUESTS_DROP` - новые квесты
  - `DAILY_MORNING` - утренний квест
  - `DAILY_EVENING` - вечерний дневник

**Адаптация:**
- Контент под лидерство (не терапию)
- Тон профессиональный, с элементами иронии

**Референс:** `life-rpg/apps/api/src/telegram/telegram.service.ts`

**API Endpoints:**
```
GET    /telegram/settings - настройки
POST   /telegram/settings - обновить настройки
POST   /telegram/webhook   - webhook для бота
```

**Критерии готовности:**
- Бот отвечает на команды
- Посты отправляются по расписанию

---

### 5.2. Telegram Bot

**Задачи:**
- Настроить бота через BotFather
- Реализовать обработку:
  - Текстовых сообщений → Entry
  - Голосовых сообщений → Entry (через транскрипцию)
  - Команд

**Критерии готовности:**
- Можно отправить ситуацию в Telegram
- Она появляется как Entry в системе

---

## 🎨 ФАЗА 6: Frontend (Web UI) (5-7 дней)

### 6.1. Dashboard

**Файл:** `apps/web/src/app/dashboard/page.tsx`

**Задачи:**
- Главная страница с:
  - 5 активными квестами
  - Фокус недели
  - Последние изменения
  - Прогресс по веткам

**Критерии готовности:**
- Dashboard отображает актуальные данные
- Навигация работает

---

### 6.2. Add Entry

**Файл:** `apps/web/src/app/entries/new/page.tsx`

**Задачи:**
- Форма для создания Entry
- Типы: ситуация, рефлексия, обратная связь
- Поля: текст, участники, контекст

**Критерии готовности:**
- Можно создать entry через форму
- Данные сохраняются

---

### 6.3. Session Result

**Файл:** `apps/web/src/app/sessions/[id]/page.tsx`

**Задачи:**
- Страница с результатами анализа
- Отображение:
  - Сводка
  - Проявленные способности
  - Инсайты
  - Сгенерированные квесты

**Критерии готовности:**
- Результаты анализа отображаются
- Ссылки на квесты работают

---

### 6.4. Skill Tree Page

**Файл:** `apps/web/src/app/tree/page.tsx`

**Задачи:**
- Страница с визуализацией дерева
- Интеграция TreeVisualization компонента
- Карточка узла при клике

**Критерии готовности:**
- Дерево отображается
- Можно взаимодействовать с узлами

---

### 6.5. Quest Board

**Файл:** `apps/web/src/app/quests/page.tsx`

**Задачи:**
- Список квестов
- Фильтры по статусу
- Карточки квестов

**Критерии готовности:**
- Квесты отображаются
- Можно менять статус

---

### 6.6. Evidence Journal

**Файл:** `apps/web/src/app/evidence/page.tsx`

**Задачи:**
- Список evidence
- Связи с квестами и узлами
- Форма создания

**Критерии готовности:**
- Можно просматривать и создавать evidence

---

## 🔧 ФАЗА 7: Полировка и оптимизация (3-5 дней)

### 7.1. Error Handling

**Задачи:**
- Добавить обработку ошибок везде
- Понятные сообщения об ошибках
- Логирование

---

### 7.2. Validation

**Задачи:**
- Валидация входных данных через Zod
- Схемы в `packages/shared/src/schemas/`

---

### 7.3. Testing

**Задачи:**
- Unit тесты для ключевых сервисов
- E2E тесты для критичных путей

---

### 7.4. Documentation

**Задачи:**
- Обновить README
- Документация API
- Комментарии в коде

---

## 📊 Метрики прогресса

### MVP Ready (критерии)

1. ✅ Пользователь может создать Entry
2. ✅ Система анализирует Entry и создает Session
3. ✅ Генерируются квесты
4. ✅ Дерево способностей отображается
5. ✅ Можно создать Evidence
6. ✅ Telegram бот работает (базово)

### v1.0 Ready (критерии)

1. ✅ Полный цикл: Entry → Analysis → Quest → Evidence → Tree Update
2. ✅ ChangeLog и Undo работают
3. ✅ Все основные экраны реализованы
4. ✅ Telegram интеграция полная

---

## 🚀 Быстрый старт (после Фазы 0)

```bash
# 1. Запустить API
cd apps/api
pnpm dev

# 2. Запустить Web (в другом терминале)
cd apps/web
pnpm dev

# 3. Открыть браузер
# http://localhost:3000
```

---

## 📝 Примечания

- **Приоритизация:** Следовать порядку фаз
- **Референсы:** Использовать Life-RPG как референс, но адаптировать под лидерство
- **Тестирование:** Тестировать каждый модуль после реализации
- **Документация:** Обновлять документацию по мере разработки

---

**Конец плана**

