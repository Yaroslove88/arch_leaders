# ===== BUILD STAGE =====
FROM node:22-slim AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY turbo.json tsconfig.json ./

# Copy packages (shared libs)
COPY packages/ ./packages/

# Copy Web app
COPY apps/web/ ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first
RUN pnpm --filter @leadership-architect/shared build || true

# Build web app with API URL and Telegram config
# Используем ARG для build-time переменных (можно переопределить через --build-arg)
ARG NEXT_PUBLIC_API_URL=https://yaroslove88-arch-leaders-12c6.twc1.net
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=life_yaroslav_rpg_bot

# ENV для передачи в build процесс
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=${NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}

RUN pnpm --filter @leadership-architect/web build

# ===== PRODUCTION STAGE =====
FROM node:22-slim AS runner

RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

WORKDIR /app

# Create non-root user (Debian syntax for slim image)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Copy built application
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_PUBLIC_API_URL=https://yaroslove88-arch-leaders-12c6.twc1.net

CMD ["node", "apps/web/server.js"]
