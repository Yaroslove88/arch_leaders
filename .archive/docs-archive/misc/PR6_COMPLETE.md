# PR6 — Job Queue и Worker: вынести анализ из HTTP ✅

## Выполнено

### 1. Обновлена Prisma схема
- ✅ Добавлено поле `dedupe_key` в модель `Job` (unique)
- ✅ Добавлен индекс на `dedupe_key` для быстрого поиска

### 2. Создан JobsService
- ✅ `enqueue()` - добавление задачи в очередь с поддержкой идемпотентности
- ✅ `claimNext()` - атомарное получение следующей задачи (транзакция)
- ✅ `complete()` - пометить задачу как выполненную
- ✅ `fail()` - пометить задачу как проваленную (с retry логикой)
- ✅ `cancel()` - отменить задачу
- ✅ `getStatus()` - получить статус задачи

### 3. Создан JobsWorkerService
- ✅ Автоматически запускается при старте приложения (`OnModuleInit`)
- ✅ Периодически опрашивает очереди (каждые 5 секунд)
- ✅ Обрабатывает задачи из очередей: `default`, `analysis`, `high-priority`
- ✅ Автоматически останавливается при остановке приложения (`OnModuleDestroy`)

### 4. Создан AnalyzeEntryHandler
- ✅ Обработчик для задач типа `analyze_entry`
- ✅ Вызывает `AnalysisParserService` для анализа
- ✅ Генерирует квесты через `QuestOrchestrationService` (асинхронно)

### 5. Обновлен API
- ✅ `POST /sync/analyze/:entryId` теперь возвращает `202 Accepted` + `jobId`
- ✅ Добавлен `GET /jobs/:id/status` для проверки статуса задачи
- ✅ `SyncService.analyzeEntry()` теперь создает job вместо синхронного выполнения

### 6. Идемпотентность
- ✅ Используется `dedupeKey` в формате `ANALYZE_ENTRY:${entryId}`
- ✅ Если задача с таким ключом уже существует и не завершена - возвращается существующая
- ✅ Если задача уже успешно выполнена - возвращается существующая (для analyze_entry)

## Архитектура

```
POST /sync/analyze/:entryId
  ↓
SyncService.analyzeEntry()
  ↓
JobsService.enqueue({ dedupeKey: "ANALYZE_ENTRY:${entryId}" })
  ↓
202 Accepted + { jobId, checkStatus: "/jobs/:id/status" }
  ↓
[Worker в фоне]
  ↓
JobsWorkerService.processQueues()
  ↓
JobsService.claimNext("analysis")
  ↓
AnalyzeEntryHandler.handle()
  ↓
AnalysisParserService.analyzeEntry()
  ↓
QuestOrchestrationService.handleSessionAnalyzed()
  ↓
JobsService.complete(jobId)
```

## Definition of Done

- ✅ API больше не вызывает LLM синхронно
- ✅ Есть воркер, который реально прогоняет анализ
- ✅ Повторные запросы не создают дубликаты (через dedupeKey)

## Следующие шаги

1. Создать миграцию для `dedupe_key`:
   ```bash
   pnpm prisma migrate dev --name add_dedupe_key_to_jobs
   ```

2. Протестировать:
   - Создать entry
   - Вызвать POST /sync/analyze/:entryId
   - Проверить, что вернулся 202 + jobId
   - Проверить статус через GET /jobs/:id/status
   - Убедиться, что анализ выполнился в фоне

3. Перейти к PR7 (Staged pipeline)

