# Миграция системы опыта

## Шаги для применения миграции

### 1. Применить миграцию Prisma

```bash
cd apps/api
npx prisma migrate deploy
# или для разработки:
npx prisma migrate dev --name add_experience_system_fields
```

### 2. Запустить скрипт миграции данных

```bash
# Из корня проекта
pnpm migrate:experience
```

Скрипт выполнит:
- Миграцию существующего `progress` в `internal_progress`
- Установку `progress = min(1.0, internal_progress)` для отображения
- Выдачу ачивок для узлов с `internal_progress >= 200%`
- Установку `last_activity_date` на текущую дату для всех узлов

### 3. Настроить периодическую задачу деградации

Добавьте задачу в cron или планировщик задач для запуска `degrade_experience` раз в день:

```typescript
// Пример: через JobsService
await jobsService.enqueue({
  jobType: 'degrade_experience',
  queue: 'default',
  scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // через 24 часа
});
```

## Что было добавлено

### База данных

1. **UserAbilityState**:
   - `internal_progress` - внутренний прогресс (неограничен)
   - `stored_experience` - сохраненный опыт для узла
   - `last_activity_date` - дата последней активности

2. **AbilityNode**:
   - `prerequisites` - массив ID узлов-предварительных условий

3. **Achievement** - таблица ачивок
4. **UserAchievement** - связь пользователей с ачивками

### API Endpoints

- `GET /ability/states` - получить состояния узлов пользователя
- `GET /achievements/user/:userId` - получить ачивки пользователя
- `GET /achievements/node/:userId/:nodeId` - получить ачивки для узла
- `GET /tree/nodes/info?nodeIds=...` - получить информацию об узлах (prerequisites)

### UI Компоненты

- `NodeExperienceIndicators` - компонент для отображения:
  - Сохраненного опыта
  - Предварительных условий
  - Ачивок
  - Деградации опыта
  - Эффективности по статусу

## Проверка после миграции

1. Проверьте, что все узлы имеют `internal_progress`:
```sql
SELECT COUNT(*) FROM user_ability_state WHERE internal_progress = 0 AND progress > 0;
-- Должно быть 0
```

2. Проверьте ачивки:
```sql
SELECT COUNT(*) FROM user_achievements WHERE user_id = 'admin_user_id';
```

3. Проверьте UI - откройте страницу дерева и убедитесь, что индикаторы отображаются
