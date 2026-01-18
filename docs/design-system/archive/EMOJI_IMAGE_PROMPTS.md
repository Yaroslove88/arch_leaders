# Промпты для генерации изображений эмодзи

> Документ содержит промпты для генерации изображений всех эмодзи, используемых в проекте "Архитектор лидерства"

---

## 🎨 Общий стиль изображений

**Базовая эстетика:**
- Architectural Dark Mode — тёмная, минималистичная, структурная
- Цветовая палитра: Deep Graphite (#0E1116), Architectural Blue (#0F1C2E), Structural Cyan (#3A6F8F)
- Стиль: геометрический, абстрактный, архитектурный
- Формат: иконки/логотипы, не иллюстрации
- Линии: тонкие, структурные
- Композиция: центрированная, сбалансированная

**Технические требования:**
- Размер: 512x512px или 1024x1024px
- Формат: PNG с прозрачным фоном или SVG
- Стиль: плоский, минималистичный, структурный
- Цвета: использовать палитру проекта или градиенты

---

## 📝 Статусы квестов

### 🟡 Backlog (Отложен)

**Промпт:**
```
Minimalist icon: yellow circle with subtle pause symbol or clock icon inside. 
Architectural Dark Mode style: dark background (#0E1116), yellow accent (#F2A03D). 
Geometric, structural design. Thin lines. No shadows. Flat design. 
Icon should convey "waiting" or "pending" state in architectural leadership context.
512x512px, transparent background,  SVG.
```

**Альтернативный вариант:**
```
Simple geometric icon: yellow circular badge with subtle dot pattern or grid inside.
Dark architectural style (#0E1116 background), yellow #F2A03D foreground.
Represents "backlog" or "pending" state. Minimalist, structural design.
Transparent background, 512x512px,  SVG format.
```

<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none" aria-hidden="true">
  <!-- Transparent background (intended for dark UI) -->
  <g stroke-linecap="round" stroke-linejoin="round">
    <!-- Accent ring -->
    <circle cx="256" cy="256" r="176" stroke="#F2A03D" stroke-width="20"/>

    <!-- Inner "pending" clock -->
    <circle cx="256" cy="256" r="86" stroke="#3A6F8F" stroke-width="16"/>
    <path d="M256 154v18" stroke="#3A6F8F" stroke-width="16"/>

    <!-- Pause symbol inside (waiting) -->
    <path d="M238 220v72" stroke="#3A6F8F" stroke-width="16"/>
    <path d="M274 220v72" stroke="#3A6F8F" stroke-width="16"/>
  </g>
</svg>


---

### 🟢 Active (Активный)

**Промпт:**
```
Minimalist icon: green circle with subtle play symbol or upward arrow inside.
Architectural Dark Mode style: dark background (#0E1116), green accent (#5FA38D).
Geometric, structural design. Thin lines. No shadows. Flat design.
Icon should convey "active" or "in progress" state in architectural leadership context.
512x512px, transparent background,  SVG.
```

**Альтернативный вариант:**
```
Simple geometric icon: green circular badge with subtle wave pattern or pulse inside.
Dark architectural style (#0E1116 background), green #5FA38D foreground.
Represents "active" or "in progress" state. Minimalist, structural design.
Transparent background, 512x512px,  SVG format.
```

<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none" aria-hidden="true">
  <!-- transparent background -->
  <g stroke="#5FA38D" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    
    <!-- structural outer circle -->
    <circle cx="256" cy="256" r="180"/>

    <!-- inner architectural ring -->
    <circle cx="256" cy="256" r="120" opacity="0.6"/>

    <!-- active / progress arrow -->
    <path d="M236 198l80 58-80 58z"/>

    <!-- subtle growth axis -->
    <path d="M256 140v40" opacity="0.6"/>
    
  </g>
</svg>

---

### ⚪ Done (Завершён)

**Промпт:**
```
Minimalist icon: white/gray circle with subtle checkmark or completion symbol inside.
Architectural Dark Mode style: dark background (#0E1116), light gray accent (#9AA4B2).
Geometric, structural design. Thin lines. No shadows. Flat design.
Icon should convey "completed" or "done" state in architectural leadership context.
512x512px, transparent background,  SVG.
```

**Альтернативный вариант:**
```
Simple geometric icon: white/gray circular badge with subtle checkmark pattern inside.
Dark architectural style (#0E1116 background), light gray #9AA4B2 foreground.
Represents "done" or "completed" state. Minimalist, structural design.
Transparent background, 512x512px,  SVG format.
```

<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none" aria-hidden="true">
  <!-- transparent background -->
  <g stroke="#9AA4B2" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <!-- structural outer circle -->
    <circle cx="256" cy="256" r="180"/>
    <!-- subtle inner ring (architectural / system completeness) -->
    <circle cx="256" cy="256" r="120" opacity="0.6"/>
    <!-- completion check -->
    <path d="M188 262l44 44 92-104"/>
  </g>
</svg>

---

### ⚫ Archived (Архивирован)

**Промпт:**
```
Minimalist icon: dark gray/black circle with subtle archive box or folder symbol inside.
Architectural Dark Mode style: dark background (#0E1116), dark gray accent (#6C7684).
Geometric, structural design. Thin lines. No shadows. Flat design.
Icon should convey "archived" or "stored" state in architectural leadership context.
512x512px, transparent background,  SVG.
```

**Альтернативный вариант:**
```
Simple geometric icon: dark gray circular badge with subtle box or folder pattern inside.
Dark architectural style (#0E1116 background), dark gray #6C7684 foreground.
Represents "archived" or "stored" state. Minimalist, structural design.
Transparent background, 512x512px,  SVG format.
```

<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none" aria-hidden="true">
  <!-- transparent background -->
  <g stroke="#6C7684" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <!-- outer container circle -->
    <circle cx="256" cy="256" r="180"/>

    <!-- subtle inner ring (structure / stored state) -->
    <circle cx="256" cy="256" r="120" opacity="0.55"/>

    <!-- archive box -->
    <rect x="176" y="212" width="160" height="116" rx="18"/>
    <path d="M196 212l22-28h76l22 28"/>
    <path d="M226 260h60" opacity="0.7"/>
  </g>
</svg>


---

## 🌳 Инструменты и элементы системы

### 📝 Ситуации / Записи

**Промпт:**
```
Minimalist icon: document or note paper with subtle lines or text pattern.
Architectural Dark Mode style: dark background (#0E1116), cyan accent (#3A6F8F).
Geometric, structural design. Thin lines representing text or structure.
Icon should convey "situations" or "entries" in architectural leadership context.
512x512px, transparent background,  SVG.
```

**Альтернативный вариант:**
```
Simple geometric icon: stylized document with architectural grid pattern inside.
Dark architectural style (#0E1116 background), structural cyan #3A6F8F foreground.
Represents "situations" or "entries". Minimalist, structural design.
Transparent background, 512x512px,  SVG format.
```

<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none" aria-hidden="true">
  <!-- transparent background -->
  <g stroke="#3A6F8F" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <!-- outer container circle -->
    <circle cx="256" cy="256" r="180"/>

    <!-- document -->
    <path d="M210 156h120l52 52v148a24 24 0 0 1-24 24H210a24 24 0 0 1-24-24V180a24 24 0 0 1 24-24z"/>
    <path d="M330 156v52h52"/>

    <!-- subtle text/structure lines -->
    <path d="M224 244h144" opacity="0.8"/>
    <path d="M224 284h132" opacity="0.7"/>
    <path d="M224 324h108" opacity="0.6"/>

    <!-- small structural marker (entry bullet) -->
    <circle cx="224" cy="214" r="6"/>
  </g>
</svg>

---

### 🎮 Квесты

**Промпт:**
```
Minimalist icon: game controller or quest badge with geometric pattern inside.
Architectural Dark Mode style: dark background (#0E1116), cyan accent (#3A6F8F).
Geometric, structural design. Thin lines forming quest badge or target symbol.
Icon should convey "quests" or "experiments" in architectural leadership context.
512x512px, transparent background,  SVG.
```

**Альтернативный вариант:**
```
Simple geometric icon: stylized quest badge or target with architectural grid pattern.
Dark architectural style (#0E1116 background), structural cyan #3A6F8F foreground.
Represents "quests" or "experiments". Minimalist, structural design.
Transparent background, 512x512px,  SVG format.
```

<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none" aria-hidden="true">
  <!-- transparent background -->
  <g stroke="#3A6F8F" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <!-- outer circle container -->
    <circle cx="256" cy="256" r="180"/>

    <!-- quest badge (shield-like, geometric) -->
    <path d="M256 152l110 48v82c0 78-55 120-110 134-55-14-110-56-110-134v-82l110-48z"/>

    <!-- target (experiment focus) -->
    <circle cx="256" cy="260" r="52" opacity="0.75"/>
    <circle cx="256" cy="260" r="18"/>

    <!-- subtle direction / progress mark -->
    <path d="M256 208v-22" opacity="0.65"/>
    <path d="M246 198h20" opacity="0.65"/>
  </g>
</svg>

---

### 📊 Кейсы

**Промпт:**
```
Minimalist icon: chart or diagram with geometric grid pattern inside.
Architectural Dark Mode style: dark background (#0E1116), cyan accent (#3A6F8F).
Geometric, structural design. Thin lines forming chart bars or grid structure.
Icon should convey "cases" or "interactive situations" in architectural leadership context.
512x512px, transparent background,  SVG.
```

**Альтернативный вариант:**
```
Simple geometric icon: stylized chart or diagram with architectural grid pattern.
Dark architectural style (#0E1116 background), structural cyan #3A6F8F foreground.
Represents "cases" or "interactive situations". Minimalist, structural design.
Transparent background, 512x512px,  SVG format.
```

<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none" aria-hidden="true">
  <!-- transparent background -->
  <g stroke="#3A6F8F" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <!-- outer circle container -->
    <circle cx="256" cy="256" r="180"/>

    <!-- chart frame -->
    <rect x="168" y="176" width="176" height="176" rx="20"/>

    <!-- grid (structural) -->
    <path d="M168 234h176" opacity="0.55"/>
    <path d="M168 292h176" opacity="0.55"/>
    <path d="M226 176v176" opacity="0.45"/>
    <path d="M284 176v176" opacity="0.45"/>

    <!-- bars (case options / interactive paths) -->
    <path d="M206 320v-52"/>
    <path d="M256 320v-92"/>
    <path d="M306 320v-68"/>

    <!-- decision node marker -->
    <circle cx="256" cy="228" r="10"/>
  </g>
</svg>

---

### 🌳 Дерево способностей

**Промпт:**
```
Minimalist icon: tree structure or node graph with geometric branches and nodes.
Architectural Dark Mode style: dark background (#0E1116), teal accent (#2F8C8C).
Geometric, structural design. Thin lines forming tree-like or network structure.
Icon should convey "ability tree" or "progress visualization" in architectural leadership context.
512x512px, transparent background,  SVG.
```

**Альтернативный вариант:**
```
Simple geometric icon: stylized tree or network graph with architectural nodes.
Dark architectural style (#0E1116 background), muted teal #2F8C8C foreground.
Represents "ability tree" or "progress". Minimalist, structural design.
Transparent background, 512x512px,  SVG format.
```

<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none" aria-hidden="true">
  <!-- transparent background -->
  <g stroke="#2F8C8C" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <!-- outer circle container -->
    <circle cx="256" cy="256" r="180"/>

    <!-- trunk -->
    <path d="M256 356v-76"/>

    <!-- main branches -->
    <path d="M256 280l-78-78"/>
    <path d="M256 280l78-78"/>

    <!-- secondary branches -->
    <path d="M178 202l-44-44"/>
    <path d="M178 202l44-44"/>
    <path d="M334 202l-44-44"/>
    <path d="M334 202l44-44"/>

    <!-- nodes (skills) -->
    <circle cx="134" cy="158" r="12"/>
    <circle cx="222" cy="158" r="12"/>
    <circle cx="290" cy="158" r="12"/>
    <circle cx="378" cy="158" r="12"/>
    <circle cx="256" cy="356" r="12"/>

    <!-- progress core -->
    <circle cx="256" cy="280" r="10" opacity="0.7"/>
  </g>
</svg>

---

### 🧪 Эксперименты

**Промпт:**
```
Minimalist icon: flask or test tube with geometric structure inside.
Architectural Dark Mode style: dark background (#0E1116), cyan accent (#3A6F8F).
Geometric, structural design. Thin lines forming flask or experiment symbol.
Icon should convey "experiments" or "testing" in architectural leadership context.
512x512px, transparent background,  SVG.
```

**Альтернативный вариант:**
```
Simple geometric icon: stylized flask or experiment symbol with architectural pattern.
Dark architectural style (#0E1116 background), structural cyan #3A6F8F foreground.
Represents "experiments" or "testing". Minimalist, structural design.
Transparent background, 512x512px,  SVG format.
```

<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none" aria-hidden="true">
  <!-- transparent background -->
  <g stroke="#3A6F8F" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <!-- outer circle container -->
    <circle cx="256" cy="256" r="180"/>

    <!-- flask / test tube hybrid (structural, geometric) -->
    <path d="M228 156h56"/>
    <path d="M244 156v96l-72 124a34 34 0 0 0 30 52h108a34 34 0 0 0 30-52l-72-124v-96"/>

    <!-- liquid level (experiment in progress) -->
    <path d="M208 330h96" opacity="0.65"/>

    <!-- inner geometric structure (testing / system) -->
    <circle cx="236" cy="304" r="10"/>
    <circle cx="276" cy="288" r="10" opacity="0.85"/>
    <path d="M236 304l40-16" opacity="0.8"/>
  </g>
</svg>

---

### 🔍 Следы

**Промпт:**
```
Minimalist icon: magnifying glass or search symbol with geometric pattern inside.
Architectural Dark Mode style: dark background (#0E1116), cyan accent (#3A6F8F).
Geometric, structural design. Thin lines forming magnifying glass or trace pattern.
Icon should convey "traces" or "tracking" in architectural leadership context.
512x512px, transparent background,  SVG.
```

**Альтернативный вариант:**
```
Simple geometric icon: stylized magnifying glass or trace symbol with architectural pattern.
Dark architectural style (#0E1116 background), structural cyan #3A6F8F foreground.
Represents "traces" or "tracking". Minimalist, structural design.
Transparent background, 512x512px,  SVG format.
```

<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none" aria-hidden="true">
  <!-- transparent background -->
  <g stroke="#3A6F8F" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <!-- outer circle container -->
    <circle cx="256" cy="256" r="180"/>

    <!-- magnifying glass -->
    <circle cx="236" cy="236" r="76"/>
    <path d="M292 292l64 64"/>

    <!-- geometric trace pattern (tracking) -->
    <path d="M206 236h60" opacity="0.65"/>
    <path d="M236 206v60" opacity="0.65"/>
    <circle cx="214" cy="258" r="8"/>
    <circle cx="258" cy="214" r="8" opacity="0.85"/>
    <path d="M214 258l44-44" opacity="0.75"/>
  </g>
</svg>

---

### 🤖 Анализ (AI)

**Промпт:**
```
Minimalist icon: brain or AI symbol with geometric neural network pattern inside.
Architectural Dark Mode style: dark background (#0E1116), cyan accent (#3A6F8F).
Geometric, structural design. Thin lines forming neural network or brain structure.
Icon should convey "AI analysis" or "automated processing" in architectural leadership context.
512x512px, transparent background,  SVG.
```

**Альтернативный вариант:**
```
Simple geometric icon: stylized brain or AI symbol with architectural neural pattern.
Dark architectural style (#0E1116 background), structural cyan #3A6F8F foreground.
Represents "AI analysis" or "automated processing". Minimalist, structural design.
Transparent background, 512x512px,  SVG format.
```

<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none" aria-hidden="true">
  <!-- transparent background -->
  <g stroke="#3A6F8F" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <!-- outer circle container -->
    <circle cx="256" cy="256" r="180"/>

    <!-- abstract brain outline (geometric, not realistic) -->
    <path d="M214 192c-28 6-46 30-46 60 0 20 9 38 24 50-6 28 14 54 42 58 10 22 34 36 60 30"/>
    <path d="M298 192c28 6 46 30 46 60 0 20-9 38-24 50 6 28-14 54-42 58-10 22-34 36-60 30"/>

    <!-- neural network inside -->
    <circle cx="216" cy="260" r="10"/>
    <circle cx="256" cy="232" r="10"/>
    <circle cx="296" cy="260" r="10"/>
    <circle cx="240" cy="308" r="10" opacity="0.85"/>
    <circle cx="272" cy="308" r="10" opacity="0.85"/>

    <path d="M216 260l40-28"/>
    <path d="M296 260l-40-28"/>
    <path d="M216 260l24 48" opacity="0.8"/>
    <path d="M296 260l-24 48" opacity="0.8"/>
    <path d="M240 308h32" opacity="0.75"/>

    <!-- subtle "automation" tick -->
    <path d="M256 176v22" opacity="0.55"/>
  </g>
</svg>

---

### 💼 Практика

**Промпт:**
```
Minimalist icon: briefcase or work symbol with geometric structure inside.
Architectural Dark Mode style: dark background (#0E1116), cyan accent (#3A6F8F).
Geometric, structural design. Thin lines forming briefcase or professional symbol.
Icon should convey "practice" or "real-world application" in architectural leadership context.
512x512px, transparent background,  SVG.
```

**Альтернативный вариант:**
```
Simple geometric icon: stylized briefcase or work symbol with architectural pattern.
Dark architectural style (#0E1116 background), structural cyan #3A6F8F foreground.
Represents "practice" or "real-world application". Minimalist, structural design.
Transparent background, 512x512px,  SVG format.
```

<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none" aria-hidden="true">
  <!-- transparent background -->
  <g stroke="#3A6F8F" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <!-- outer circle container -->
    <circle cx="256" cy="256" r="180"/>

    <!-- briefcase -->
    <rect x="164" y="212" width="184" height="140" rx="22"/>
    <path d="M212 212v-26a20 20 0 0 1 20-20h48a20 20 0 0 1 20 20v26"/>

    <!-- handle detail -->
    <path d="M236 246h40" opacity="0.7"/>

    <!-- inner geometric structure (real-world application / system) -->
    <circle cx="214" cy="292" r="10"/>
    <circle cx="298" cy="276" r="10" opacity="0.85"/>
    <circle cx="266" cy="316" r="10" opacity="0.85"/>
    <path d="M214 292l84-16" opacity="0.8"/>
    <path d="M298 276l-32 40" opacity="0.8"/>
    <path d="M214 292l52 24" opacity="0.7"/>
  </g>
</svg>

---

---

## 📋 Использование промптов

### Для Midjourney / DALL-E / Stable Diffusion

1. Используйте базовый промпт для нужного эмодзи
2. Добавьте параметры стиля:
   - `--style architectural`
   - `--style minimalist`
   - `--style geometric`
3. Укажите цветовую палитру в промпте
4. Задайте размер: `--size 512x512` или `1024x1024`

### Для Figma / Illustrator

1. Создайте базовую форму (круг, квадрат, иконка)
2. Примените цветовую палитру проекта
3. Используйте тонкие линии (1-2px)
4. Добавьте геометрический паттерн внутри
5. Экспортируйте как PNG (512x512) или SVG

### Для AI генерации (Midjourney пример)

```
/imagine prompt: Minimalist icon: yellow circle with subtle pause symbol inside. Architectural Dark Mode style: dark background #0E1116, yellow accent #F2A03D. Geometric, structural design. Thin lines. No shadows. Flat design. 512x512px, transparent background --style architectural --style minimalist --v 6
```

---

## 🎨 Цветовая палитра для референса

**Базовая палитра:**
- Deep Graphite: `#0E1116`
- Architectural Blue: `#0F1C2E`
- Cold Concrete: `#1A2433`

**Рабочие цвета:**
- Structural Cyan: `#3A6F8F`
- Muted Teal: `#2F8C8C`
- Steel Gray: `#8A93A1`

**Акценты:**
- Tension Amber: `#F2A03D` (Backlog, Устойчивость)
- Subject Red: `#C14949` (Субъектность)
- Emergence Green: `#5FA38D` (Active, Среда зрелости)

**Текстовые:**
- UI Text Main: `#E6E9EF`
- UI Text Muted: `#9AA4B2`
- UI Text Dim: `#6C7684`

---

**Последнее обновление:** 2025-01-27
