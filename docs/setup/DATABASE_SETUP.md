# Настройка базы данных

## ✅ База данных создана

Вы уже создали:
- **Пользователь:** `leadership_architect`
- **Пароль:** `neofitus2023`
- **База данных:** `leadership_architect`

## 🔍 Проверка подключения

Проверьте, что подключение работает:

```powershell
# Найти путь к psql (обычно в Program Files\PostgreSQL\XX\bin)
& "D:\Program Files\PostgreSQL\18\bin\psql.exe" -U leadership_architect -d leadership_architect
# Пароль: neofitus2023
# Если подключились - всё работает!
\q
```

## 📝 Настройка .env

Создайте файл `.env` в папке `apps/api/`:

```env
DATABASE_URL="postgresql://leadership_architect:neofitus2023@localhost:5432/leadership_architect?schema=public"
PORT=3001
NODE_ENV=development
```

## 🚀 Следующие шаги

1. **Сгенерировать Prisma Client:**
   ```bash
   cd apps/api
   pnpm prisma generate
   # или
   pnpm prisma:generate
   ```

2. **Применить миграции:**
   ```bash
   pnpm prisma migrate dev --name init
   # или
   pnpm prisma:migrate
   # (введите имя миграции: init)
   ```

3. **Проверить через Prisma Studio:**
   ```bash
   pnpm prisma studio
   # или
   pnpm prisma:studio
   # Откроется на http://localhost:5555
   ```

**Подробнее:** См. [apps/api/PRISMA_SETUP.md](apps/api/PRISMA_SETUP.md)

## ⚠️ Если что-то не работает

### Ошибка подключения

1. Проверьте, что PostgreSQL запущен:
   ```powershell
   Get-Service -Name postgresql*
   ```

2. Проверьте, что порт 5432 не занят:
   ```powershell
   netstat -ano | findstr :5432
   ```

3. Проверьте права пользователя:
   ```sql
   -- В pgAdmin4 или psql
   SELECT * FROM pg_user WHERE usename = 'leadership_architect';
   ```

### Ошибка миграций

Если миграции не применяются:

```bash
# Сбросить и начать заново (⚠️ удалит все данные!)
cd apps/api
pnpm prisma migrate reset
pnpm prisma migrate dev --name init
```

