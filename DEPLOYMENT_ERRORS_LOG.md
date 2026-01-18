# Лог ошибок деплоя Leadership Architect на Timeweb Cloud

## Контекст

Проект: `leadership-architect` (monorepo: NestJS backend + Next.js frontend)
Платформа: Timeweb Cloud (App Platform + Managed PostgreSQL)
Ветка: `web` (для фронтенда), `main` (для бэкенда)

---

## Категории ошибок

### 1. Ошибки типизации TypeScript

#### 1.1. Отсутствующие свойства в интерфейсах

**Паттерн:**
```
Type error: Property 'X' does not exist on type 'Y'
```

**Примеры:**
- `Property 'color' does not exist on type 'BuildStatus'`
- `Property 'source' does not exist on type 'Quest'`
- `Property 'required_skills' does not exist in type 'entry_conditions'`

**Попытка 1 (неправильная):**
- Игнорирование через `typescript: { ignoreBuildErrors: true }` в `next.config.js`
- **Проблема:** Маскирует реальные ошибки, код не работает в runtime

**Попытка 2 (правильная):**
- Добавление недостающих свойств в интерфейсы в `apps/web/src/lib/api.ts`
- **Решение:**
  ```typescript
  // Было:
  export interface BuildStatus {
    build_id: string;
    name: string;
    // ...
  }
  
  // Стало:
  export interface BuildStatus {
    build_id: string;
    name: string;
    color: string;        // Добавлено
    fantasy: string;      // Добавлено
    // ...
  }
  ```

**Почему повторялось:**
- Не проверял все использования свойств перед добавлением
- Добавлял по одной ошибке за раз

**Финальное решение:**
- Комплексная проверка всех использований через `grep`:
  ```bash
  grep -rn "build\." --include="*.tsx" | grep "build\.[a-z]"
  grep -rn "quest\." --include="*.tsx" | grep "quest\.[a-z]"
  ```
- Добавление всех свойств за один раз

---

#### 1.2. Неявные типы `any` в callbacks

**Паттерн:**
```
Type error: Parameter 'X' implicitly has an 'any' type
```

**Примеры:**
- `Parameter 'skillId' implicitly has an 'any' type` в `.map((skillId) => ...)`
- `Parameter 'nodeId' implicitly has an 'any' type` в `.filter((nodeId) => ...)`

**Попытка 1 (неправильная):**
- Игнорирование через `eslint: { ignoreDuringBuilds: true }`
- **Проблема:** Не решает TypeScript ошибки, только ESLint warnings

**Попытка 2 (правильная):**
- Явная типизация параметров:
  ```typescript
  // Было:
  .map((skillId) => { ... })
  
  // Стало:
  .map((skillId: string) => { ... })
  ```

**Почему повторялось:**
- Исправлял только конкретную ошибку, не проверял аналогичные паттерны

**Финальное решение:**
- Комплексный поиск всех `.map((` и `.filter((` без типов:
  ```bash
  grep -rn "\.map((" --include="*.tsx" | grep -v ": string\|: any\|: number"
  ```

---

#### 1.3. `unknown` тип из `Object.values/entries`

**Паттерн:**
```
Type error: Type 'unknown' cannot be used as ReactNode
```

**Примеры:**
- `Object.values(quest.reward.nodes)[0]` возвращает `unknown`
- `Object.entries(...).map(([key, value]) => ...)` без типов

**Попытка 1 (неправильная):**
- Приведение через `as unknown as ReactNode`
- **Проблема:** Небезопасно, может упасть в runtime

**Попытка 2 (правильная):**
- Типизация интерфейса `QuestReward`:
  ```typescript
  export interface QuestReward {
    xp?: number;
    nodes?: Record<string, number>;  // Типизировано!
    skill_xp?: number;
  }
  ```
- Приведение через `String()` для рендеринга:
  ```typescript
  // Было:
  +{Object.values(quest.reward.nodes)[0]} к способности
  
  // Стало:
  +{String(Object.values(quest.reward.nodes)[0])} к способности
  ```
- Явная типизация в `Object.entries`:
  ```typescript
  // Было:
  Object.entries(quest.reward.nodes).map(([nodeId, points]) => ...
  
  // Стало:
  Object.entries(quest.reward.nodes).map(([nodeId, points]: [string, number]) => ...
  ```

**Почему повторялось:**
- Не типизировал интерфейсы полностью, только исправлял конкретное место

**Финальное решение:**
- Создание полных интерфейсов (`QuestStep`, `QuestCriteria`, `QuestReward`)
- Комплексная проверка всех `Object.values/entries/keys`

---

#### 1.4. `undefined` vs `null` в пропсах

**Паттерн:**
```
Type error: Type 'undefined' is not assignable to type 'null'
```

**Примеры:**
- `tree={tree}` где компонент ожидает `tree: SemanticTree | null`

**Решение:**
```typescript
// Было:
tree={tree}

// Стало:
tree={tree ?? null}
```

**Почему повторялось:**
- Исправлял по одному файлу, не проверял все использования компонента

**Финальное решение:**
- Поиск всех использований:
  ```bash
  grep -rn "tree=\{tree\}" --include="*.tsx"
  ```

---

### 2. Ошибки ESLint

#### 2.1. Неэкранированные кавычки в JSX

**Паттерн:**
```
Error: " can be escaped with &quot;
```

**Примеры:**
- `"{story}"` в JSX тексте
- `"затираний"` в JSX

**Решение:**
```typescript
// Было:
<p>"{story}"</p>

// Стало:
<p>&ldquo;{story}&rdquo;</p>
```

**Почему повторялось:**
- Исправлял только конкретные файлы из ошибок, не проверял все файлы

**Финальное решение:**
- Поиск всех неэкранированных кавычек:
  ```bash
  grep -rn '"[^&]' --include="*.tsx" | grep -v "console\|//"
  ```

---

#### 2.2. Неправильные ESLint disable комментарии

**Паттерн:**
```
Definition for rule '@typescript-eslint/ban-ts-comment' was not found
```

**Решение:**
- Удаление несуществующих правил из `eslint-disable-next-line`

---

### 3. Ошибки React Query (TanStack Query)

#### 3.1. Deprecated `onError` в `useQuery`

**Паттерн:**
```
Property 'onError' does not exist in type 'UseQueryOptions'
```

**Причина:**
- В TanStack Query v5 удалены `onError`, `onSuccess`, `onSettled`

**Попытка 1 (неправильная):**
- Игнорирование через `typescript: { ignoreBuildErrors: true }`
- **Проблема:** Код не работает

**Попытка 2 (правильная):**
- Удаление `onError` из `useQuery`:
  ```typescript
  // Было:
  const { data } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
    onError: (error) => {
      console.error('Failed:', error);
    },
  });
  
  // Стало:
  const { data, error } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
  });
  
  // Обработка ошибок через error из результата
  if (error) {
    console.error('Failed:', error);
  }
  ```

**Почему повторялось:**
- Не проверял все использования `useQuery` сразу

**Финальное решение:**
- Поиск всех `onError/onSuccess/onSettled`:
  ```bash
  grep -rn "onError:\|onSuccess:\|onSettled:" --include="*.tsx"
  ```

---

### 4. Ошибки деплоя Timeweb Cloud

#### 4.1. Timeweb не видит последний коммит

**Паттерн:**
- Timeweb собирает старый коммит, хотя новый уже запушен

**Решение:**
- Вручную обновить коммит в настройках деплоя Timeweb
- Или включить автодеплой при push

**Почему повторялось:**
- Timeweb кэширует список коммитов, нужно обновлять вручную

---

#### 4.2. Timeweb ищет Dockerfile в корне

**Паттерн:**
- Timeweb не видит `Dockerfile.web`, только `Dockerfile`

**Решение:**
- Создать отдельную ветку `web` для фронтенда
- Скопировать `Dockerfile.web` → `Dockerfile` в ветке `web`
- Выбрать ветку `web` в настройках деплоя

---

#### 4.3. Нет Build Arguments в UI Timeweb

**Паттерн:**
- Нужно передать `NEXT_PUBLIC_API_URL` в build stage, но в UI нет раздела "Build Arguments"

**Решение:**
- Хардкод в Dockerfile:
  ```dockerfile
  ENV NEXT_PUBLIC_API_URL=https://yaroslove88-arch-leaders-12c6.twc1.net
  RUN pnpm --filter @leadership-architect/web build
  ```

---

### 5. Ошибки базы данных

#### 5.1. Таблица не существует после деплоя

**Паттерн:**
```
The table 'public.jobs' does not exist in the current database
```

**Причина:**
- Prisma миграции не применяются автоматически

**Решение:**
- Добавить entrypoint.sh в Dockerfile:
  ```dockerfile
  RUN echo '#!/bin/sh\necho "Running database migrations..."\nnpx prisma migrate deploy\necho "Starting application..."\nexec node dist/main.js' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh
  CMD ["/bin/sh", "/app/entrypoint.sh"]
  ```

---

## Общие принципы решения ошибок

### ❌ Неправильный подход (по крупицам)

1. Исправляю одну ошибку
2. Коммит → Пуш → Деплой
3. Появляется новая ошибка
4. Повторяю с шага 1
5. **Результат:** Сутки на исправление ошибок

### ✅ Правильный подход (комплексно)

1. **Анализ паттерна ошибки:**
   - Понимаю тип ошибки (типизация, ESLint, runtime)
   - Ищу все аналогичные места в коде

2. **Комплексная проверка:**
   ```bash
   # Все использования свойства
   grep -rn "quest\." --include="*.tsx" | grep "quest\.[a-z]"
   
   # Все Object.values/entries без типов
   grep -rn "Object\.values\|Object\.entries" --include="*.tsx"
   
   # Все .map без типов
   grep -rn "\.map((" --include="*.tsx" | grep -v ": string\|: any"
   ```

3. **Исправление всех мест за раз:**
   - Обновляю интерфейсы полностью
   - Исправляю все использования
   - Проверяю связанные файлы

4. **Один коммит с описанием:**
   ```bash
   git commit -m "fix: add full type definitions for Quest and fix all usages"
   ```

5. **Результат:** Один деплой вместо десяти

---

## Чеклист перед деплоем

### TypeScript типизация

- [ ] Все интерфейсы содержат все используемые свойства
- [ ] Все `.map((x) =>` имеют типы: `.map((x: Type) =>`
- [ ] Все `Object.values/entries` типизированы или приведены
- [ ] Все пропсы с `undefined` используют `?? null`

### React Query

- [ ] Нет `onError/onSuccess/onSettled` в `useQuery`
- [ ] Ошибки обрабатываются через `error` из результата

### ESLint

- [ ] Нет неэкранированных кавычек в JSX
- [ ] Нет несуществующих `eslint-disable` правил

### Docker/Deploy

- [ ] Правильная ветка выбрана в Timeweb
- [ ] Последний коммит выбран вручную (если не автодеплой)
- [ ] Все env переменные хардкодятся в Dockerfile (если нет Build Args)

### База данных

- [ ] Prisma миграции применяются в entrypoint.sh

---

## Команды для комплексной проверки

```bash
# Все свойства объектов
grep -rn "quest\." --include="*.tsx" | grep "quest\.[a-z]" | sort | uniq
grep -rn "build\." --include="*.tsx" | grep "build\.[a-z]" | sort | uniq

# Все Object.values/entries без типов
grep -rn "Object\.values\|Object\.entries" --include="*.tsx"

# Все .map/.filter без типов
grep -rn "\.map((" --include="*.tsx" | grep -v ": string\|: any\|: number\|as const"
grep -rn "\.filter((" --include="*.tsx" | grep -v ": string\|: any\|: number"

# Все deprecated React Query опции
grep -rn "onError:\|onSuccess:\|onSettled:" --include="*.tsx"

# Все неэкранированные кавычки
grep -rn '"[^&]' --include="*.tsx" | grep -v "console\|//"

# Все undefined пропсы
grep -rn "=\{tree\}\|=\{build\}\|=\{quest\}" --include="*.tsx"
```

---

## Уроки

1. **Не игнорируй ошибки** — `ignoreBuildErrors` маскирует проблемы, не решает их
2. **Типизируй полностью** — лучше создать полные интерфейсы сразу, чем добавлять по одному свойству
3. **Проверяй комплексно** — одна ошибка = паттерн, ищи все аналогичные места
4. **Документируй решения** — чтобы не повторять те же ошибки
5. **Автоматизируй проверку** — используй grep для поиска паттернов перед деплоем

---

## Статистика

- **Всего ошибок исправлено:** ~15
- **Коммитов до комплексного подхода:** 10+
- **Коммитов после комплексного подхода:** 3
- **Время до комплексного подхода:** ~6 часов
- **Время после комплексного подхода:** ~30 минут

---

*Последнее обновление: 2026-01-18*
