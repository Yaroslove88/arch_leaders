# Визуализация архитектуры: Текущая vs Правильная

**Дата создания:** 2025-01-27  
**Статус:** Этап 1 - Аудит и документация

---

## 1. Текущая архитектура (с проблемами)

### 1.1. Диаграмма потоков данных - Nodes

```mermaid
graph TB
    subgraph Sources["Источники данных"]
        Seed["initial-ability-tree.json<br/>Структура + Контент"]
        NodeDesc["node-descriptions.json<br/>Контент"]
        UserState["UserAbilityState<br/>Пользовательские данные"]
    end
    
    subgraph Storage["Хранилища (БД)"]
        TreeSem["TreeSemantic.data<br/>❌ СМЕШАНО:<br/>Структура + Контент +<br/>Пользовательские данные"]
        AbilityNode["AbilityNode<br/>❌ ДУБЛИРОВАНИЕ:<br/>Контент"]
    end
    
    subgraph Services["Сервисы"]
        TreeService["tree.service.ts<br/>❌ Перезаписывает всё"]
    end
    
    subgraph Frontend["Фронтенд"]
        WebApp["Web App<br/>Отображает данные"]
        Translations["node-translations.ts<br/>Fallback переводы"]
    end
    
    Seed -->|"onModuleInit()"| TreeService
    Seed -->|"checkAndMigrateSeedVersion()"| TreeService
    TreeService -->|"Перезаписывает ВСЁ"| TreeSem
    TreeService -->|"Заполняет при первом запуске"| AbilityNode
    NodeDesc -->|"Читает отдельно"| WebApp
    UserState -->|"Обогащает после перезаписи"| TreeService
    TreeSem -->|"getSemantic()"| WebApp
    AbilityNode -->|"Быстрый доступ"| WebApp
    Translations -->|"Fallback"| WebApp
    
    style TreeSem fill:#ffcccc
    style AbilityNode fill:#ffcccc
    style TreeService fill:#ffcccc
    style Seed fill:#ffffcc
```

**Проблемы:**
1. ❌ `TreeSemantic.data` смешивает структуру, контент и пользовательские данные
2. ❌ При обновлении seed файла перезаписывается всё, включая пользовательские данные
3. ❌ Контент дублируется в `TreeSemantic.data`, `AbilityNode` и `node-descriptions.json`
4. ❌ Нет единого источника истины для контента

### 1.2. Диаграмма потоков данных - Quests

```mermaid
graph TB
    subgraph Sources["Источники данных"]
        QuestTemplates["quest-templates.json<br/>Базовые шаблоны"]
        LLMGen["LLM Generation<br/>Автоматическая генерация"]
        UserCreate["User creates<br/>Пользователь создает"]
    end
    
    subgraph Storage["Хранилище (БД)"]
        QuestTable["Quest table<br/>❌ СМЕШАНО:<br/>Базовые + Авто +<br/>Пользовательские"]
    end
    
    subgraph Services["Сервисы"]
        SyncScript["sync-base-quests.ts<br/>❌ Обновляет по title"]
        InitService["user-initialization.service.ts<br/>✅ Проверяет существование"]
        QuestGen["quest-generation.service.ts<br/>✅ Создает новые"]
    end
    
    QuestTemplates -->|"При создании пользователя"| InitService
    QuestTemplates -->|"Синхронизация"| SyncScript
    SyncScript -->|"❌ Может перезаписать по title"| QuestTable
    InitService -->|"✅ Создает только если нет"| QuestTable
    LLMGen -->|"source='auto_generated'"| QuestGen
    QuestGen -->|"Создает новые"| QuestTable
    UserCreate -->|"source='user_generated'"| QuestTable
    
    style QuestTable fill:#ffcccc
    style SyncScript fill:#ffcccc
    style InitService fill:#ccffcc
    style QuestGen fill:#ccffcc
```

**Проблемы:**
1. ❌ `sync-base-quests.ts` обновляет квесты по `title`, может перезаписать пользовательские квесты
2. ❌ Нет четкого разделения между базовыми и пользовательскими квестами (хотя поле `source` есть)

### 1.3. Процесс обновления seed файла (текущий)

```mermaid
sequenceDiagram
    participant Dev as Разработчик
    participant Seed as seed файл
    participant System as Система
    participant DB as TreeSemantic.data
    participant User as Пользовательские данные
    
    Dev->>Seed: Обновляет seed файл<br/>(увеличивает tree_revision)
    System->>System: Запускается
    System->>Seed: Читает seed файл
    System->>DB: Проверяет seedRevision > dbRevision
    System->>DB: ❌ Перезаписывает ВСЁ<br/>(структура + контент +<br/>пользовательские данные)
    Note over DB,User: Пользовательские данные потеряны!
    System->>User: Пытается обогатить из UserAbilityState
    Note over System,User: Но данные уже перезаписаны!
```

---

## 2. Правильная архитектура (целевая)

### 2.1. Принцип разделения ответственности

```mermaid
graph TB
    subgraph Structure["1. СТРУКТУРА<br/>(Неизменяемая база)"]
        SeedFile["initial-ability-tree.json<br/>✅ Только структура:<br/>node_id, branch_id, tier,<br/>prerequisites, unlock_conditions,<br/>xp_required"]
        TreeSemDB["TreeSemantic.data<br/>✅ Только структура<br/>(без контента, без<br/>пользовательских данных)"]
    end
    
    subgraph Content["2. КОНТЕНТ<br/>(Переводы, описания)"]
        NodeDescFile["node-descriptions.json<br/>✅ Только контент:<br/>name, full_description,<br/>practical_meaning, examples,<br/>integration_levels"]
    end
    
    subgraph Theory["3. ТЕОРЕТИЧЕСКАЯ БАЗА<br/>(Научная база, методология)"]
        TheoryBase["data/theory-base/<br/>✅ Теория лидерства,<br/>ветки развития, методология"]
    end
    
    subgraph UserData["4. ПОЛЬЗОВАТЕЛЬСКИЕ ДАННЫЕ<br/>(Уникальны для каждого)"]
        UserStateDB["UserAbilityState<br/>✅ Только пользовательские данные:<br/>state, xp_current, progress,<br/>relevance"]
        QuestDB["Quest<br/>✅ source='base_template'<br/>✅ source='auto_generated'<br/>✅ source='user_generated'"]
        EntryDB["Entry, Session, Evidence<br/>✅ Пользовательские записи"]
    end
    
    subgraph Runtime["RUNTIME ОБЪЕДИНЕНИЕ<br/>(Не сохраняется в БД!)"]
        MergeService["tree.service.ts<br/>mergeData()<br/>✅ Объединяет в runtime"]
    end
    
    SeedFile -->|"Только структура"| TreeSemDB
    NodeDescFile -->|"Только контент"| MergeService
    TheoryBase -->|"Для обогащения контента"| MergeService
    TreeSemDB -->|"Только структура"| MergeService
    UserStateDB -->|"Только пользовательские данные"| MergeService
    QuestDB -->|"Разделено по source"| MergeService
    MergeService -->|"Объединенный результат"| Frontend["Фронтенд"]
    
    style SeedFile fill:#ccffcc
    style NodeDescFile fill:#ccffcc
    style TheoryBase fill:#ccffcc
    style UserStateDB fill:#ccffcc
    style QuestDB fill:#ccffcc
    style MergeService fill:#ccffcc
```

### 2.2. Диаграмма потоков данных - Nodes (правильная)

```mermaid
graph TB
    subgraph Sources["Источники данных"]
        Seed["initial-ability-tree.json<br/>✅ Только структура"]
        NodeDesc["node-descriptions.json<br/>✅ Только контент"]
        TheoryBase["data/theory-base/<br/>✅ Теоретическая база"]
        UserState["UserAbilityState<br/>✅ Только пользовательские данные"]
    end
    
    subgraph Storage["Хранилища (БД)"]
        TreeSem["TreeSemantic.data<br/>✅ Только структура"]
    end
    
    subgraph Services["Сервисы"]
        TreeService["tree.service.ts<br/>✅ Загружает раздельно"]
        MergeService["mergeData()<br/>✅ Объединяет в runtime"]
    end
    
    subgraph Frontend["Фронтенд"]
        WebApp["Web App<br/>Получает объединенные данные"]
    end
    
    Seed -->|"Только структура"| TreeService
    TreeService -->|"Обновляет только структуру"| TreeSem
    NodeDesc -->|"Читает контент"| MergeService
    TheoryBase -->|"Для обогащения"| MergeService
    TreeSem -->|"Читает структуру"| MergeService
    UserState -->|"Читает пользовательские данные"| MergeService
    MergeService -->|"Объединенный результат<br/>(не сохраняется в БД!)"| WebApp
    
    style TreeSem fill:#ccffcc
    style TreeService fill:#ccffcc
    style MergeService fill:#ccffcc
```

### 2.3. Диаграмма потоков данных - Quests (правильная)

```mermaid
graph TB
    subgraph Sources["Источники данных"]
        QuestTemplates["quest-templates.json<br/>✅ Базовые шаблоны"]
        LLMGen["LLM Generation<br/>✅ Автоматическая генерация"]
        UserCreate["User creates<br/>✅ Пользователь создает"]
    end
    
    subgraph Storage["Хранилище (БД)"]
        QuestTable["Quest table<br/>✅ Разделено по source:<br/>base_template<br/>auto_generated<br/>user_generated"]
    end
    
    subgraph Services["Сервисы"]
        SyncScript["sync-base-quests.ts<br/>✅ Обновляет только<br/>source='base_template'"]
        InitService["user-initialization.service.ts<br/>✅ Создает base_template"]
        QuestGen["quest-generation.service.ts<br/>✅ Создает auto_generated"]
    end
    
    QuestTemplates -->|"При создании пользователя"| InitService
    QuestTemplates -->|"Синхронизация"| SyncScript
    SyncScript -->|"✅ Обновляет только base_template"| QuestTable
    InitService -->|"✅ source='base_template'"| QuestTable
    LLMGen -->|"source='auto_generated'"| QuestGen
    QuestGen -->|"Создает новые"| QuestTable
    UserCreate -->|"✅ source='user_generated'"| QuestTable
    
    style QuestTable fill:#ccffcc
    style SyncScript fill:#ccffcc
    style InitService fill:#ccffcc
    style QuestGen fill:#ccffcc
```

### 2.4. Процесс обновления seed файла (правильный)

```mermaid
sequenceDiagram
    participant Dev as Разработчик
    participant Seed as seed файл<br/>(только структура)
    participant System as Система
    participant DB as TreeSemantic.data<br/>(только структура)
    participant Content as node-descriptions.json<br/>(контент)
    participant User as UserAbilityState<br/>(пользовательские данные)
    
    Dev->>Seed: Обновляет seed файл<br/>(только структура,<br/>увеличивает tree_revision)
    System->>System: Запускается
    System->>Seed: Читает seed файл<br/>(только структура)
    System->>DB: Проверяет seedRevision > dbRevision
    System->>DB: ✅ Обновляет ТОЛЬКО структуру<br/>(не затрагивает контент и<br/>пользовательские данные)
    Note over DB,User: Пользовательские данные сохранены!
    Note over Content: Контент не затронут!
    System->>Content: Читает контент отдельно
    System->>User: Читает пользовательские данные отдельно
    System->>System: ✅ Объединяет в runtime<br/>(не сохраняет в БД)
```

### 2.5. Процесс запроса дерева (правильный)

```mermaid
sequenceDiagram
    participant User as Пользователь
    participant API as API
    participant TreeService as tree.service.ts
    participant Structure as TreeSemantic.data<br/>(структура)
    participant Content as node-descriptions.json<br/>(контент)
    participant UserData as UserAbilityState<br/>(пользовательские данные)
    
    User->>API: GET /tree/semantic?userId=123
    API->>TreeService: getSemantic(userId)
    TreeService->>Structure: loadStructure()
    Structure-->>TreeService: Структура (node_id, branch_id, tier)
    TreeService->>Content: loadContent()
    Content-->>TreeService: Контент (name, description, examples)
    TreeService->>UserData: loadUserData(userId)
    UserData-->>TreeService: Пользовательские данные (state, xp_current)
    TreeService->>TreeService: mergeData(structure, content, userData)
    TreeService-->>API: Объединенный результат<br/>(только в памяти)
    API-->>User: Полное дерево с контентом<br/>и пользовательскими данными
```

---

## 3. Сравнение архитектур

### 3.1. Таблица сравнения

| Аспект | Текущая архитектура | Правильная архитектура |
|--------|---------------------|----------------------|
| **Структура** | Смешана с контентом в `TreeSemantic.data` | Отдельно в `TreeSemantic.data` (только структура) |
| **Контент** | Дублируется в 3 местах: `TreeSemantic.data`, `AbilityNode`, `node-descriptions.json` | Единый источник: `node-descriptions.json` |
| **Пользовательские данные** | Смешаны с контентом в `TreeSemantic.data` | Отдельно в `UserAbilityState` |
| **Обновление seed** | Перезаписывает всё (структура + контент + пользовательские данные) | Обновляет только структуру |
| **Объединение данных** | Хранится в БД (смешано) | Происходит в runtime (не сохраняется) |
| **Защита от перезаписи** | Нет | Есть (разделение по source для квестов) |
| **Единый источник истины** | Нет (данные дублируются) | Да (для каждого типа данных свой источник) |

### 3.2. Преимущества правильной архитектуры

1. **Безопасные обновления:**
   - Обновление seed файла не затрагивает пользовательские данные
   - Обновление контента не затрагивает структуру
   - Обновление пользовательских данных не затрагивает ничего другого

2. **Нет дублирования:**
   - Контент хранится в одном месте (`node-descriptions.json`)
   - Пользовательские данные хранятся в одном месте (`UserAbilityState`)
   - Структура хранится в одном месте (`TreeSemantic.data`)

3. **Производительность:**
   - Контент кэшируется в памяти (не в БД)
   - Пользовательские данные загружаются только при необходимости
   - Структура обновляется редко

4. **Масштабируемость:**
   - Легко добавлять новые типы контента
   - Легко обновлять контент независимо от структуры
   - Легко добавлять новые пользовательские данные

---

## 4. Миграция: Текущая → Правильная

### 4.1. Этапы миграции

```mermaid
graph LR
    A["Текущая<br/>Смешано всё"] -->|"Этап 1: Аудит"| B["Документация<br/>Проблемы выявлены"]
    B -->|"Этап 2: Валидация"| C["Валидация контента<br/>Теоретическая база"]
    C -->|"Этап 3: Миграция Nodes"| D["Разделение структуры<br/>и контента"]
    D -->|"Этап 4: Миграция Quests"| E["Разделение базовых<br/>и пользовательских"]
    E -->|"Этап 5: Экспорт"| F["Экспорт пользовательских<br/>данных"]
    F -->|"Этап 6: Защита"| G["Правильная<br/>Разделено всё"]
    
    style A fill:#ffcccc
    style G fill:#ccffcc
```

### 4.2. Критические точки миграции

1. **Извлечение структуры из TreeSemantic.data:**
   - Удалить `name`, `description` (контент)
   - Удалить `state`, `xp_current` (пользовательские данные)
   - Оставить только структуру

2. **Обновление логики загрузки:**
   - Загружать структуру из `TreeSemantic.data`
   - Загружать контент из `node-descriptions.json`
   - Загружать пользовательские данные из `UserAbilityState`
   - Объединять в runtime

3. **Защита от перезаписи:**
   - Обновлять только квесты с `source='base_template'`
   - Не перезаписывать пользовательские квесты

---

**См. также:**
- [FULL_ARCHITECTURE_AUDIT.md](./FULL_ARCHITECTURE_AUDIT.md) - Полный аудит
- [ARCHITECTURE_RULES.md](./ARCHITECTURE_RULES.md) - Правила архитектуры
