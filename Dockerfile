# ===== BUILD STAGE =====
FROM node:22-slim AS builder

# Install OpenSSL and other dependencies required by Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

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

# Copy runtime data files (cases/builds/templates/etc.)
COPY data/ ./data/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first
RUN pnpm --filter @leadership-architect/shared build || true

# Generate Prisma Client (MUST be before API build)
RUN cd apps/api && npx prisma generate

# Build API
RUN pnpm --filter @leadership-architect/api build

# ===== PRODUCTION STAGE =====
FROM node:22-slim AS runner

# Install OpenSSL for Prisma runtime
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

WORKDIR /app

# Create non-root user (Debian syntax for slim image)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nestjs

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/data ./data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

WORKDIR /app/apps/api

# Use repo-managed entrypoint (runs migrations + seeds admin + exec)
COPY --from=builder /app/apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nestjs

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/apps/api/src/main.js"]
