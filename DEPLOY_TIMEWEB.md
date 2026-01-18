# Деплой Leadership Architect на Timeweb Cloud

## Архитектура

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   PostgreSQL    │
│   (Next.js)     │     │    (NestJS)     │     │   (Managed DB)  │
│   Dockerfile.web│     │   Dockerfile    │     │   Timeweb DBaaS │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Деплоим 2 отдельных приложения** в App Platform.

---

## Шаг 1: База данных (уже создана)

Убедись, что в панели Timeweb Cloud → Базы данных → PostgreSQL:
- Записан **Host** (например: `pg-123456.timeweb.cloud`)
- Записан **Port** (обычно `5432`)
- Записан **User** и **Password**
- Записано **Database name**

**DATABASE_URL формат:**
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=require
```

Пример:
```
postgresql://leadership:MyPass123@pg-123456.timeweb.cloud:5432/leadership_db?schema=public&sslmode=require
```

---

## Шаг 2: Деплой Backend (API)

### 2.1 Создание приложения

1. Timeweb Cloud → **Apps** → **Создать приложение**
2. Тип: **Docker** (из Dockerfile)
3. Источник: **GitHub** → репозиторий `Yaroslove88/arch_leaders`
4. Ветка: `main`
5. Dockerfile: `Dockerfile` (в корне репо)
6. Порт: `3000`

### 2.2 Переменные окружения (Environment Variables)

| Переменная | Значение | Обязательно |
|------------|----------|-------------|
| `NODE_ENV` | `production` | ✅ |
| `PORT` | `3000` | ✅ |
| `DATABASE_URL` | `postgresql://USER:PASS@HOST:PORT/DB?schema=public&sslmode=require` | ✅ |
| `WEB_URL` | `https://ВАШ-ФРОНТ-ДОМЕН.timeweb.cloud` | ✅ |
| `JWT_SECRET` | любая длинная строка (32+ символов) | ✅ |
| `OPENAI_API_KEY` | ваш ключ OpenAI | опционально |
| `ANTHROPIC_API_KEY` | ваш ключ Anthropic | опционально |

### 2.3 Проверка

После деплоя откройте:
```
https://ВАШ-API-ДОМЕН.timeweb.cloud/health
```

Должен вернуть:
```json
{
  "status": "ok",
  "database": "connected"
}
```

**Если `database: "disconnected"`** — проблема в `DATABASE_URL` или доступе к БД.

---

## Шаг 3: Миграции БД (один раз)

После первого деплоя API нужно применить миграции.

### Вариант A: Через консоль Timeweb (если есть)
```bash
cd apps/api
npx prisma migrate deploy
```

### Вариант B: Локально (подключившись к удалённой БД)
```bash
# Локально на своём компе
cd apps/api
DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB?schema=public&sslmode=require" npx prisma migrate deploy
```

---

## Шаг 4: Деплой Frontend (Web)

### 4.1 Создание приложения

1. Timeweb Cloud → **Apps** → **Создать приложение**
2. Тип: **Docker** (из Dockerfile)
3. Источник: **GitHub** → репозиторий `Yaroslove88/arch_leaders`
4. Ветка: `main`
5. Dockerfile: `Dockerfile.web`
6. Порт: `3000`

### 4.2 Переменные окружения

| Переменная | Значение | Обязательно |
|------------|----------|-------------|
| `NODE_ENV` | `production` | ✅ |
| `NEXT_PUBLIC_API_URL` | `https://ВАШ-API-ДОМЕН.timeweb.cloud` | ✅ |
| `NEXT_PUBLIC_ADMIN_MODE` | `false` | опционально |

**ВАЖНО**: `NEXT_PUBLIC_API_URL` должен указывать на уже задеплоенный API (шаг 2).

### 4.3 Build Args

При создании Docker-приложения добавьте **Build Argument**:
- `NEXT_PUBLIC_API_URL` = `https://ВАШ-API-ДОМЕН.timeweb.cloud`

(Next.js встраивает NEXT_PUBLIC_* переменные на этапе билда)

---

## Шаг 5: Связка доменов

После деплоя обоих приложений:

1. **Скопируй домен фронтенда** (например: `arch-web-abc123.timeweb.cloud`)
2. **Иди в настройки API** → Переменные → Измени `WEB_URL` на этот домен
3. **Передеплой API** (чтобы CORS подхватил новый origin)

---

## Чеклист после деплоя

- [ ] `/health` на API возвращает `database: connected`
- [ ] Фронтенд открывается без ошибок в консоли
- [ ] Регистрация/логин работает
- [ ] Нет ошибок CORS в консоли браузера

---

## Частые проблемы

### CORS ошибка
```
Access to fetch at 'https://api...' from origin 'https://web...' has been blocked by CORS
```
**Решение**: Проверь, что `WEB_URL` в API **точно совпадает** с доменом фронта (включая `https://`).

### Database connection failed
**Решение**: 
1. Проверь `DATABASE_URL` — правильный формат
2. Добавь `&sslmode=require` если его нет
3. В панели Timeweb БД проверь, что доступ открыт для App Platform (не только по IP)

### Mixed Content (http/https)
**Решение**: `NEXT_PUBLIC_API_URL` должен быть с `https://`, не `http://`

---

## Быстрые команды для локальной отладки

```bash
# Проверить подключение к удалённой БД
DATABASE_URL="postgresql://..." npx prisma db pull

# Применить миграции к удалённой БД
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Посмотреть данные в удалённой БД
DATABASE_URL="postgresql://..." npx prisma studio
```
