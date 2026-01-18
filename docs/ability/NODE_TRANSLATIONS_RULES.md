# ПРАВИЛА ПЕРЕВОДОВ НАЗВАНИЙ УЗЛОВ

## ⚠️ ВАЖНО: Единственный источник истины

**Файл:** `apps/web/src/lib/node-translations.ts`

Этот файл является **единственным источником истины** для всех переводов названий узлов в проекте.

## Правила использования

### 1. Всегда используйте централизованные функции

**НЕ создавайте локальные `nodeNameMap` или функции `translateNodeName` в других файлах!**

✅ **Правильно:**
```typescript
import { getNodeName, translateNodeName } from '@/lib/node-translations';

// Использование
const nodeName = getNodeName(nodeId, nodeDescriptions);
```

❌ **Неправильно:**
```typescript
// НЕ создавайте локальные маппинги!
const nodeNameMap: Record<string, string> = { ... };
function translateNodeName(name: string) { ... }
```

### 2. Приоритет получения названия узла

Функция `getNodeName()` использует следующий приоритет:

1. **Из `nodeDescriptions`** (если передан) - использует `translateNodeName` для перевода английского названия
2. **Из `NODE_NAME_MAP`** (статический маппинг по `node_id`)
3. **Fallback**: преобразование `node_id` в читаемый формат

### 3. Добавление новых узлов

При добавлении нового узла в систему:

1. Добавьте перевод в `NODE_NAME_MAP` в файле `node-translations.ts`:
   ```typescript
   'node_new_node_id': 'Русское название узла',
   ```

2. Если узел имеет английское название, которое нужно переводить, добавьте его в `NODE_NAME_TRANSLATIONS`:
   ```typescript
   'English Node Name': 'Русское название узла',
   ```

### 4. Изменение переводов

**ВСЕ изменения переводов должны производиться ТОЛЬКО в файле `node-translations.ts`!**

Не изменяйте переводы в других местах проекта.

## Структура файла переводов

### `NODE_NAME_MAP`
Маппинг `node_id` → русское название узла.

Пример:
```typescript
'node_difference_field': 'Поле различий',
'node_architecture_coupling': 'Архитектура сцепки',
```

### `NODE_NAME_TRANSLATIONS`
Маппинг английских названий узлов → русские названия.

Используется для перевода названий, которые приходят из API.

Пример:
```typescript
'REDE Model': 'REDE Модель',
'Shared Leadership': 'Распределённое лидерство',
```

### Функции

#### `translateNodeName(name: string): string`
Переводит английское название узла в русское.

#### `getNodeName(nodeId: string, nodeDescriptions?: Record<string, NodeDescription | { name: string }>): string`
Получает русское название узла по его `node_id` с учетом приоритетов.

## Проверка узлов из кейсов

Все узлы, используемые в `data/interactive-cases.json`, должны быть представлены в `NODE_NAME_MAP`.

Список узлов из кейсов (на момент создания документа):
- `node_architecture_coupling`
- `node_containment`
- `node_decision_authorship`
- `node_delegation_as_coupling`
- `node_difference_field`
- `node_distributed_leadership`
- `node_form_assembly`
- `node_institutionalization`
- `node_let_it_break`
- `node_organization_as_trainer`
- `node_responsibility_as_form`
- `node_responsibility_sag_diagnosis`
- `node_role_differentiation`
- `node_rule_creation`
- `node_scenario_breakdown`
- `node_scenario_thinking`
- `node_subject_in_system`
- `node_subjectivity_transfer`
- `node_system_thinking`
- `node_thinking_through_form`
- `node_upper_field_work`

## Файлы, использующие переводы узлов

Все следующие файлы должны использовать функции из `node-translations.ts`:

- `apps/web/src/app/experiments/page.tsx`
- `apps/web/src/app/cases/[id]/page.tsx`
- `apps/web/src/app/quests/page.tsx`
- `apps/web/src/app/quests/[id]/page.tsx`
- `apps/web/src/app/builds/page.tsx`
- `apps/web/src/app/traces/page.tsx`
- `apps/web/src/app/architecture/page.tsx`

## Контроль качества

При добавлении новых узлов или изменении переводов:

1. ✅ Проверьте, что все узлы из кейсов есть в `NODE_NAME_MAP`
2. ✅ Убедитесь, что нет дублирующихся переводов в других файлах
3. ✅ Проверьте, что все файлы используют функции из `node-translations.ts`
4. ✅ Запустите линтер и проверьте отсутствие ошибок типизации

## История изменений

- **2025-01-XX**: Создан централизованный файл переводов узлов
- **2025-01-XX**: Все файлы проекта обновлены для использования централизованных переводов
