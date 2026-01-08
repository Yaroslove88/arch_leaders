# ✅ Фаза 2 завершена: Аналитический пайплайн

## Что создано

### 1. LLM Module ✅
- `src/llm/llm.service.ts` - интеграция с OpenAI и Anthropic API
- `src/llm/llm.module.ts` - модуль
- Поддержка анализа управленческих ситуаций
- Fallback на mock-анализ, если API ключ не настроен

**Функции:**
- `analyzeSituation()` - анализ ситуации через LLM
- Поддержка OpenAI (GPT-4o-mini) и Anthropic (Claude 3.5 Sonnet)
- Автоматическое определение провайдера по наличию API ключа

### 2. Analysis Parser Service ✅
- `src/sync/analysis-parser.service.ts` - парсинг результатов анализа
- Интеграция с LLM Service
- Создание/обновление Session на основе анализа

**Функции:**
- `analyzeEntry()` - анализ Entry и создание Session
- Извлечение: themes, patterns, tensions, ability_signals
- Обработка ошибок с сохранением в БД

### 3. Sync Service ✅
- `src/sync/sync.service.ts` - синхронизация файлов и запуск анализа
- `src/sync/sync.controller.ts` - REST API endpoints
- `src/sync/sync.module.ts` - модуль

**Функции:**
- `syncEntries()` - синхронизация .md файлов из папки "Лидерство/Ситуации"
- `analyzeEntry()` - запуск анализа для конкретного Entry
- `syncAndAnalyze()` - полная синхронизация и анализ новых entries

## API Endpoints

### Sync
```
POST /sync/entries        - синхронизировать файлы ситуаций
POST /sync/analyze/:entryId - проанализировать Entry
POST /sync/all            - синхронизировать и проанализировать все
GET  /sync/status         - получить статус (путь к папке ситуаций)
```

## Рабочий процесс

1. **Синхронизация файлов:**
   - Читает .md файлы из папки "Лидерство/Ситуации"
   - Создает или обновляет Entry в БД
   - Использует `file_ref` для отслеживания файлов

2. **Анализ через LLM:**
   - Отправляет текст Entry в LLM
   - Извлекает структурированные данные:
     - themes (темы)
     - patterns (паттерны поведения)
     - tensions (напряжения)
     - ability_signals (сигналы способностей)
     - insights (инсайты)
     - focus (фокусы внимания)

3. **Создание Session:**
   - Сохраняет результаты анализа в Session
   - Связывает Session с Entry
   - Статусы: pending → analyzing → done/error

## Конфигурация

### Переменные окружения (.env):
```env
# OpenAI (опционально)
OPENAI_API_KEY=sk-...

# Anthropic (опционально)
ANTHROPIC_API_KEY=sk-ant-...

# Если ключи не указаны, используется mock-анализ
```

### Путь к папке ситуаций:
- По умолчанию: `D:\gpt\Professional\Лидерство\Ситуации`
- Можно задать через `SITUATIONS_ROOT_PATH` в .env
- Или через PathConfigService

## Примеры использования

### 1. Синхронизация файлов
```bash
curl -X POST http://localhost:3001/sync/entries
```

### 2. Анализ конкретного Entry
```bash
curl -X POST http://localhost:3001/sync/analyze/{entryId}
```

### 3. Полная синхронизация и анализ
```bash
curl -X POST http://localhost:3001/sync/all
```

### 4. Проверка статуса
```bash
curl http://localhost:3001/sync/status
```

## Структура проекта

```
apps/api/src/
├── llm/
│   ├── llm.service.ts      ✅
│   └── llm.module.ts       ✅
└── sync/
    ├── analysis-parser.service.ts ✅
    ├── sync.service.ts     ✅
    ├── sync.controller.ts  ✅
    └── sync.module.ts      ✅
```

## Проверка

✅ **TypeScript:** `pnpm typecheck` - проходит без ошибок
✅ **Модули:** все подключены в AppModule
✅ **LLM:** поддержка OpenAI и Anthropic
✅ **Fallback:** mock-анализ при отсутствии API ключей

## Следующие шаги

**Фаза 3:** Дерево способностей
- Seed данные (6 веток LEADER)
- Tree Service
- ChangeLog система
- Tree Visualization

**Фаза 4:** Квесты
- Quests Module
- Quest Generation из анализа
- Evidence System

---

**Фаза 2 завершена!** ✅

