# Testing Guide

## Структура тестов

Проект использует Jest для тестирования. Тесты организованы по типам:

### Unit Tests (`*.spec.ts`)
- **Location**: рядом с исходными файлами
- **Purpose**: тестирование отдельных компонентов в изоляции
- **Examples**:
  - `ability-engine.service.spec.ts` - тесты для AbilityEngine
  - `quest-engine.service.spec.ts` - тесты для QuestEngine
  - `pipeline.service.spec.ts` - тесты для PipelineService с моками

### Integration Tests (`integration/*.spec.ts`)
- **Location**: `src/integration/`
- **Purpose**: тестирование взаимодействия между компонентами
- **Examples**:
  - `pipeline.integration.spec.ts` - полный flow pipeline

### Scenario Tests (`scenarios/*.spec.ts`)
- **Location**: `src/scenarios/`
- **Purpose**: end-to-end сценарии использования
- **Examples**:
  - `entry-analysis.scenario.spec.ts` - сценарий анализа записи

## Запуск тестов

```bash
# Все тесты
pnpm test

# В режиме watch
pnpm test:watch

# С покрытием
pnpm test:cov

# Конкретный файл
pnpm test ability-engine.service.spec
```

## Написание тестов

### Unit Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AbilityEngine } from './ability-engine.service';

describe('AbilityEngine', () => {
  let engine: AbilityEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbilityEngine],
    }).compile();

    engine = module.get<AbilityEngine>(AbilityEngine);
  });

  it('should compute state changes', () => {
    const result = engine.computeNext(input);
    expect(result.changes.length).toBeGreaterThan(0);
  });
});
```

### Mocking Dependencies

```typescript
const mockPrisma = {
  entry: {
    findUnique: jest.fn(),
  },
};

const module: TestingModule = await Test.createTestingModule({
  providers: [
    Service,
    {
      provide: PrismaService,
      useValue: mockPrisma,
    },
  ],
}).compile();
```

## Покрытие кода

Целевое покрытие:
- **Unit tests**: 80%+ для детерминированных компонентов (AbilityEngine, QuestEngine)
- **Integration tests**: основные сценарии использования
- **Scenario tests**: критичные user flows

## Best Practices

1. **Детерминированные компоненты** (AbilityEngine, QuestEngine) должны иметь полное покрытие unit тестами
2. **Сервисы с зависимостями** тестируются с моками
3. **Integration тесты** требуют настройки test database
4. **Scenario тесты** должны быть независимыми и очищать данные после выполнения

## Test Database

Для integration и scenario тестов требуется отдельная test database:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/leadership_architect_test"
```

## TODO

- [ ] Настроить test database для integration тестов
- [ ] Добавить тесты для QuestGenerationService
- [ ] Добавить тесты для AbilityStateService
- [ ] Добавить тесты для JobsService
- [ ] Настроить CI/CD для автоматического запуска тестов

