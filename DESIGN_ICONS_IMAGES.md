# Дизайн: Иконки и изображения

> ⚠️ **ВАЖНО:** Для генерации изображений (иллюстраций, карточек веток, стилей лидерства) используйте **[IMAGE_GENERATION_PROMPTS.md](./docs/design-system/IMAGE_GENERATION_PROMPTS.md)** — это единый источник промптов с полной философией дизайна.  
> Этот документ содержит промпты для генерации **SVG-иконок** (функциональные элементы интерфейса).

---

## Философия иконок

**Принцип:** Иконки в Leadership Architect — это не декоративные элементы, а семантические маркеры и функциональные навигационные элементы. Они должны передавать архитектурное мышление и интеллектуальную зрелость.

**Стиль:** Минималистичный, схематичный, архитектурный. Геометрические структуры, а не реалистичные объекты. Линейный (outline) стиль с тонкими линиями (2px). Цвет наследуется от родителя (currentColor).

**Контекст:** Все иконки создаются в контексте архитектурного лидерства, стратегического мышления, системного подхода. Они должны ощущаться как часть элитарного интеллектуального продукта уровня топ-консалтинга.

---

## Структура папок

```
apps/web/public/
├── icons/
│   ├── branches/              # Иконки веток
│   │   ├── subjectivity.svg
│   │   ├── architectural-thinking.svg
│   │   ├── responsibility.svg
│   │   ├── environment-maturity.svg
│   │   ├── resilience.svg
│   │   └── feedback.svg
│   ├── nodes/                 # Иконки узлов (по необходимости)
│   │   └── ...
│   ├── quests/                # Иконки квестов
│   │   ├── quest-default.svg
│   │   ├── quest-micro.svg
│   │   ├── quest-weekly.svg
│   │   └── quest-story.svg
│   ├── cases/                 # Иконки кейсов
│   │   ├── case-default.svg
│   │   └── case-difficulty-basic.svg
│   ├── builds/                # Иконки стилей лидерства
│   │   ├── architect.svg
│   │   ├── strategist.svg
│   │   └── ...
│   ├── actions/               # Иконки действий
│   │   ├── add-situation.svg
│   │   ├── add-evidence.svg
│   │   ├── reflection.svg
│   │   └── quick-actions.svg
│   └── ui/                    # UI иконки
│       ├── tree.svg
│       ├── quest.svg
│       ├── case.svg
│       ├── situation.svg
│       ├── trace.svg
│       ├── streak.svg
│       ├── achievement.svg
│       ├── level-up.svg
│       └── ...
└── images/
    ├── placeholders/          # Заглушки
    │   └── ...
    └── illustrations/         # Иллюстрации (если нужны)
        └── ...
```

---

## Иконки веток (Branches)

### Субъектность (Subjectivity)

**Файл:** `apps/web/public/icons/branches/subjectivity.svg`

**Промпт для генерации:**

```
Minimalist linear SVG icon in architectural leadership style, representing "Subjectivity" (Субъектность) — the ability to see and account for the inner world of others, their motives and limitations, the foundation of architectural leadership.

Style:
- Linear (outline), stroke width 2px, currentColor
- Size: 24x24 viewBox
- Minimalist, schematic, architectural
- Not realistic, not decorative, functional

Philosophical context: Subjectivity allows leaders to see systems through others' eyes. This is about understanding complexity, not simplification.

Visual idea: Two intersecting or layered geometric structures suggesting mutual understanding and connection. Alternative: Two geometric forms creating shared architectural space, or mirrored structures indicating reflection and depth. The structures should suggest "inner worlds" as architectural spaces, not abstract emotions.

NOT: People, faces, hearts, abstract emotions, decorative elements.
YES: Geometric structures, layers, connections, depth, architectural spaces.

Format: SVG, optimized for web, clean code, no decorative elements
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- two inner worlds / взаимопонимание -->
    <circle cx="10" cy="12" r="5"/>
    <circle cx="14" cy="12" r="5"/>
    <!-- shared focus (учёт мотивов/ограничений) -->
    <circle cx="12" cy="12" r="1.5"/>
  </g>
</svg>

---

### Архитектурное мышление (Architectural Thinking)

**Файл:** `apps/web/public/icons/branches/architectural-thinking.svg`

**Промпт:**

```
Minimalist linear SVG icon in architectural leadership style, representing "Architectural Thinking" (Архитектурное мышление) — ability to see systems as wholes, design structures and processes, think at the architectural level, not just operational.

Style:
- Linear (outline), stroke width 2px, currentColor
- Size: 24x24 viewBox
- Minimalist, schematic, architectural
- Not realistic, not decorative, functional

Philosophical context: Architectural thinking is the core of leadership as system design. This is about strategic intelligence and systematic depth, like a consultant's framework.

Visual idea: Blueprint-like structure with nodes and connections showing interconnections and dependencies. Alternative: Layered frameworks indicating multi-level thinking, or network graph indicating systemic thinking. The structure should suggest strategic intelligence, not just pretty patterns.

NOT: Buildings, construction tools, simple diagrams, decorative elements.
YES: Structural frameworks, interconnections, hierarchical systems, strategic blueprints, network intelligence.

Format: SVG, optimized for web, clean code, top-tier consulting aesthetic
```


<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- connections (system view) -->
    <path d="M12 5v5"/>
    <path d="M7 12h10"/>
    <path d="M7 12l-2 7"/>
    <path d="M17 12l2 7"/>

    <!-- nodes (key parts of structure) -->
    <rect x="10" y="2" width="4" height="4" rx="1"/>
    <rect x="5" y="10" width="4" height="4" rx="1"/>
    <rect x="15" y="10" width="4" height="4" rx="1"/>
    <rect x="3" y="19" width="4" height="4" rx="1"/>
    <rect x="17" y="19" width="4" height="4" rx="1"/>
  </g>
</svg>
---


### Ответственность (Responsibility)

**Файл:** `apps/web/public/icons/branches/responsibility.svg`

**Промпт:**

```
Minimalist linear SVG icon in architectural leadership style, representing "Responsibility" (Ответственность) — the ability to take responsibility for results and consequences of decisions, accountability as architectural choice, structural integrity in decision-making.

Style:
- Linear (outline), stroke width 2px, currentColor
- Size: 24x24 viewBox
- Minimalist, schematic, architectural
- Not realistic, not decorative, functional

Philosophical context: Responsibility in architectural leadership is about designing systems where accountability is built-in, where decisions have visible consequences. This is structural integrity, not moral obligation.

Visual idea: Balanced structures showing weight distribution and support systems. Decision frameworks as architectural choices. Accountability architecture suggesting that responsibility is a structural quality. Alternative: Structural forms showing balance and integrity, not shields or hands.

NOT: Shields, hands, human figures, moral symbols, decorative elements.
YES: Balanced structures, decision frameworks, accountability architecture, structural integrity.

Format: SVG, optimized for web, clean code, architectural aesthetic
```
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- shield -->
    <path d="M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3z"/>
    <!-- accountability mark (commitment / signature) -->
    <path d="M9.5 12.5l2 2 4-4"/>
  </g>
</svg>

---

### Среда зрелости (Environment Maturity)

**Файл:** `apps/web/public/icons/branches/environment-maturity.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для концепции "Среда зрелости" в контексте лидерства.

Концепция: способность создавать и поддерживать зрелую рабочую среду, где люди могут развиваться и действовать автономно.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: можно изобразить как дерево с ветками (рост), или как несколько фигур в круге (команда), или как структуру с уровнями (зрелость), или как экосистему с взаимосвязанными элементами. Альтернатива: лестница вверх, или слои/уровни.

Формат: SVG, оптимизированный для веба
```
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- canopy (supportive environment) -->
    <path d="M7 10c0-3 2.5-5 5-5s5 2 5 5"/>
    <!-- trunk (stability) -->
    <path d="M12 10v8"/>
    <!-- branches (growth + autonomy) -->
    <path d="M12 12l-3 3"/>
    <path d="M12 12l3 3"/>
    <!-- leaves / nodes (people thriving) -->
    <circle cx="9" cy="15" r="1.5"/>
    <circle cx="15" cy="15" r="1.5"/>
    <circle cx="12" cy="4" r="1.5"/>
  </g>
</svg>

---

### Устойчивость (Resilience)

**Файл:** `apps/web/public/icons/branches/resilience.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для концепции "Устойчивость" в контексте лидерства.

Концепция: способность системы выдерживать изменения и восстанавливаться после кризисов.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: можно изобразить как пружину или волну (упругость), или как структуру с опорами (устойчивость), или как круг с защитным контуром, или как якорь (стабильность). Альтернатива: стрела, изгибающаяся и возвращающаяся, или сеть с усиленными узлами.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- outer system boundary -->
    <circle cx="12" cy="12" r="9"/>
    <!-- resilience: bend + return loop (recovery) -->
    <path d="M7 13c1.5-3 4-4 6-4s4.5 1 6 4"/>
    <path d="M17 13l2-2"/>
    <path d="M17 13l2 2"/>
    <!-- strengthened core node -->
    <circle cx="12" cy="12" r="1.5"/>
  </g>
</svg>

---

### Обратная связь (Feedback)

**Файл:** `apps/web/public/icons/branches/feedback.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для концепции "Обратная связь" в контексте лидерства.

Концепция: способность создавать и использовать обратную связь для улучшения системы и процессов.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: можно изобразить как стрелки, образующие цикл (петля обратной связи), или как два элемента с двунаправленными стрелками, или как круг со стрелками по кругу, или как диалоговое облако со стрелками. Альтернатива: спираль, или два соединённых элемента.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- feedback loop (cycle) -->
    <path d="M16.5 8.5a6.5 6.5 0 0 0-10.3 2"/>
    <path d="M7 7v4H3"/>
    <path d="M7.5 15.5a6.5 6.5 0 0 0 10.3-2"/>
    <path d="M17 17v-4h4"/>
    <!-- core signal (improvement point) -->
    <circle cx="12" cy="12" r="1.5"/>
  </g>
</svg>

---

## Иконки квестов (Quests)

### Квест по умолчанию

**Файл:** `apps/web/public/icons/quests/quest-default.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для квеста (задания/миссии).

Концепция: квест — это эксперимент для практики навыков в реальной жизни.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: можно изобразить как меч или флаг цели, или как компас (направление), или как карту с маршрутом, или как цель с мишенью. Альтернатива: стрелка вверх с точкой (рост), или путь с точками (шаги).

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- route / steps -->
    <path d="M5 17c2-4 4-6 7-6s5 2 7 6"/>
    <circle cx="5" cy="17" r="1.5"/>
    <circle cx="12" cy="11" r="1.5"/>
    <!-- destination flag -->
    <path d="M19 7v9"/>
    <path d="M19 7h-5l1.2 2L14 11h5z"/>
  </g>
</svg>

---

### Микро-квест

**Файл:** `apps/web/public/icons/quests/quest-micro.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для микро-квеста (короткое задание).

Концепция: микро-квест — это быстрое задание, которое можно выполнить за один раз.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный
- Должен быть компактнее и проще, чем обычный квест

Идея: можно изобразить как маленький флаг, или как точку со стрелкой, или как короткий путь из двух точек, или как молнию (быстрота).

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- short path -->
    <path d="M7 16h6"/>
    <circle cx="7" cy="16" r="1.5"/>
    <circle cx="13" cy="16" r="1.5"/>
    <!-- small flag (quick goal) -->
    <path d="M16 8v9"/>
    <path d="M16 8h-3l1 1.5-1 1.5h3z"/>
  </g>
</svg>

---

### Еженедельный квест

**Файл:** `apps/web/public/icons/quests/quest-weekly.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для еженедельного квеста.

Концепция: еженедельный квест — это задание, которое выполняется в течение недели.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: можно изобразить как календарь с неделей (7 дней), или как путь с несколькими точками (неделя), или как круг с делениями (цикл недели), или как флаг с полосками (неделя).

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- calendar -->
    <rect x="4" y="5" width="16" height="16" rx="2"/>
    <path d="M8 3v4M16 3v4"/>
    <path d="M4 9h16"/>
    <!-- week (7 days) as 7 minimal ticks -->
    <path d="M7 12v2M9.5 12v2M12 12v2M14.5 12v2M17 12v2"/>
    <path d="M8.25 16v2M15.75 16v2"/>
  </g>
</svg>

---

### Стори-квест

**Файл:** `apps/web/public/icons/quests/quest-story.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для стори-квеста (историческое задание).

Концепция: стори-квест — это длинное задание с историей и развитием.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: можно изобразить как свиток или книгу, или как длинный путь с несколькими этапами, или как цепь событий, или как дерево с ветками (развитие истории).

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- story scroll -->
    <path d="M6 6c0-1.7 1.3-3 3-3h8c1.7 0 3 1.3 3 3v12c0 1.7-1.3 3-3 3H9c-1.7 0-3-1.3-3-3z"/>
    <path d="M6 6c0 1.7 1.3 3 3 3h11"/>
    <!-- narrative progression (chapters) -->
    <path d="M10 10h7"/>
    <path d="M10 13h6"/>
    <path d="M10 16h5"/>
  </g>
</svg>

---

## Иконки кейсов (Cases)

### Кейс по умолчанию

**Файл:** `apps/web/public/icons/cases/case-default.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для кейса (ситуации для анализа).

Концепция: кейс — это учебная ситуация, где нужно принять решение.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: можно изобразить как папку или документ, или как головоломку (проблема для решения), или как диалоговое облако (ситуация), или как схему с вариантами выбора. Альтернатива: квадрат с вопросительным знаком, или несколько вариантов с точками.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- document / case file -->
    <path d="M8 3h6l4 4v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
    <path d="M14 3v4h4"/>
    <!-- decision fork -->
    <path d="M12 10v3"/>
    <path d="M12 13l-3 3"/>
    <path d="M12 13l3 3"/>
    <circle cx="9" cy="16" r="1.5"/>
    <circle cx="15" cy="16" r="1.5"/>
  </g>
</svg>

---

## Иконки стилей лидерства (Builds)

### Архитектор систем

**Файл:** `apps/web/public/icons/builds/architect.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для стиля "Архитектор систем".

Концепция: лидер, который создаёт структуры, работающие без него.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: можно изобразить как структуру/архитектуру с блоками и связями, или как чертёж/план, или как сеть с узлами, или как здание с видимой структурой. Альтернатива: пазл с соединёнными частями, или схема с компонентами.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- blueprint frame -->
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <!-- system components -->
    <rect x="6" y="6" width="5" height="4" rx="1"/>
    <rect x="13" y="6" width="5" height="4" rx="1"/>
    <rect x="6" y="14" width="5" height="4" rx="1"/>
    <rect x="13" y="14" width="5" height="4" rx="1"/>
    <!-- connections (works without the leader) -->
    <path d="M11 8h2"/>
    <path d="M8.5 10v4"/>
    <path d="M15.5 10v4"/>
    <path d="M11 16h2"/>
    <!-- independent core (self-running) -->
    <circle cx="12" cy="12" r="1.5"/>
  </g>
</svg>


---

### Стратег

**Файл:** `apps/web/public/icons/builds/strategist.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для стиля "Стратег".

Концепция: лидер, который видит картину целиком и ведёт к цели.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: можно изобразить как компас или навигацию, или как карту с маршрутом, или как цель с мишенью, или как шахматную фигуру (стратегия). Альтернатива: стрела к цели, или путь с конечной точкой.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- compass / big picture -->
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>
    <!-- direction to goal -->
    <path d="M10 10l6-2-2 6-4-4z"/>
    <circle cx="16" cy="8" r="1.5"/>
  </g>
</svg>

---

## Иконки действий (Actions)

### Добавить ситуацию

**Файл:** `apps/web/public/icons/actions/add-situation.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для действия "Добавить ситуацию".

Концепция: добавление новой ситуации из жизни для анализа.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: можно изобразить как плюс с диалоговым облаком, или как документ с плюсом, или как блокнот с плюсом, или как речь/диалог с плюсом.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- situation bubble -->
    <path d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H11l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>
    <!-- add -->
    <path d="M17 9v6"/>
    <path d="M14 12h6"/>
  </g>
</svg>

---

### Добавить след

**Файл:** `apps/web/public/icons/actions/add-evidence.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для действия "Добавить след" (доказательство практики).

Концепция: фиксация результата практики, доказательство выполнения.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: можно изобразить как галочку в круге, или как след/отпечаток, или как документ с галочкой, или как отметку/чек. Альтернатива: глаз (наблюдение), или камера (фиксация).

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- proof / record -->
    <path d="M8 3h6l4 4v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
    <path d="M14 3v4h4"/>
    <!-- check mark (evidence of completion) -->
    <path d="M8.5 14.5l2 2 5-5"/>
    <!-- small "trace" dot -->
    <circle cx="8.5" cy="18.5" r="1"/>
  </g>
</svg>

---

### Рефлексия

**Файл:** `apps/web/public/icons/actions/reflection.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для действия "Рефлексия".

Концепция: размышление над опытом, осмысление.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: можно изобразить как зеркало, или как лампочку (инсайт), или как голову с мыслями, или как спираль (размышление). Альтернатива: круг с точкой (фокус), или облако мыслей.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- mirror frame -->
    <rect x="5" y="3" width="14" height="18" rx="2"/>
    <!-- inner reflection swirl -->
    <path d="M12 8c-2 0-3 1-3 2.5S10 13 12 13s3 1 3 2.5S14 18 12 18"/>
    <!-- focus point (insight) -->
    <circle cx="12" cy="8" r="1"/>
  </g>
</svg>

---

## UI иконки

### Дерево способностей

**Файл:** `apps/web/public/icons/ui/tree.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для "Дерево способностей".

Концепция: визуализация дерева навыков и способностей.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: простое дерево с ветками, абстрактное, не реалистичное. Можно изобразить как схематичное дерево с стволом и ветками, или как граф с узлами и связями.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- trunk -->
    <path d="M12 21v-7"/>
    <!-- main split -->
    <path d="M12 14l-4-4"/>
    <path d="M12 14l4-4"/>
    <!-- secondary branches -->
    <path d="M8 10l-2-2"/>
    <path d="M8 10l2-2"/>
    <path d="M16 10l-2-2"/>
    <path d="M16 10l2-2"/>
    <!-- nodes (skills) -->
    <circle cx="6" cy="8" r="1.5"/>
    <circle cx="10" cy="8" r="1.5"/>
    <circle cx="14" cy="8" r="1.5"/>
    <circle cx="18" cy="8" r="1.5"/>
    <circle cx="12" cy="21" r="1.5"/>
  </g>
</svg>

---

### Квест

**Файл:** `apps/web/public/icons/ui/quest.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для "Квест".

Концепция: задание для практики.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: меч или флаг цели, символ миссии. Можно изобразить как меч, или как флаг, или как компас, или как цель с мишенью.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- flag pole -->
    <path d="M6 3v18"/>
    <!-- flag -->
    <path d="M6 4h10l-2 3 2 3H6"/>
    <!-- mission path -->
    <path d="M10 16c2.5 0 4.5-1.5 6-4"/>
    <circle cx="10" cy="16" r="1.5"/>
    <!-- target point -->
    <circle cx="18" cy="12" r="1.5"/>
  </g>
</svg>

---

### Кейс

**Файл:** `apps/web/public/icons/ui/case.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для "Кейс".

Концепция: учебная ситуация для анализа.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: папка или документ с галочкой выбора. Можно изобразить как папку, или как документ, или как блокнот, или как схему с вариантами.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- folder -->
    <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
    <!-- decision / chosen option -->
    <path d="M9 14l2 2 4-4"/>
  </g>
</svg>

---

### Ситуация

**Файл:** `apps/web/public/icons/ui/situation.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для "Ситуация".

Концепция: описание ситуации из жизни.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: диалоговое облако или текстовый блок. Можно изобразить как облако речи, или как документ, или как блокнот, или как диалог.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- speech bubble -->
    <path d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H11l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>
    <!-- text lines -->
    <path d="M7.5 9.5h9"/>
    <path d="M7.5 12.5h6"/>
  </g>
</svg>

---

### След

**Файл:** `apps/web/public/icons/ui/trace.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для "След" (доказательство практики).

Концепция: фиксация результата практики.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: след или отпечаток, или глаз (наблюдение), или камера (фиксация). Можно изобразить как след, или как глаз, или как отметку, или как документ с галочкой.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- footprint / trace -->
    <path d="M10.5 20c-2.2 0-4-1.7-4-3.8 0-1.4.7-3.3 1.8-4.9C9.4 9.8 10.8 9 12 9s2.6.8 3.7 2.3c1.1 1.6 1.8 3.5 1.8 4.9 0 2.1-1.8 3.8-4 3.8h-3z"/>
    <!-- toes -->
    <circle cx="9" cy="8" r="1"/>
    <circle cx="11" cy="6.8" r="1"/>
    <circle cx="13" cy="6.8" r="1"/>
    <circle cx="15" cy="8" r="1"/>
  </g>
</svg>

---

### Серия

**Файл:** `apps/web/public/icons/ui/streak.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для "Серия" (streak).

Концепция: последовательность дней активности.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: огонь или молния, энергия. Можно изобразить как пламя, или как молнию, или как цепь/последовательность, или как стрелу вверх.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- flame (streak energy) -->
    <path d="M12 3c2.5 3 4.5 5.5 4.5 9A4.5 4.5 0 0 1 12 16.5 4.5 4.5 0 0 1 7.5 12c0-2.6 1.4-4.8 3.2-6.8"/>
    <!-- inner spark -->
    <path d="M12 9c1 1.2 1.8 2.4 1.8 3.6A1.8 1.8 0 0 1 12 14.4a1.8 1.8 0 0 1-1.8-1.8c0-1 .6-2 1.8-3.6z"/>
    <!-- day sequence mark -->
    <path d="M7 20h10"/>
    <circle cx="9" cy="20" r="1"/>
    <circle cx="12" cy="20" r="1"/>
    <circle cx="15" cy="20" r="1"/>
  </g>
</svg>

---

### Достижение

**Файл:** `apps/web/public/icons/ui/achievement.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для "Достижение".

Концепция: разблокированное достижение.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: звезда или медаль. Можно изобразить как звезду, или как медаль, или как трофей, или как щит с галочкой.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- medal -->
    <circle cx="12" cy="13" r="5"/>
    <path d="M9 3h3l-1 4h-3z"/>
    <path d="M12 3h3l2 4h-3z"/>
    <!-- achievement mark -->
    <path d="M10.2 13.2l1.4 1.4 3.2-3.2"/>
  </g>
</svg>

---

### Уровень вырос

**Файл:** `apps/web/public/icons/ui/level-up.svg`

**Промпт:**

```
Создай минималистичную линейную иконку SVG для "Уровень вырос".

Концепция: повышение уровня способности.

Стиль:
- Линейный (outline), толщина линии 2px
- Цвет: currentColor
- Размер: 24x24 viewBox
- Минималистичный, схематичный

Идея: стрела вверх или лестница, или график роста. Можно изобразить как стрелу вверх, или как лестницу, или как график, или как уровень с плюсом.

Формат: SVG, оптимизированный для веба
```

<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- growth chart -->
    <path d="M4 19V5"/>
    <path d="M4 19h16"/>
    <path d="M7 15l4-4 3 3 5-6"/>
    <!-- arrow head -->
    <path d="M19 8v2h-2"/>
  </g>
</svg>

---

## Общие требования ко всем иконкам

1. **Формат:** SVG
2. **Стиль:** Линейный (outline), без заливки, архитектурный минимализм
3. **Толщина линии:** 2px (единообразно для всех иконок)
4. **Цвет:** `currentColor` (наследуется от родителя, не хардкодим цвета)
5. **Размер:** 24x24 viewBox (стандартный размер для интерфейса)
6. **Философия:** Архитектурное мышление, структурная интеллектуальность, не декоративность
7. **Оптимизация:** Минимизированный SVG, без лишних элементов, чистый код
8. **Доступность:** Все иконки должны иметь `aria-label` при использовании (указывается в компоненте, не в SVG)
9. **Консистентность:** Единый стиль для всех иконок в проекте — архитектурный минимализм уровня топ-консалтинга

**Философские принципы:**
- Иконка передаёт концепцию через архитектурную метафору, не через реалистичный объект
- Геометрические структуры, системы, связи — не предметы
- Минимализм как выражение интеллектуальной зрелости
- Функциональность важнее декоративности

---

## Процесс создания иконок

1. **Философский контекст:** Определить концепцию в контексте архитектурного лидерства (см. описание веток/узлов)
2. **Генерация:** Использовать промпты выше с философским контекстом. Для сложных концепций можно использовать DALL-E для референсов, но финальная иконка должна быть SVG
3. **Обработка:** Конвертировать в SVG, если получен другой формат. Использовать векторный редактор (Figma, Illustrator) для финальной обработки
4. **Оптимизация:** Минимизировать SVG с помощью SVGO или аналогичных инструментов. Удалить все декоративные элементы
5. **Проверка:** Убедиться, что иконка читается на 16px и 24px, сохраняет архитектурный стиль, передаёт концепцию
6. **Тестирование:** Проверить на разных фонах (obsidian, graphite) и в разных размерах. Убедиться, что цвет наследуется корректно
7. **Документирование:** Добавить описание иконки и промпт в этот документ

**Важно:** Если концепция сложная и требует иллюстрации (например, карточка ветки или стиль лидерства), используйте промпты из [IMAGE_GENERATION_PROMPTS.md](./docs/design-system/IMAGE_GENERATION_PROMPTS.md). Этот документ только для функциональных SVG-иконок интерфейса.

---

## Использование в коде

```tsx
// Пример использования иконки
import Image from 'next/image';

<Image
  src="/icons/branches/subjectivity.svg"
  alt="Субъектность"
  width={24}
  height={24}
  className="text-system-focus"
/>
```

Или через компонент Icon:

```tsx
import { Icon } from '@/components/Icon';

<Icon name="subjectivity" size="md" className="text-system-focus" />
```

---

*Документ создан для систематизации создания иконок и изображений в проекте Leadership Architect*
