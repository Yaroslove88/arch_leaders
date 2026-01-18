# Интеграция SVG иконок в веб-приложение

## ✅ Выполнено

### 1. Созданы все SVG иконки
Все 24 SVG иконки созданы и сохранены в `apps/web/public/icons/`:
- **Ветки (branches):** 6 иконок (включая subjectivity)
- **Квесты (quests):** 4 иконки
- **Кейсы (cases):** 1 иконка
- **Стили лидерства (builds):** 2 иконки
- **Действия (actions):** 3 иконки
- **UI иконки:** 7 иконок

### 2. Обновлен компонент Icon
**Файл:** `apps/web/src/components/icons/Icon.tsx`

**Изменения:**
- ✅ Добавлена поддержка всех типов иконок (UI, ветки, квесты, кейсы, стили, действия)
- ✅ Компонент использует SVG файлы из `public/icons/`
- ✅ Поддержка размеров: `sm`, `md`, `lg`
- ✅ Наследование `currentColor` для поддержки цветов дизайн-системы

**Использование:**
```tsx
import { Icon } from '@/components/icons/Icon';

// UI иконки
<Icon name="tree" size="md" className="text-system-focus" />
<Icon name="quest" size="lg" />

// Иконки веток
<Icon name="subjectivity" size="md" className="text-system-focus" />
<Icon name="architectural-thinking" />

// Иконки квестов
<Icon name="quest-default" />
<Icon name="quest-micro" />
```

### 3. Создана утилита для маппинга иконок
**Файл:** `apps/web/src/lib/icon-utils.ts`

**Функции:**
- `getBranchIcon(branchId)` - получить иконку ветки по ID
- `getQuestIcon(questType)` - получить иконку квеста по типу
- `getBuildIcon(buildId)` - получить иконку стиля лидерства
- `getCaseIcon()` - получить иконку кейса

**Использование:**
```tsx
import { getBranchIcon } from '@/lib/icon-utils';
import { Icon } from '@/components/icons/Icon';

const branchIcon = getBranchIcon('subjectivity');
if (branchIcon) {
  <Icon name={branchIcon} size="md" />
}
```

### 4. Обновлен BranchCard
**Файл:** `apps/web/src/components/cards/BranchCard.tsx`

**Изменения:**
- ✅ Автоматически использует SVG иконки для известных веток
- ✅ Fallback на эмодзи, если иконка не найдена
- ✅ Иконки наследуют цвет из дизайн-системы

---

## 📋 Список всех иконок

### UI иконки
- `tree` - Дерево способностей
- `quest` - Квест
- `case` - Кейс
- `situation` - Ситуация
- `trace` - След
- `streak` - Серия
- `achievement` - Достижение
- `level-up` - Уровень вырос

### Иконки веток
- `subjectivity` - Субъектность
- `architectural-thinking` - Архитектурное мышление
- `responsibility` - Ответственность
- `environment-maturity` - Среда зрелости
- `resilience` - Устойчивость
- `feedback` - Обратная связь

### Иконки квестов
- `quest-default` - Квест по умолчанию
- `quest-micro` - Микро-квест
- `quest-weekly` - Еженедельный квест
- `quest-story` - Стори-квест

### Иконки кейсов
- `case-default` - Кейс по умолчанию

### Иконки стилей лидерства
- `architect` - Архитектор систем
- `strategist` - Стратег

### Иконки действий
- `add-situation` - Добавить ситуацию
- `add-evidence` - Добавить след
- `reflection` - Рефлексия

---

## 🎨 Интеграция с дизайн-системой

### Цвета
Иконки используют `currentColor`, поэтому они автоматически наследуют цвет текста:

```tsx
// Синий акцент (system-focus)
<Icon name="tree" className="text-system-focus" />

// Зеленый рост (system-growth)
<Icon name="achievement" className="text-system-growth" />

// Желтое предупреждение (system-warning)
<Icon name="level-up" className="text-system-warning" />
```

### Размеры
- `sm` - 16px (w-4 h-4)
- `md` - 20px (w-5 h-5) - по умолчанию
- `lg` - 24px (w-6 h-6)

---

## 🔄 Следующие шаги

### Рекомендуется обновить:
1. **QuestCard** - использовать иконки квестов вместо эмодзи
2. **CaseCard** - использовать иконку кейса
3. **BuildCard** - использовать иконки стилей лидерства
4. **NodeCard** - можно добавить иконки для типов развития
5. **Другие компоненты** - заменить эмодзи на SVG иконки где возможно

### Пример обновления QuestCard:
```tsx
import { Icon } from '@/components/icons/Icon';
import { getQuestIcon } from '@/lib/icon-utils';

// В компоненте:
<Icon 
  name={getQuestIcon(quest.type)} 
  size="md" 
  className="text-system-focus"
/>
```

---

## 📝 Примечания

1. **SVG и currentColor:** Все SVG иконки используют `stroke="currentColor"`, поэтому они правильно наследуют цвет текста через CSS классы.

2. **Производительность:** Иконки загружаются как статические файлы из `public/`, что обеспечивает хорошую производительность.

3. **Доступность:** Все иконки имеют `aria-hidden="true"`, так как они декоративные. Если иконка несет смысловую нагрузку, добавьте `aria-label`.

4. **Fallback:** Если иконка не найдена, компонент возвращает `null` и выводит предупреждение в консоль.

---

**Последнее обновление:** 2025-01-09
