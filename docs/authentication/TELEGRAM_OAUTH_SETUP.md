# (Legacy) Настройка Telegram OAuth

> ⚠️ **Важно (23.02.2026):** Telegram OAuth (`/auth/telegram`) и Telegram Mini App auto-auth (`/auth/telegram-webapp`) удалены из проекта.
>
> Текущий и единственный поддерживаемый способ входа: **логин + пароль** через `POST /auth/login`.

## Что делать вместо этого

1. Настройте пользователей в БД (или через `POST /auth/register`, если регистрация включена).
2. На фронтенде используйте страницу `/login` (форма логин/пароль).

## Где читать актуальное

- `docs/authentication/AUTHENTICATION.md`
- `docs/authentication/USER_AUTHENTICATION.md`

