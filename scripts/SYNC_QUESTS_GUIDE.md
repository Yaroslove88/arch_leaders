# Руководство по синхронизации квестов из JSON в базу данных

## Быстрый старт

После очистки `quest-templates.json` от шагов с дублированием контента, нужно синхронизировать данные в базу.

### Вариант 1: Массовая синхронизация одним запросом (быстрее)

```bash
# Убедитесь, что API сервер запущен на http://localhost:3001
# Перейдите в директорию проекта
cd leadership-architect

# Запустите синхронизацию (обновляет все квесты одним запросом)
python scripts/sync-quests-batch.py
```

### Вариант 2: Пошаговая синхронизация (если нужен детальный лог)

```bash
# Убедитесь, что API сервер запущен на http://localhost:3001
# Перейдите в директорию проекта
cd leadership-architect

# Запустите синхронизацию (обновляет каждый квест отдельно)
python scripts/sync-all-quests-from-templates.py
```

**С параметрами:**
```bash
# Если API на другом порту
python scripts/sync-quests-batch.py --api-url http://localhost:3000
# или
python scripts/sync-all-quests-from-templates.py --api-url http://localhost:3000

# С токеном аутентификации (если требуется)
python scripts/sync-quests-batch.py --api-url http://localhost:3001 --token YOUR_TOKEN
```

### Вариант 3: Через API endpoint напрямую (для разработчиков)

Есть endpoint для массовой синхронизации:

**POST** `/api/quests/sync-from-templates`

**Body:**
```json
{
  "templates": [
    {
      "id": "story_путь_к_субъектности_27",
      "description": "Исследуйте переход от реактивного поведения...",
      "steps": [
        {
          "order": 1,
          "title": "Этап 1: Диагностика (Неделя 1-2)",
          "description": "Проанализируйте 5 ситуаций..."
        }
      ],
      "criteria": {
        "type": "custom",
        "items": ["Проанализированы минимум 5 ситуаций"],
        "theory_and_examples": "## Что такое путь к субъектности..."
      }
    }
  ]
}
```

**Пример запроса (curl):**
```bash
curl -X POST http://localhost:3001/api/quests/sync-from-templates \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "templates": $(cat data/quest-templates.json | jq '.quest_templates')
}
EOF
```

**Пример запроса (Python):**
```python
import json
import requests

# Читаем шаблоны
with open('data/quest-templates.json', 'r', encoding='utf-8') as f:
    templates_data = json.load(f)

# Отправляем на синхронизацию
response = requests.post(
    'http://localhost:3001/api/quests/sync-from-templates',
    json={'templates': templates_data['quest_templates']},
    headers={'Content-Type': 'application/json'}
)

print(response.status_code)
print(response.json())
```

## Что делает синхронизация

Скрипт обновляет для каждого квеста:
- ✅ `description` - описание квеста
- ✅ `steps` - шаги выполнения (JSON массив)
- ✅ `criteria` - критерии успеха (включая `items` и `theory_and_examples`)

**Важно:** Обновляются только квесты, которые уже существуют в базе. Если квеста нет - он не будет создан.

## Проверка перед синхронизацией

1. **Убедитесь, что API сервер запущен:**
   ```bash
   curl http://localhost:3001/health
   # Должен вернуть {"status":"ok"} или подобное
   ```

2. **Проверьте, что файл `quest-templates.json` очищен:**
   ```bash
   # Проверьте, что нет шагов "Начать выполнение" с дублированием
   grep -n "Начать выполнение" data/quest-templates.json
   # Если есть - они должны быть удалены
   ```

3. **Сделайте бэкап базы данных** (на всякий случай)

## Что будет обновлено

После синхронизации в базе данных будут обновлены:
- ✅ Описания всех квестов (без дублирования этапов, критериев)
- ✅ Шаги выполнения (без шага "Начать выполнение" с полным контентом)
- ✅ Критерии успеха (правильные `items`)
- ✅ Теория в `criteria.theory_and_examples`

## Результат синхронизации

Скрипт выведет:
```
Синхронизирую 33 квестов по одному через PATCH /api/quests/:id...

Синхронизирую: micro_контейнирование_напряжения_1... [OK]
Синхронизирую: micro_системное_мышление_2... [OK]
...
Синхронизирую: story_путь_к_субъектности_27... [OK]

[SUCCESS] Синхронизация завершена!
  Обновлено: 33
  Не найдено: 0
  Ошибок: 0
```

## Устранение проблем

### "API сервер недоступен"
```bash
# Убедитесь, что API запущен
cd leadership-architect/apps/api
npm run dev
# или
pnpm dev
```

### "Quest not found"
Это нормально, если квест еще не создан в базе. Создайте его вручную или через процесс создания квестов из шаблонов.

### "Permission denied" или "401 Unauthorized"
Если требуется аутентификация, передайте токен:
```bash
python scripts/sync-all-quests-from-templates.py --token YOUR_JWT_TOKEN
```

## После синхронизации

1. **Проверьте веб-интерфейс:**
   - Откройте любой квест
   - Убедитесь, что нет дублирования контента в шагах
   - Проверьте, что описание краткое
   - Проверьте, что шаги структурированы правильно

2. **Проверьте API:**
   ```bash
   curl http://localhost:3001/api/quests/story_путь_к_субъектности_27 | jq '.steps'
   # Шаги должны быть без "Начать выполнение" с дублированием
   ```

