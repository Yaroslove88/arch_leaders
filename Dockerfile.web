# ===== BUILD STAGE =====
FROM node:20-alpine AS builder

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

# Build web app with API URL
ENV NEXT_PUBLIC_API_URL=https://yaroslove88-arch-leaders-12c6.twc1.net

RUN pnpm --filter @leadership-architect/web build

# ===== PRODUCTION STAGE =====
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

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
