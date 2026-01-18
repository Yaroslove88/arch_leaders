# Реализация правил проекта

## Дата: 2026-01-07

## Выполнено

### 1. Созданы файлы с правилами проекта

#### `.cursorrules`
- Правила для Cursor AI
- Краткие чеклисты
- Запрещенные паттерны
- Ссылки на документацию

#### `PROJECT_RULES.md`
- Полные правила проекта
- Детальные примеры кода
- Чеклисты перед коммитом
- Системный подход к решению ошибок
- Описание утилит

#### `README_RULES.md`
- Краткая справка
- Быстрая проверка перед коммитом
- Основные правила в сжатом виде

### 2. Создан скрипт автоматической проверки

#### `scripts/check-code-quality.ts`
Автоматически проверяет:
- ✅ Наличие Swagger декораторов (`@ApiTags`, `@ApiParam`, `@ApiQuery`, `@ApiBody`)
- ✅ Использование `any` типов
- ✅ Проверку результатов Prisma запросов
- ✅ Использование optional chaining
- ✅ Прямой доступ к свойствам без проверки

**Запуск:**
```bash
pnpm check:quality
```

### 3. Настроен ESLint

#### `.eslintrc.json`
Правила:
- `@typescript-eslint/no-explicit-any: error` - запрет `any`
- `@typescript-eslint/prefer-nullish-coalescing: error` - предпочтение `??`
- `@typescript-eslint/prefer-optional-chain: error` - предпочтение `?.`
- `@typescript-eslint/no-non-null-assertion: warn` - предупреждение `!`
- `@typescript-eslint/strict-boolean-expressions: warn` - строгие булевы выражения

### 4. Добавлены npm скрипты

В `package.json`:
```json
{
  "scripts": {
    "check:quality": "ts-node scripts/check-code-quality.ts",
    "check:swagger": "ts-node scripts/fix-swagger-decorators.ts",
    "precommit": "pnpm check:quality && pnpm lint && pnpm typecheck"
  }
}
```

### 5. Обновлена документация

- `README.md` - добавлены ссылки на правила проекта
- Создана структура документации правил

---

## Два системных подхода

### Подход 1: Swagger декораторы

**Проблема:** `TypeError: Cannot read properties of undefined (reading '0')` в Swagger

**Решение:**
1. Всегда использовать классы для DTO (не интерфейсы)
2. Добавлять `@ApiProperty` на все поля DTO
3. Добавлять декораторы для всех параметров:
   - `@ApiParam` для `@Param`
   - `@ApiQuery` для `@Query`
   - `@ApiBody` для `@Body`
4. Добавлять `@ApiOperation` и `@ApiResponse` для всех методов

**Документация:** `docs/SWAGGER_TROUBLESHOOTING.md`

### Подход 2: Обработка ошибок "Cannot read properties of undefined"

**Проблема:** Ошибки при доступе к свойствам undefined объектов

**Решение:**
1. Проверка инжекции зависимостей в конструкторе
2. Использование утилит (`findUniqueOrThrow`, `assertExists`)
3. Optional chaining (`?.`) для вложенных свойств
4. Валидация входных параметров

**Документация:** `docs/ERROR_HANDLING_GUIDE.md`, `docs/SYSTEMATIC_ERROR_RESOLUTION.md`

---

## Текущий статус проверки

При запуске `pnpm check:quality` обнаружено:
- **56 ошибок** (требуют исправления)
- **125 предупреждений** (рекомендуется исправить)

### Основные проблемы:
1. Использование `any` типов (56 случаев)
2. Prisma запросы без проверки (8 случаев)
3. Прямой доступ к свойствам без optional chaining (125 случаев)

---

## Следующие шаги

1. **Исправить критические ошибки:**
   - Заменить `any` на конкретные типы или DTO
   - Добавить проверки для Prisma запросов
   - Использовать утилиты (`findUniqueOrThrow`)

2. **Улучшить код:**
   - Добавить optional chaining где необходимо
   - Создать недостающие DTO классы

3. **Настроить pre-commit hook:**
   - Автоматически запускать `pnpm precommit` перед коммитом
   - Использовать `husky` или `lint-staged`

---

## Использование

### Перед коммитом:
```bash
pnpm check:quality
```

### Полная проверка:
```bash
pnpm precommit
```

### Проверка Swagger:
```bash
pnpm check:swagger
```

---

## Документация

- `PROJECT_RULES.md` - полные правила
- `README_RULES.md` - краткая справка
- `.cursorrules` - правила для Cursor AI
- `docs/SWAGGER_TROUBLESHOOTING.md` - решение проблем Swagger
- `docs/ERROR_HANDLING_GUIDE.md` - обработка ошибок
- `docs/SYSTEMATIC_ERROR_RESOLUTION.md` - системный подход

---

**Правила проекта внедрены и готовы к использованию!**

