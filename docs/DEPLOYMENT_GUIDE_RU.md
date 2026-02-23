# 🚀 Гайд по деплою Leadership Architect

## Архитектура деплоя

```
                    Пользователь
                         │
                         ▼
┌─────────────────────────────────────────┐
│              Vercel                      │
│    Next.js Frontend (apps/web)          │
│         your-domain.com                 │
└─────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────┐
│           Railway / Render              │
│    NestJS Backend (apps/api)            │
│        api.your-domain.com              │
│              +                          │
│         PostgreSQL DB                   │
└─────────────────────────────────────────┘
```

---

## 1️⃣ Деплой PostgreSQL + Backend на Railway

### Шаг 1: Создать проект в Railway

1. Зайти на [railway.app](https://railway.app)
2. Создать новый проект
3. Добавить PostgreSQL сервис
4. Скопировать `DATABASE_URL`

### Шаг 2: Подготовить Backend

Создать `apps/api/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Установить pnpm
RUN npm install -g pnpm

# Копируем файлы для установки зависимостей
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile

# Копируем исходный код
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Генерируем Prisma клиент
WORKDIR /app/apps/api
RUN npx prisma generate

# Собираем приложение
RUN pnpm build

# Production образ
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/data ./data

# Порт
EXPOSE 3001

CMD ["node", "dist/main.js"]
```

### Шаг 3: Переменные окружения в Railway

```bash
DATABASE_URL=postgresql://...  # Автоматически от Railway PostgreSQL
JWT_SECRET=your-super-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d
WEB_URL=https://your-domain.com
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=sk-...  # или ANTHROPIC_API_KEY
```

### Шаг 4: Деплой

```bash
# Установить Railway CLI
npm install -g @railway/cli

# Залогиниться
railway login

# Связать с проектом
railway link

# Задеплоить
railway up
```

### Шаг 5: Миграции базы данных

```bash
# Подключиться к Railway
railway run npx prisma migrate deploy

# Создать админа
railway run npx ts-node scripts/create-admin-user.ts
```

---

## 2️⃣ Деплой Frontend на Vercel

### Шаг 1: Подготовить Next.js

Обновить `apps/web/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

### Шаг 2: Создать vercel.json в корне

```json
{
  "buildCommand": "pnpm turbo build --filter=web",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "devCommand": "pnpm dev --filter=web"
}
```

### Шаг 3: Переменные окружения в Vercel

```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### Шаг 4: Деплой

```bash
# Установить Vercel CLI
npm install -g vercel

# Залогиниться
vercel login

# Деплой
vercel --prod
```

---

## 3️⃣ Настройка домена

### Основной домен (your-domain.com)

1. В Vercel: Settings → Domains → Add Domain
2. Добавить DNS записи у регистратора:
   - A запись: `@` → IP от Vercel
   - CNAME: `www` → `cname.vercel-dns.com`

### Поддомен для API (api.your-domain.com)

1. В Railway: Settings → Domains → Add Custom Domain
2. Добавить DNS запись у регистратора:
   - CNAME: `api` → URL от Railway

---

## 4️⃣ Telegram Mini App

### Требования
- ✅ HTTPS домен (обязательно)
- ✅ Мобильно-адаптивный интерфейс
- ✅ Telegram Web App API

### Шаг 1: Создать бота

1. Написать [@BotFather](https://t.me/BotFather)
2. `/newbot` → создать бота
3. `/newapp` → создать Mini App
4. Указать URL: `https://your-domain.com`

### Шаг 2: Добавить Telegram Web App SDK

В `apps/web/src/app/layout.tsx`:

```tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Шаг 3: Создать хук для Telegram

Создать `apps/web/src/hooks/useTelegram.ts`:

```typescript
'use client';

import { useEffect, useState } from 'react';

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      username?: string;
      first_name: string;
      last_name?: string;
    };
  };
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramWebApp['initDataUnsafe']['user'] | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      setWebApp(tg);
      setUser(tg.initDataUnsafe?.user || null);
    }
  }, []);

  return {
    webApp,
    user,
    isTelegram: !!webApp,
    colorScheme: webApp?.colorScheme || 'light',
    themeParams: webApp?.themeParams || {},
  };
}
```

### Шаг 4: Использовать в компонентах

```tsx
'use client';

import { useTelegram } from '@/hooks/useTelegram';

export default function HomePage() {
  const { isTelegram, user, colorScheme } = useTelegram();

  return (
    <div className={colorScheme === 'dark' ? 'dark' : ''}>
      {isTelegram && user && (
        <p>Привет, {user.first_name}!</p>
      )}
      {/* Остальной контент */}
    </div>
  );
}
```

### Шаг 5: Авторизация

С **23.02.2026** Telegram OAuth/Mini App auto-auth удалены из проекта. Используется только вход по логину/паролю через `POST /auth/login`.

---

## 5️⃣ Альтернативные платформы

### Если нужен полный контроль

| Платформа | Frontend | Backend | БД | Цена |
|-----------|----------|---------|-----|------|
| **Railway** | ✅ | ✅ | ✅ | $5/мес старт |
| **Render** | ✅ | ✅ | ✅ | Free tier есть |
| **Fly.io** | ✅ | ✅ | ✅ | Pay-as-you-go |
| **DigitalOcean App** | ✅ | ✅ | ✅ | $5/мес старт |

### Vercel-only вариант (упрощённый)

Можно переписать backend на Next.js API Routes:
- Плюсы: Один деплой, проще
- Минусы: Много переписывать, ограничения serverless

---

## 6️⃣ Чеклист деплоя

### Перед деплоем

- [ ] Все секреты вынесены в переменные окружения
- [ ] `.env` файлы в `.gitignore`
- [ ] `DATABASE_URL` указывает на production БД
- [ ] `WEB_URL` указывает на production домен
- [ ] CORS настроен на production домен

### После деплоя

- [ ] Health check работает: `GET /health`
- [ ] Авторизация работает
- [ ] HTTPS работает
- [ ] Домен привязан
- [ ] Telegram Mini App открывается

---

## 7️⃣ Ориентировочные затраты

| Сервис | Бесплатно | Платно |
|--------|-----------|--------|
| Vercel (Frontend) | 100GB bandwidth | $20/мес Pro |
| Railway (Backend + DB) | $5 credit/мес | ~$10-20/мес |
| Домен | — | $10-15/год |
| **Итого** | ~$5/мес | ~$30-40/мес |

---

## Быстрый старт

```bash
# 1. Railway - Backend + DB
railway login
railway init
railway add postgresql
railway up

# 2. Vercel - Frontend
vercel login
vercel --prod

# 3. Telegram - Mini App
# → @BotFather → /newapp → указать URL
```
