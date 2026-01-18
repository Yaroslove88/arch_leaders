#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для исправления структуры квестов в quest-templates.json
- Очищает description от лишней информации
- Разбивает steps на правильные структурированные шаги
- Проверяет критерии
"""

import json
import re
import sys
from pathlib import Path

# Пути к файлам
BASE_DIR = Path(__file__).parent.parent
TEMPLATES_FILE = BASE_DIR / "data" / "quest-templates.json"

def fix_quest_structure(quest):
    """Исправляет структуру одного квеста"""
    quest_id = quest.get('id', '')
    
    # Для квеста "путь к субъектности"
    if quest_id == 'story_путь_к_субъектности_27':
        # Очищаем description - оставляем только краткое описание
        quest['description'] = "Исследуйте переход от реактивного поведения к действию из субъектности. Развивайте способность удерживать позицию и создавать новые возможности."
        
        # Создаем правильные шаги
        quest['steps'] = [
            {
                "order": 1,
                "title": "Этап 1: Диагностика (Неделя 1-2)",
                "description": "Проанализируйте 5 ситуаций из прошлого месяца. Определите, где вы действовали реактивно (автоматически, без выбора) и где проявилась субъектность (осознанный выбор, удержание позиции). Запишите паттерны."
            },
            {
                "order": 2,
                "title": "Этап 2: Практика удержания позиции (Неделя 3)",
                "description": "Выберите 3 ситуации, где обычно теряете позицию. Практикуйте удержание позиции (пауза, наблюдение, выбор). Записывайте, что помогает, что мешает."
            },
            {
                "order": 3,
                "title": "Этап 3: Создание новых возможностей (Неделя 4)",
                "description": "Выберите одну область, где хотите создать новую возможность. Действуйте из субъектности (не реагируйте, а создавайте). Запишите результат."
            }
        ]
        
        # Обновляем критерии
        if 'criteria' not in quest:
            quest['criteria'] = {}
        if not isinstance(quest['criteria'], dict):
            quest['criteria'] = {'type': 'custom', 'items': []}
        
        quest['criteria']['items'] = [
            "Проанализированы минимум 5 ситуаций",
            "Практиковано удержание позиции минимум в 3 ситуациях",
            "Создана новая возможность",
            "Итоговая интеграция с инсайтами"
        ]
        
        print(f"  [OK] Исправлена структура квеста {quest_id}")
        return True
    
    return False

def fix_all_quests():
    """Исправляет структуру всех квестов"""
    
    # Читаем templates файл
    print(f"Читаю {TEMPLATES_FILE}...")
    with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
        templates_data = json.load(f)
    
    quest_templates = templates_data.get('quest_templates', [])
    
    fixed_count = 0
    
    # Исправляем каждый квест
    for quest in quest_templates:
        quest_id = quest.get('id')
        if not quest_id:
            continue
        
        print(f"\nОбрабатываю квест: {quest_id}")
        
        if fix_quest_structure(quest):
            fixed_count += 1
    
    # Сохраняем обновленный файл
    print(f"\nСохраняю обновленный {TEMPLATES_FILE}...")
    with open(TEMPLATES_FILE, 'w', encoding='utf-8') as f:
        json.dump(templates_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n[SUCCESS] Готово!")
    print(f"  Исправлено: {fixed_count}")

if __name__ == '__main__':
    try:
        fix_all_quests()
    except Exception as e:
        print(f"[ERROR] Ошибка: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

