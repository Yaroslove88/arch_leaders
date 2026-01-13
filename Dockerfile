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

# Copy API app
COPY apps/api/ ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN cd apps/api && pnpm prisma generate

# Build shared packages first, then API
RUN pnpm --filter @leadership-architect/shared build || true
RUN pnpm --filter @leadership-architect/api build

# ===== PRODUCTION STAGE =====
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages ./packages

# Copy package.json for runtime
COPY --from=builder /app/apps/api/package.json ./apps/api/

USER nestjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app/apps/api

CMD ["node", "dist/apps/api/src/main.js"]
