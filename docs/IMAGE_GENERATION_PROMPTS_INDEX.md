# Индекс документов с промптами для генерации изображений

> ⚠️ **ВАЖНО: Все промпты для генерации изображений теперь находятся в едином актуальном источнике:**
> 
> **[docs/design-system/IMAGE_GENERATION_PROMPTS.md](../design-system/IMAGE_GENERATION_PROMPTS.md)**
> 
> Все остальные документы устарели и находятся в архиве. Используйте только актуальную документацию!

**Дата последнего обновления:** 2025-01-27  
**Статус:** Актуальная

---

## 📋 Актуальные документы

### ⭐ **IMAGE_GENERATION_PROMPTS.md** (ЕДИНСТВЕННЫЙ АКТУАЛЬНЫЙ ИСТОЧНИК)
**Расположение:** `leadership-architect/docs/design-system/IMAGE_GENERATION_PROMPTS.md`

**Содержание:**
- **Философия визуального языка** (McKinsey-level intellect × psychological depth × architectural thinking)
- SYSTEM PROMPT (базовый стиль для всех изображений с философским контекстом)
- VISUAL STYLE MODIFIERS (философия, цвет и атмосфера под новую систему)
- Шаблоны промптов для всех элементов:
  - 🌳 **Ветки развития** (6 веток): subjectivity, architectural_thinking, resilience, responsibility, feedback, maturity_environment — **обновлены с философским контекстом**
  - 🧩 **Узлы / карточки развития** (общие шаблоны по типам: practice/reflection/theory/mixed)
  - 🏛 **Стили лидерства** (4 билда): crisis_solver, architect, developer, strategist — **обновлены с философским контекстом**
  - 🔒 **Заглушки** для недоступных квестов/кейсов
  - 🌳 **Дерево развития / карты пути**
  - 🧠 **Абстрактные системы мышления**
  - 🗺 **Карты, пространства, уровни**
- **📱 Использование смайликов и иконок в интерфейсе** (НОВОЕ):
  - Где уместно использовать смайлики (семантическая категоризация, статусы, структурные разделители)
  - Где неуместно использовать (заголовки страниц, CTA, основной текст, ошибки, формы)
  - Рекомендации по размеру, стилю, частоте
  - Промпты для генерации SVG-иконок (когда нужна иконка вместо смайлика)
  - Чеклист: смайлик vs иконка
- NEGATIVE PROMPT (рекомендуется всегда)
- Рекомендации по использованию (Midjourney, DALL-E, Stable Diffusion)
- Цветовая палитра проекта (актуальная система)

**Цветовая система:**
- Foundation: Obsidian Core (#0F1216), Graphite Structure (#1A1F26), Ash Light (#E6E8EB)
- Core Meaning: Strategic Blue (#1F3A5F), Inner Violet (#3B2F4A), Sage Green (#4E6F5D), Tension Red (#8C2F2F)
- Accent/Power: Catalyst Gold (#C6A75E), Warm Amber (#B8743A)

**Статус:** ✅ Актуальна (версия 2.1)
- ✅ Использует новую цветовую систему из UX_ARCHITECTURE copy.md
- ✅ Промпты обновлены с философским контекстом (элитарный интеллектуальный консалтинг, архитектурное мышление, психологическая глубина)
- ✅ Добавлена секция про использование смайликов и иконок в интерфейсе

---

## 📁 Архив (устаревшие документы)

### 1. **LEADERSHIP_STYLES_IMAGE_PROMPTS.md** (УСТАРЕЛ)
**Расположение:** `leadership-architect/docs/design-system/archive/LEADERSHIP_STYLES_IMAGE_PROMPTS.md`

**Статус:** ⚠️ Устарел (содержит старые цвета #0E1116, #0F1C2E, #3A6F8F и т.д.)

**Содержание:**
- Исторические промпты для 4 стилей лидерства
- Использовали старую цветовую систему

**Использование:** НЕ использовать. Промпты обновлены и включены в `IMAGE_GENERATION_PROMPTS.md`.

---

### 2. **EMOJI_IMAGE_PROMPTS.md** (УСТАРЕЛ)
**Расположение:** `leadership-architect/docs/design-system/archive/EMOJI_IMAGE_PROMPTS.md`

**Статус:** ⚠️ Устарел (содержит старые цвета)

**Содержание:**
- Исторические промпты для генерации изображений эмодзи
- Использовали старую цветовую систему

**Использование:** НЕ использовать. Промпты обновлены и включены в `IMAGE_GENERATION_PROMPTS.md`.

---

### 3. **DESIGN_ICONS_IMAGES.md**
**Расположение:** `leadership-architect/DESIGN_ICONS_IMAGES.md`

**Содержание:**
- Промпты для генерации SVG иконок всех категорий (функциональные элементы интерфейса)
- Иконки веток, квестов, кейсов, стилей лидерства, действий, UI элементов
- Философия иконок в контексте архитектурного лидерства
- Общие требования и процесс создания

**Статус:** ✅ Актуальна (обновлена с философией дизайна)
- ✅ Промпты обновлены с философским контекстом архитектурного лидерства
- ✅ Добавлена ссылка на IMAGE_GENERATION_PROMPTS.md
- ✅ Обновлены требования с учетом элитарного интеллектуального стиля
- ✅ SVG иконки созданы и сохранены в соответствующих папках

**Структура файлов:**
```
apps/web/public/icons/
├── branches/
│   ├── architectural-thinking.svg ✅
│   ├── responsibility.svg ✅
│   ├── environment-maturity.svg ✅
│   ├── resilience.svg ✅
│   ├── feedback.svg ✅
│   └── subjectivity.svg ⚠️ (промпт есть, SVG не сгенерирован)
├── quests/
│   ├── quest-default.svg ✅
│   ├── quest-micro.svg ✅
│   ├── quest-weekly.svg ✅
│   └── quest-story.svg ✅
├── cases/
│   └── case-default.svg ✅
├── builds/
│   ├── architect.svg ✅
│   └── strategist.svg ✅
├── actions/
│   ├── add-situation.svg ✅
│   ├── add-evidence.svg ✅
│   └── reflection.svg ✅
└── ui/
    ├── tree.svg ✅
    ├── quest.svg ✅
    ├── case.svg ✅
    ├── situation.svg ✅
    ├── trace.svg ✅
    ├── streak.svg ✅
    ├── achievement.svg ✅
    └── level-up.svg ✅
```

**Примечание:** Для новых промптов используйте шаблоны из `IMAGE_GENERATION_PROMPTS.md`.

---

## 📝 Рекомендации по использованию

### ⚠️ ВАЖНО: Используйте только актуальный источник

1. **Для всех изображений (ветки, узлы, билды, заглушки):**
   - Используйте промпты из `docs/design-system/IMAGE_GENERATION_PROMPTS.md`
   - Следуйте SYSTEM PROMPT и VISUAL STYLE MODIFIERS
   - Используйте актуальную цветовую систему

2. **Для SVG иконок:**
   - Использовать промпты из `DESIGN_ICONS_IMAGES.md` (если файл существует)
   - Или использовать шаблоны из `IMAGE_GENERATION_PROMPTS.md` (рекомендуется)
   - Генерировать через DALL-E или другие инструменты
   - Конвертировать в SVG, если получен другой формат
   - Оптимизировать с помощью SVGO

3. **Для всех изображений проекта:**
   - Всегда начинайте с SYSTEM PROMPT
   - Добавляйте VISUAL STYLE MODIFIERS
   - Используйте актуальные цвета из новой системы
   - Добавляйте NEGATIVE PROMPT
   - Следуйте рекомендациям для конкретного инструмента (Midjourney/DALL-E/Stable Diffusion)

---

## 🔗 Связанные документы

- **[UX_ARCHITECTURE copy.md](../design-system/UX_ARCHITECTURE%20copy.md)** — полная спецификация визуальной системы (ЕДИНСТВЕННЫЙ актуальный источник по цветам и стилям)
- **[DESIGN_ARCHITECTURE_CARDS_MODALS.md](../DESIGN_ARCHITECTURE_CARDS_MODALS.md)** — дизайн-документ (не содержит промптов для генерации)
- **[archive/DESIGN_SYSTEM_V01.md](../design-system/archive/DESIGN_SYSTEM_V01.md)** — устаревшая система дизайна (в архиве)

---

**Последнее обновление:** 2025-01-27 (добавлена философия дизайна и секция про смайлики/иконки)
