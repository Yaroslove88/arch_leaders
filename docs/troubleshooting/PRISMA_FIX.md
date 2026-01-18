# Исправление проблемы с Prisma Client

## Проблема
Prisma Client не содержит модель `treeSemantic`. Это происходит, когда Prisma Client не был сгенерирован после изменений в схеме.

## Решение

### 1. Сгенерируйте Prisma Client

```powershell
cd D:\gpt\Professional\leadership-architect\apps\api
pnpm prisma:generate
```

Или из корня проекта:

```powershell
cd D:\gpt\Professional\leadership-architect
cd apps\api
pnpm prisma:generate
```

### 2. Проверьте, что схема правильная

Убедитесь, что в `apps/api/prisma/schema.prisma` есть модель `TreeSemantic`:

```prisma
model TreeSemantic {
  id               String   @id @default("tree_main")
  semantic_version String   @default("1.0.0")
  tree_revision    Int      @default(1)
  data             Json
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
  integrity_hash   String?
  
  @@map("tree_semantic")
}
```

### 3. Перезапустите API

После генерации Prisma Client перезапустите API:

```powershell
cd D:\gpt\Professional\leadership-architect\apps\api
pnpm dev
```

## Проверка

После генерации Prisma Client должен содержать методы:
- `prisma.treeSemantic.findUnique()`
- `prisma.treeSemantic.create()`
- `prisma.treeSemantic.update()`
- `prisma.treeLayout.findFirst()`
- и т.д.

## Если проблема сохраняется

1. Убедитесь, что Prisma установлен:
   ```powershell
   cd apps/api
   pnpm list prisma
   ```

2. Проверьте путь к схеме в `package.json`:
   ```json
   "prisma": {
     "schema": "prisma/schema.prisma"
   }
   ```

3. Очистите и перегенерируйте:
   ```powershell
   cd apps/api
   Remove-Item -Recurse -Force node_modules\.prisma
   pnpm prisma:generate
   ```




