# Настройка Prisma

## ✅ Prisma установлен

Prisma уже добавлен в `package.json` как devDependency.

## 📦 Установка зависимостей

Если еще не установили зависимости:

```bash
# Из корня проекта
pnpm install

# Или из папки apps/api
cd apps/api
pnpm install
```

## 🚀 Использование Prisma команд

### Вариант 1: Через pnpm (рекомендуется)

```bash
cd apps/api

# Сгенерировать Prisma Client
pnpm prisma:generate
# или
pnpm prisma generate

# Применить миграции
pnpm prisma:migrate
# или
pnpm prisma migrate dev --name init

# Открыть Prisma Studio
pnpm prisma:studio
# или
pnpm prisma studio

# Форматировать schema
pnpm prisma:format
# или
pnpm prisma format

# Валидировать schema
pnpm prisma:validate
# или
pnpm prisma validate
```

### Вариант 2: Через npx

```bash
cd apps/api

# Сгенерировать Prisma Client
npx prisma generate

# Применить миграции
npx prisma migrate dev --name init

# Открыть Prisma Studio
npx prisma studio
```

## 📝 Первоначальная настройка

### 1. Создайте файл `.env`

В папке `apps/api/` создайте файл `.env`:

```env
DATABASE_URL="postgresql://leadership_architect:neofitus2023@localhost:5432/leadership_architect?schema=public"
PORT=3001
NODE_ENV=development
```

### 2. Сгенерируйте Prisma Client

```bash
cd apps/api
pnpm prisma:generate
```

Это создаст Prisma Client в `node_modules/.prisma/client/`

### 3. Примените миграции

```bash
pnpm prisma:migrate
# Введите имя миграции: init
```

Это создаст все таблицы в базе данных.

### 4. Проверьте через Prisma Studio

```bash
pnpm prisma:studio
```

Откроется веб-интерфейс на http://localhost:5555

## 🔍 Проверка подключения

Если Prisma не может подключиться к БД:

1. **Проверьте, что PostgreSQL запущен:**
   ```powershell
   Get-Service -Name postgresql*
   ```

2. **Проверьте DATABASE_URL в .env:**
   - Пользователь: `leadership_architect`
   - Пароль: `neofitus2023`
   - Хост: `localhost`
   - Порт: `5432`
   - База: `leadership_architect`

3. **Проверьте подключение вручную:**
   ```powershell
   & "D:\Program Files\PostgreSQL\18\bin\psql.exe" -U leadership_architect -d leadership_architect
   # Пароль: neofitus2023
   ```

## 📚 Полезные команды

```bash
# Создать новую миграцию
pnpm prisma migrate dev --name название_миграции

# Применить миграции в продакшене
pnpm prisma migrate deploy

# Сбросить базу и применить все миграции заново (⚠️ удалит данные!)
pnpm prisma migrate reset

# Посмотреть статус миграций
pnpm prisma migrate status

# Сгенерировать Prisma Client после изменения schema
pnpm prisma:generate
```

## ⚠️ Частые проблемы

### "Command not found: prisma"

**Решение:** Используйте `pnpm prisma` или `npx prisma` вместо просто `prisma`

### "Can't reach database server"

**Решение:**
1. Проверьте, что PostgreSQL запущен
2. Проверьте DATABASE_URL в .env
3. Проверьте, что порт 5432 не занят

### "Migration failed"

**Решение:**
```bash
# Посмотреть детали ошибки
pnpm prisma migrate status

# Если нужно начать заново (⚠️ удалит данные!)
pnpm prisma migrate reset
pnpm prisma migrate dev --name init
```

