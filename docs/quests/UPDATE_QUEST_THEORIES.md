# Обновление теорий квестов

## Проблема

Существующие квесты в базе данных не имеют поля `theory_and_examples` в `criteria`, поэтому раздел "Подробнее" не отображается.

## Решение

Создан эндпоинт для массового обновления теорий квестов из готового маппинга.

## Способ 1: Через PowerShell скрипт (Windows)

```powershell
cd leadership-architect
.\scripts\update-quest-theories.ps1
```

Или через Node.js скрипт:

```bash
cd leadership-architect
node scripts/update-quest-theories.js
```

## Способ 2: Через API (curl для Linux/Mac)

```bash
curl -X POST http://localhost:3001/quests/update-theories-from-mapping \
  -H "Content-Type: application/json" \
  -d @data/quest-theories-mapping.json
```

Для PowerShell используйте:

```powershell
$body = Get-Content data/quest-theories-mapping.json -Raw
Invoke-RestMethod -Uri "http://localhost:3001/quests/update-theories-from-mapping" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## Способ 3: Через TypeScript скрипт

```bash
cd leadership-architect
npx ts-node scripts/update-quest-theories.ts
```

## Способ 3: Через отдельный квест

Для обновления теории конкретного квеста:

```bash
curl -X POST http://localhost:3001/quests/{questId}/theory \
  -H "Content-Type: application/json" \
  -d '{"theory": "## Заголовок\n\nТекст теории..."}'
```

## Формат маппинга

Файл `data/quest-theories-mapping.json` содержит массив объектов:

```json
[
  {
    "title": "Название квеста (частичное совпадение)",
    "linkedNodes": ["node_containment"],
    "theory": "## Заголовок\n\nТекст теории в формате Markdown..."
  }
]
```

Система ищет квесты по:
1. Названию (частичное совпадение, регистронезависимое)
2. Связанным узлам (если название не найдено)

## Добавление новых теорий

1. Откройте `data/quest-theories-mapping.json`
2. Добавьте новую запись с названием квеста, связанными узлами и теорией
3. Запустите обновление через API или скрипт

## Проверка результата

После обновления:
1. Откройте страницу квеста в браузере
2. Нажмите кнопку "Подробнее"
3. Должна отобразиться теория и примеры

## Отладка

Если теория не отображается:
1. Проверьте, что поле `theory_and_examples` есть в `criteria`:
   - Откройте DevTools → Network
   - Найдите запрос к `/quests/{id}`
   - Проверьте `criteria.theory_and_examples`

2. Проверьте логи бэкенда на наличие ошибок

3. Используйте отладочную информацию на странице квеста (в режиме разработки)

