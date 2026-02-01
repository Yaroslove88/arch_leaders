---
name: tdd
description: Создание тестов по TDD методологии
---

# /tdd — Test-Driven Development

Создай тесты для указанного модуля по TDD методологии.

## TDD Workflow

```
RED → GREEN → REFACTOR
```

1. **RED**: Напиши failing test
2. **GREEN**: Напиши минимальный код
3. **REFACTOR**: Улучши код

## Входные данные

Укажи:
1. **Файл/модуль** для тестирования
2. **Методы** которые нужно покрыть
3. **Особенности** (auth, validation, errors)

## Test Templates

### Service (NestJS)
```typescript
describe('ServiceName', () => {
  // setup with mockPrisma
  
  it('should filter by userId', async () => {
    // Arrange, Act, Assert
  });
  
  it('should throw NotFoundException', async () => {
    // test error handling
  });
});
```

### Controller (NestJS)
```typescript
describe('ControllerName', () => {
  // setup with mockService
  
  it('should extract userId from JWT', async () => {
    // test auth integration
  });
});
```

### Component (React)
```typescript
describe('ComponentName', () => {
  it('renders correctly', () => {
    // render and assert
  });
  
  it('handles loading state', () => {
    // test loading
  });
});
```

## Coverage Target

- General: **80%**
- Critical paths: **95%**

## Output

```markdown
## Tests for [Module]

### Test File
`path/to/module.spec.ts`

### Test Cases
1. [test case 1]
2. [test case 2]

### Code
```typescript
[test code]
```

### Run
```bash
pnpm test -- path/to/module.spec.ts
```
```

## Пример использования

```
/tdd

Создай тесты для apps/api/src/quests/quests.service.ts:
- getQuests(userId)
- createQuest(userId, data)
- updateQuest(id, userId, data)
- deleteQuest(id, userId)
```
