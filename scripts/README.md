# Скрипты проекта Leadership Architect

Этот каталог содержит утилитарные скрипты для работы с проектом.

## 📋 Описание скриптов

### Работа с деревом способностей

#### `tree-fix.ts` - Универсальный скрипт для работы с деревом
**Заменяет:** `fix-tree.ts`, `fix-tree-directly.ts`, `check-and-fix-tree.ts`

**Использование:**
```bash
# Проверка структуры дерева
ts-node scripts/tree-fix.ts --mode=check

# Исправление/создание дерева из seed
ts-node scripts/tree-fix.ts --mode=fix

# Исправление с активацией узлов (по умолчанию)
ts-node scripts/tree-fix.ts --mode=activate
ts-node scripts/tree-fix.ts  # то же самое
```

**Режимы:**
- `check` - только проверка структуры дерева, без изменений
- `fix` - исправление/создание дерева из seed файла
- `activate` - исправление с активацией базовых узлов и установкой прогресса

#### `check-tree-nodes.ts` - Проверка seed файла дерева
**Использование:**
```bash
ts-node scripts/check-tree-nodes.ts
```

Проверяет структуру seed файла без подключения к БД.

#### `tree-utils.ts` - Утилиты для работы с деревом
Модуль с переиспользуемыми функциями для работы с деревом способностей.
Используется другими скриптами.

---

### Работа с пользователями

#### `check-users.ts` - Проверка пользователей
**Использование:**
```bash
ts-node scripts/check-users.ts
```

Проверяет наличие пользователей в БД.

#### `check-user-profile.ts` - Проверка профиля пользователя
**Использование:**
```bash
ts-node scripts/check-user-profile.ts [telegramUsername]
```

#### `create-admin.ts` - Создание администратора
**Использование:**
```bash
ts-node scripts/create-admin.ts
```

#### `initialize-user-profile.ts` - Инициализация профиля пользователя
**Использование:**
```bash
ts-node scripts/initialize-user-profile.ts [telegramUsername]
```

#### `generate-password-hash.ts` - Генерация хэша пароля
**Использование:**
```bash
ts-node scripts/generate-password-hash.ts [password]
```

---

### Работа с прогрессом

#### `create-user-progress.ts` - Создание прогресса пользователя
**Использование:**
```bash
ts-node scripts/create-user-progress.ts
```

#### `setup-full-progress.ts` - Настройка полного прогресса
**Использование:**
```bash
ts-node scripts/setup-full-progress.ts
```

#### `setup-tree-with-active-nodes.ts` - Настройка дерева с активными узлами
**Использование:**
```bash
ts-node scripts/setup-tree-with-active-nodes.ts
```

---

### Работа с узлами

#### `activate-nodes-for-builds.ts` - Активация узлов для билдов
**Использование:**
```bash
ts-node scripts/activate-nodes-for-builds.ts
```

#### `check-tree-nodes.ts` - Проверка узлов дерева
**Использование:**
```bash
ts-node scripts/check-tree-nodes.ts
```

---

### Работа с квестами

#### `create-test-quests.ts` - Создание тестовых квестов
**Использование:**
```bash
ts-node scripts/create-test-quests.ts
```

#### `update-quest-theories.ts` - Обновление теорий квестов
**Использование:**
```bash
ts-node scripts/update-quest-theories.ts
```

**Примечание:** Существуют также `.js` и `.ps1` версии этого скрипта. Рекомендуется использовать TypeScript версию.

---

### Работа с контентом

#### `create-content-from-docs.ts` - Создание контента из документации
**Использование:**
```bash
ts-node scripts/create-content-from-docs.ts
```

---

### Проверка качества кода

#### `check-code-quality.ts` - Проверка качества кода
**Использование:**
```bash
pnpm check:quality
# или
ts-node scripts/check-code-quality.ts
```

Проверяет соблюдение правил проекта:
- Swagger декораторы
- Обработка ошибок
- Использование типов

#### `fix-swagger-decorators.ts` - Исправление Swagger декораторов
**Использование:**
```bash
pnpm check:swagger
# или
ts-node scripts/fix-swagger-decorators.ts
```

---

### Утилиты

#### `final-check.ts` - Финальная проверка
**Использование:**
```bash
ts-node scripts/final-check.ts
```

#### `fix-case-texts.js` - Исправление текстов кейсов
**Использование:**
```bash
node scripts/fix-case-texts.js
```

#### `fix-dat.js` - Исправление данных
**Использование:**
```bash
node scripts/fix-dat.js
```

#### `fix-typo.js` - Исправление опечаток
**Использование:**
```bash
node scripts/fix-typo.js
```

---

## 🔧 Утилиты

### `utils/paths.ts` - Пути проекта
Модуль с утилитами для работы с путями проекта.

---

## 📝 Примечания

1. **TypeScript vs JavaScript:** Большинство скриптов написаны на TypeScript. Старые `.js` скрипты постепенно переводятся на TypeScript.

2. **Подключение к БД:** Скрипты, работающие с БД, требуют:
   - Настроенный `.env` файл с `DATABASE_URL`
   - Запущенную БД PostgreSQL

3. **Зависимости:** Все скрипты используют общие зависимости проекта из `node_modules`.

4. **Безопасность:** Скрипты могут изменять данные в БД. Всегда делайте резервную копию перед запуском скриптов, изменяющих данные.

---

## 🚀 Быстрый старт

1. Убедитесь, что БД запущена:
   ```bash
   docker-compose -f infra/docker-compose.dev.yml up -d
   ```

2. Запустите нужный скрипт:
   ```bash
   ts-node scripts/tree-fix.ts --mode=check
   ```

---

## 📚 Дополнительная информация

Для получения помощи по конкретному скрипту, откройте файл скрипта - большинство из них содержат комментарии с описанием.

