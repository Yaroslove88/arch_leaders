# ✅ Чеклист миграции на нового Telegram бота

## Выполнено автоматически

- [x] Обновлён `Dockerfile.web` (строка 35)
- [x] Обновлена документация `docs/TIMEWEB_DEPLOYMENT.md`
- [x] Проверены все упоминания старого бота в коде

## Новые значения

- **Bot Username**: `arhitecture_leaders_bot`
- **Bot Token**: `8118350067:AAGYxV6LfNYV74tqyHOnVlNyQJ8u7gtLXfY`
- **Bot ID**: `8118350067` (первая часть токена)

## Что нужно сделать вручную

### 1. ✅ Переменные окружения в Timeweb (уже сделано)
- [x] API: `TELEGRAM_BOT_TOKEN=8118350067:AAGYxV6LfNYV74tqyHOnVlNyQJ8u7gtLXfY`
- [x] WEB: `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=arhitecture_leaders_bot`

### 2. ✅ Настройка BotFather (уже сделано)
- [x] Menu Button настроен
- [x] URL указан

### 3. ⏳ Деплой и проверка

#### 3.1. Закоммитить изменения
```bash
git add Dockerfile.web docs/TIMEWEB_DEPLOYMENT.md
git commit -m "Migrate to new Telegram bot: @arhitecture_leaders_bot"
git push
```

#### 3.2. Пересобрать WEB приложение в Timeweb
- В Timeweb App Platform → WEB приложение
- Запустить пересборку (или дождаться auto-deploy)
- Убедиться, что сборка прошла успешно

#### 3.3. Проверка работы

**Тест 1: Telegram Mini App**
1. Открыть бота `@arhitecture_leaders_bot` в Telegram
2. Нажать кнопку "Открыть" (Menu Button)
3. Должно открыться приложение с автоматической авторизацией
4. Проверить, что пользователь авторизован и видит дашборд

**Тест 2: Telegram OAuth (Login Widget)**
1. Открыть веб-версию приложения (не через Telegram)
2. Перейти на страницу `/login`
3. Нажать кнопку "Войти через Telegram"
4. Должен появиться Telegram Login Widget
5. После авторизации должен произойти редирект на дашборд

**Тест 3: Проверка токена**
- Убедиться, что в логах API нет ошибок верификации Telegram hash
- Проверить, что создаются/находятся пользователи по `telegramUsername`

## Troubleshooting

### Кнопка "Открыть" не появляется в боте
- Проверить настройку Menu Button в @BotFather
- Убедиться, что URL указан правильно

### Ошибка "Неверная подпись Telegram данных"
- Проверить, что `TELEGRAM_BOT_TOKEN` в API совпадает с токеном нового бота
- Убедиться, что токен скопирован полностью (включая часть после `:`)

### Telegram Login Widget не появляется
- Проверить, что `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` установлен в WEB приложении
- Убедиться, что домен настроен в BotFather (`/setdomain`)
- Для пользователей из России может потребоваться VPN

### Пользователь не создаётся
- Проверить логи API на наличие ошибок
- Убедиться, что база данных доступна
- Проверить, что Prisma миграции применены

## Старые значения (для справки)

- Старый Bot Username: `life_yaroslav_rpg_bot`
- Старый Bot Token: `8492047562:AAH_iSTGvjWQKNUCsOA4Cl5AQlSOonFq6Iw`

---

**Дата миграции**: 2025-01-XX  
**Статус**: ✅ Готово к деплою
