# Настройка Telegram OAuth

## Обзор

Приложение поддерживает два способа входа:
1. **Telegram OAuth** - быстрый вход через Telegram Login Widget
2. **Логин и пароль** - традиционный способ входа через telegramUsername и пароль

## Настройка Telegram Bot

### 1. Создание бота в Telegram

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните **Bot Token** (например: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Настройка домена для Login Widget

1. В [@BotFather](https://t.me/BotFather) отправьте команду `/setdomain`
2. Выберите вашего бота
3. Укажите домен вашего приложения (например: `yourdomain.com`)

**Важно:** Для локальной разработки можно использовать `localhost`, но в production необходим реальный домен.

### 3. Настройка переменных окружения

#### Backend (API)

Добавьте в `.env` файл API:

```env
# Telegram Bot Token (для верификации hash)
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

#### Frontend (Web)

Добавьте в `.env.local` файл веб-приложения:

```env
# Telegram Bot ID (только ID, без токена)
NEXT_PUBLIC_TELEGRAM_BOT_ID=your_bot_id_here
```

**Как получить Bot ID:**
- Bot ID - это первая часть токена до двоеточия
- Например, если токен `123456789:ABCdefGHI...`, то Bot ID = `123456789`

## Как это работает

### Telegram OAuth Flow

1. Пользователь нажимает кнопку "Войти через Telegram" на лендинге
2. Telegram Login Widget открывается и запрашивает разрешение
3. После подтверждения, Telegram отправляет данные пользователя в callback функцию
4. Фронтенд отправляет данные на `/auth/telegram` endpoint
5. Backend верифицирует hash и создает/находит пользователя
6. Backend возвращает JWT токен
7. Пользователь перенаправляется на дашборд

### Безопасность

- Hash верифицируется с использованием Bot Token
- Данные аутентификации действительны только 24 часа
- Если `TELEGRAM_BOT_TOKEN` не настроен, верификация пропускается (только для разработки)

## Troubleshooting

### Кнопка Telegram не появляется

1. Проверьте, что `NEXT_PUBLIC_TELEGRAM_BOT_ID` установлен в `.env.local`
2. Убедитесь, что домен настроен в BotFather
3. Для пользователей из России может потребоваться VPN

### Ошибка "Неверная подпись Telegram данных"

1. Проверьте, что `TELEGRAM_BOT_TOKEN` правильно установлен в `.env` API
2. Убедитесь, что используется правильный Bot Token (не Bot ID)
3. Проверьте, что домен в BotFather совпадает с доменом приложения

### Пользователь не создается

1. Проверьте подключение к базе данных
2. Убедитесь, что схема Prisma синхронизирована
3. Проверьте логи API на наличие ошибок

## Примеры использования

### Локальная разработка

```env
# .env (API)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# .env.local (Web)
NEXT_PUBLIC_TELEGRAM_BOT_ID=123456789
```

### Production

```env
# .env (API)
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN_FROM_SECRETS}

# .env.local (Web)
NEXT_PUBLIC_TELEGRAM_BOT_ID=${TELEGRAM_BOT_ID_FROM_SECRETS}
```

## Дополнительная информация

- [Telegram Login Widget Documentation](https://core.telegram.org/widgets/login)
- [Telegram Bot API](https://core.telegram.org/bots/api)

