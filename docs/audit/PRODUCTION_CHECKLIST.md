# Production Readiness Checklist

Last updated: 2026-01-09

## Environment Configuration

- [x] Environment validation in `apps/api/src/config/env.validation.ts`
- [x] Production-specific validation (DATABASE_URL, WEB_URL required)
- [x] LLM API key warning if not set
- [x] JWT_SECRET and JWT_EXPIRES_IN configuration

### Required Environment Variables for Production

```bash
DATABASE_URL=postgresql://...
WEB_URL=https://your-domain.com
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# At least one LLM key
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...

# Optional
SENTRY_DSN=https://...@sentry.io/...
```

## CORS Configuration

- [x] Whitelist-based CORS in `apps/api/src/main.ts`
- [x] Production: Only WEB_URL allowed
- [x] Development: localhost:3000, 127.0.0.1:3000 also allowed
- [x] Credentials enabled
- [x] Proper methods and headers configured

## Error Handling

- [x] `AllExceptionsFilter` catches all exceptions
- [x] 5xx errors logged with stack trace
- [x] 4xx errors logged as warnings
- [x] Consistent error response format:
  ```json
  {
    "statusCode": 500,
    "timestamp": "...",
    "path": "/api/...",
    "method": "GET",
    "message": "Error description"
  }
  ```

## Logging

- [x] `LoggingInterceptor` logs all requests with timing
- [x] Request: `GET /api/quests 200 - 45ms`
- [x] Errors: `GET /api/quests - 12ms - Error message`
- [x] Sentry integration (optional, requires SENTRY_DSN)

## API Security

- [x] JWT authentication on all user-specific endpoints
- [x] userId checks in services
- [x] ForbiddenException for unauthorized access
- [x] ValidationPipe with whitelist (removes unknown properties)
- [x] Swagger disabled in production by default

### Endpoints Security Status

| Controller | Auth Required | Status |
|------------|---------------|--------|
| entries | Yes (all) | ✅ |
| sessions | Yes (all) | ✅ |
| quests | Yes (user-specific) | ✅ |
| evidence | Yes (all) | ✅ |
| tree | Yes (user-specific) | ✅ |
| cases | Yes (progress/solve) | ✅ |
| builds | Yes (current) | ✅ |
| auth | No (login/register) | ✅ |
| admin/* | Admin auth | ✅ |

## Database

- [x] Prisma ORM with migrations
- [x] Proper indexes on foreign keys
- [x] Cascade delete for user data
- [x] User isolation in queries

## Performance

- [x] Request logging with timing
- [ ] Database connection pooling (Prisma default)
- [ ] Redis caching (not implemented)
- [ ] Rate limiting (not implemented)

## Monitoring

- [x] Sentry error tracking (optional)
- [x] Request logging
- [x] Error logging with stack traces
- [ ] Metrics (Prometheus/StatsD not implemented)
- [ ] Health checks at `/health`

## Deployment Checklist

1. [ ] Set all required environment variables
2. [ ] Run database migrations: `npx prisma migrate deploy`
3. [ ] Build application: `pnpm build`
4. [ ] Verify CORS origins include production domain
5. [ ] Test authentication flow
6. [ ] Verify Sentry (if configured)
7. [ ] Run smoke tests

## Known Limitations

1. **No rate limiting** - Consider adding @nestjs/throttler
2. **No Redis caching** - Cases and quest templates loaded from files
3. **No metrics** - Only logging available
4. **Swagger disabled in production** - Set ENABLE_SWAGGER=true to override

## Recent Fixes (2026-01-09)

1. CasesService now uses database instead of in-memory storage
2. Frontend removed localStorage fallback for case progress
3. Evidence controller now requires authentication
4. Tree controller now requires authentication for mutations
5. Builds controller requires auth for user-specific endpoints
6. DTOs updated with proper types instead of `any`
