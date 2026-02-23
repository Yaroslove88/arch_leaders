# (Legacy) Чеклист миграции на нового Telegram бота

> ⚠️ **Важно (23.02.2026):** Telegram OAuth и Mini App auto-auth удалены из проекта. Этот чеклист оставлен как справка по настройке бота/кнопки Menu Button, но не про авторизацию.

## Выполнено автоматически

- [x] Обновлён `Dockerfile.web` (строка 35)
- [x] Обновлена документация `docs/TIMEWEB_DEPLOYMENT.md`
- [x] Проверены все упоминания старого бота в коде

## Новые значения

- **Bot Username**: `arhitecture_leaders_bot`
- **Bot Token**: `your_bot_token`

## Что нужно сделать вручную

### 1. ✅ Переменные окружения в Timeweb (уже сделано)
- [x] API: `TELEGRAM_BOT_TOKEN=your_bot_token`

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
3. Должно открыться приложение
4. Выполнить вход через `/login` (логин/пароль)

**Тест 2: Проверка логина**
- Убедиться, что вход по логину/паролю работает и выдаётся JWT

## Troubleshooting

### Кнопка "Открыть" не появляется в боте
- Проверить настройку Menu Button в @BotFather
- Убедиться, что URL указан правильно

### Ошибка "Неверная подпись Telegram данных"
- (Неактуально) Telegram-аутентификация удалена из проекта

### Telegram Login Widget не появляется
- (Неактуально) Telegram Login Widget удалён из проекта

### Пользователь не создаётся
- Проверить логи API на наличие ошибок
- Убедиться, что база данных доступна
- Проверить, что Prisma миграции применены

## Старые значения (для справки)

- Старый Bot Username: `life_yaroslav_rpg_bot`
- Старый Bot Token: `your_old_bot_token`

---

**Дата миграции**: 2025-01-XX  
**Статус**: ✅ Готово к деплою
