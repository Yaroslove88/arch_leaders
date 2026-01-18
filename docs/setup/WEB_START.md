# Запуск веб-приложения (Frontend)

## Быстрый старт

### 1. Установите зависимости (ВАЖНО!)

В монорепо зависимости устанавливаются из **корня проекта**:

```bash
cd leadership-architect
pnpm install
```

Это установит все зависимости для всех пакетов (api, web, shared, ui).

### 2. Убедитесь, что Backend API запущен

Backend API должен быть запущен на порту 3001:

```bash
cd apps/api
pnpm dev
```

Проверьте, что API работает:
```bash
curl http://localhost:3001/health
```

### 3. Настройте переменные окружения (опционально)

Если API работает на другом порту или адресе, создайте файл `.env.local` в `apps/web/`:

```bash
cd apps/web
```

Создайте файл `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Примечание:** По умолчанию используется `http://localhost:3001`, так что этот шаг можно пропустить, если API на стандартном порту.

### 4. Запустите веб-приложение

#### Вариант 1: Из корня проекта (рекомендуется)
```bash
# Из корня проекта
cd leadership-architect
pnpm dev
```

Это запустит и API, и Web одновременно (если настроено в turbo.json).

#### Вариант 2: Только веб-приложение
```bash
cd leadership-architect/apps/web
pnpm dev
```

### 5. Откройте в браузере

После запуска откройте:
```
http://localhost:3000
```

Next.js по умолчанию использует порт 3000.

---

## Решение проблем

### Ошибка: "Cannot find module 'tailwindcss'"

**Причина:** Зависимости не установлены или установлены неправильно.

**Решение:**
1. Удалите `node_modules` и установите заново из корня:
   ```bash
   cd leadership-architect
   rm -rf node_modules apps/*/node_modules packages/*/node_modules
   pnpm install
   ```

2. Или переустановите только для web:
   ```bash
   cd leadership-architect/apps/web
   rm -rf node_modules .next
   cd ../..
   pnpm install
   ```

### Ошибка: "Failed to fetch data"

**Причина:** Backend API не запущен или недоступен.

**Решение:**
1. Убедитесь, что API запущен на порту 3001
2. Проверьте переменную `NEXT_PUBLIC_API_URL` в `.env.local`
3. Проверьте CORS настройки в API (должен быть включен `enableCors()`)

### Ошибка: "Port 3000 is already in use"

**Решение:**
Используйте другой порт:
```bash
cd apps/web
pnpm dev -p 3002
```

Или убейте процесс на порту 3000:
```bash
# Windows PowerShell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Ошибка: "Module not found" или другие ошибки сборки

**Решение:**
1. Очистите кэш Next.js:
   ```bash
   cd apps/web
   rm -rf .next
   ```

2. Переустановите зависимости из корня:
   ```bash
   cd leadership-architect
   pnpm install
   ```

3. Перезапустите dev сервер

---

## Доступные страницы

После запуска доступны следующие страницы:

- **Главная:** `http://localhost:3000/`
- **Dashboard:** `http://localhost:3000/dashboard`
- **Добавить запись:** `http://localhost:3000/entries/new`
- **Детали записи:** `http://localhost:3000/entries/[id]`
- **Сессии:** `http://localhost:3000/sessions`
- **Детали сессии:** `http://localhost:3000/sessions/[id]`
- **Квесты:** `http://localhost:3000/quests`
- **Дерево способностей:** `http://localhost:3000/tree`
- **Доказательства:** `http://localhost:3000/evidence`

---

## Сборка для production

### 1. Соберите проект
```bash
cd leadership-architect
pnpm build
```

Или только web:
```bash
cd apps/web
pnpm build
```

### 2. Запустите production сервер
```bash
cd apps/web
pnpm start
```

---

## Структура проекта

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router страницы
│   │   ├── page.tsx      # Главная страница
│   │   ├── dashboard/    # Dashboard
│   │   ├── entries/      # Записи
│   │   ├── sessions/     # Сессии
│   │   ├── quests/       # Квесты
│   │   ├── tree/         # Дерево способностей
│   │   └── evidence/     # Доказательства
│   ├── components/       # React компоненты
│   └── lib/
│       └── api.ts        # API клиент
├── public/               # Статические файлы
├── .env.local           # Переменные окружения (создать)
└── package.json
```

---

## Дополнительные команды

### Проверка типов
```bash
cd apps/web
pnpm typecheck
```

### Линтинг
```bash
cd apps/web
pnpm lint
```

### Тесты
```bash
cd apps/web
pnpm test
```

---

## Важно для монорепо

В монорепо с pnpm:
- Все зависимости устанавливаются из **корня проекта** через `pnpm install`
- Не нужно устанавливать зависимости отдельно в каждом пакете
- pnpm использует workspace для управления зависимостями
- Если видите ошибки "module not found", переустановите зависимости из корня

---

**Готово!** Веб-приложение должно быть доступно по адресу `http://localhost:3000` 🎉
