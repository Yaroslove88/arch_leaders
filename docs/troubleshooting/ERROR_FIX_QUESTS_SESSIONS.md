# Исправление ошибок в QuestsService, SessionsService и EvidenceService

## Дата: 2026-01-07

## Проблема

Ошибки при обращении к Prisma моделям:
- `TypeError: Cannot read properties of undefined (reading 'quest')` - QuestsService
- `TypeError: Cannot read properties of undefined (reading 'session')` - SessionsService
- `TypeError: Cannot read properties of undefined (reading 'evidence')` - EvidenceService

## Примененные исправления (согласно правилам проекта)

### 1. Проверка инжекции зависимостей

**QuestsService:**
```typescript
constructor(
  @Inject(PrismaService) private readonly prisma: PrismaService,
  @Inject(TreeService) private readonly treeService: TreeService,
) {
  if (!this.prisma) {
    throw new InternalServerErrorException('PrismaService injection failed');
  }
  if (!this.treeService) {
    throw new InternalServerErrorException('TreeService injection failed');
  }
}
```

**SessionsService:**
```typescript
constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
  if (!this.prisma) {
    throw new InternalServerErrorException('PrismaService injection failed');
  }
}
```

### 2. Проверка доступности Prisma моделей

**QuestsService.getAll:**
```typescript
async getAll(status?: 'active' | 'backlog' | 'done' | 'archived') {
  if (!this.prisma?.quest) {
    throw new InternalServerErrorException('Prisma quest model is not available');
  }
  // ... остальной код
}
```

**SessionsService.getAll:**
```typescript
async getAll(params?: { status?: string; limit?: number; offset?: number; }) {
  if (!this.prisma?.session) {
    throw new InternalServerErrorException('Prisma session model is not available');
  }
  // ... остальной код
}
```

### 3. Optional chaining в методах transform

**transformQuest:**
```typescript
private transformQuest(quest: any) {
  if (!quest) {
    return null;
  }

  return {
    id: quest?.id,
    title: quest?.title,
    // ... все поля с optional chaining
    session: quest?.session || null,
  };
}
```

**transformSession:**
```typescript
private transformSession(session: any) {
  if (!session) {
    return null;
  }

  return {
    id: session?.id,
    // ... все поля с optional chaining
    entry: session?.entry || null,
    quests: session?.quests || [],
  };
}
```

### 4. Исправление контекста this в map

**Было:**
```typescript
sessions.map(this.transformSession)
```

**Стало:**
```typescript
sessions.map((s) => this.transformSession(s))
```

## Ссылки на правила проекта

- `PROJECT_RULES.md` - Правило 2.1: Проверка инжекции зависимостей
- `PROJECT_RULES.md` - Правило 2.3: Optional chaining для вложенных свойств
- `docs/ERROR_HANDLING_GUIDE.md` - Обработка ошибок
- `docs/SYSTEMATIC_ERROR_RESOLUTION.md` - Системный подход

### 5. Исправления в EvidenceService

**Конструктор:**
```typescript
constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
  if (!this.prisma) {
    throw new InternalServerErrorException('PrismaService injection failed');
  }
}
```

**Методы с проверками:**
- `getAll()` - проверка `this.prisma?.evidence`
- `getById()` - проверка `this.prisma?.evidence`
- `create()` - проверка `this.prisma?.evidence` и optional chaining для связанных моделей
- `update()` - проверка `this.prisma?.evidence`
- `delete()` - проверка `this.prisma?.evidence`

**transformEvidence:**
```typescript
private transformEvidence(evidence: any) {
  if (!evidence) {
    return null;
  }

  return {
    id: evidence?.id,
    // ... все поля с optional chaining
  };
}
```

## Результат

- ✅ Добавлены проверки инжекции в конструкторах (QuestsService, SessionsService, EvidenceService)
- ✅ Добавлены проверки доступности Prisma моделей во всех методах
- ✅ Использован optional chaining в методах transform
- ✅ Исправлен контекст `this` в map
- ✅ Все методы защищены от undefined ошибок

## Следующие шаги

Если ошибка сохраняется, проверить:
1. Правильность генерации Prisma клиента: `cd apps/api && pnpm prisma generate`
2. Подключение к БД: проверить `DATABASE_URL` в `.env`
3. Инициализацию PrismaService: проверить логи при старте приложения (должно быть "✅ Prisma connected to database")

---

**Исправления применены согласно правилам проекта для всех трех сервисов!**

