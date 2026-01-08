#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для исправления структуры всех квестов в quest-templates.json
- Очищает description от лишней информации (этапы, критерии, награда)
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

# Устанавливаем кодировку для вывода
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def clean_description(description):
    """Очищает description от лишней информации"""
    if not description:
        return ""
    
    # Удаляем все после первого двойного переноса строки, если там начинается "Этап", "Критерии", "Награда"
    lines = description.split('\n')
    cleaned_lines = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        # Останавливаемся, если встречаем маркеры начала лишней информации
        if stripped.startswith('Этап ') or stripped.startswith('Критерии:') or stripped.startswith('Награда:') or stripped.startswith('Связанные узлы:') or stripped.startswith('Условия разблокировки:'):
            break
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines).strip()

def extract_steps_from_description(description):
    """Извлекает шаги из description, если они там есть"""
    if not description:
        return []
    
    steps = []
    
    # Ищем этапы в формате "Этап N (Неделя X-Y): Название"
    pattern = r'Этап\s+(\d+)\s*\([^)]+\):\s*([^\n]+)\n(.*?)(?=Этап\s+\d+|Критерии:|Награда:|Связанные|Условия|$)'
    matches = re.finditer(pattern, description, re.DOTALL)
    
    for match in matches:
        order = int(match.group(1))
        title = match.group(2).strip()
        content = match.group(3).strip()
        
        # Очищаем content от маркеров списка
        content = re.sub(r'^[-*]\s+', '', content, flags=re.MULTILINE)
        content = re.sub(r'\n+', ' ', content)
        content = content.strip()
        
        if title and content:
            steps.append({
                "order": order,
                "title": f"Этап {order}: {title}",
                "description": content
            })
    
    return steps

def fix_quest_structure(quest):
    """Исправляет структуру одного квеста"""
    quest_id = quest.get('id', '')
    original_description = quest.get('description', '')
    
    # Проверяем, есть ли в description лишняя информация
    has_extra_info = any(marker in original_description for marker in [
        'Этап ', 'Критерии:', 'Награда:', 'Связанные узлы:', 'Условия разблокировки:'
    ])
    
    if not has_extra_info:
        return False  # Структура уже правильная
    
    # Очищаем description
    cleaned_description = clean_description(original_description)
    quest['description'] = cleaned_description
    
    # Проверяем steps
    current_steps = quest.get('steps', [])
    
    # Если steps пустые или содержат один большой шаг, пытаемся извлечь из description
    if not current_steps or (len(current_steps) == 1 and len(current_steps[0].get('description', '')) > 200):
        extracted_steps = extract_steps_from_description(original_description)
        if extracted_steps:
            quest['steps'] = extracted_steps
            print(f"  [OK] Извлечено {len(extracted_steps)} шагов из description")
    
    # Проверяем критерии
    if 'criteria' not in quest:
        quest['criteria'] = {}
    if not isinstance(quest['criteria'], dict):
        quest['criteria'] = {'type': 'custom', 'items': []}
    
    # Если criteria.items пустые, пытаемся извлечь из description
    if not quest['criteria'].get('items'):
        # Ищем критерии в description
        criteria_match = re.search(r'Критерии:\s*\n((?:[-*]\s+[^\n]+\n?)+)', original_description)
        if criteria_match:
            criteria_text = criteria_match.group(1)
            items = re.findall(r'[-*]\s+(.+)', criteria_text)
            if items:
                quest['criteria']['items'] = [item.strip() for item in items]
                print(f"  [OK] Извлечено {len(items)} критериев из description")
    
    return True

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
            print(f"  [OK] Исправлена структура")
    
    # Сохраняем обновленный файл
    print(f"\nСохраняю обновленный {TEMPLATES_FILE}...")
    with open(TEMPLATES_FILE, 'w', encoding='utf-8') as f:
        json.dump(templates_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n[SUCCESS] Готово!")
    print(f"  Исправлено: {fixed_count}")
    print(f"  Всего квестов: {len(quest_templates)}")

if __name__ == '__main__':
    try:
        fix_all_quests()
    except Exception as e:
        print(f"[ERROR] Ошибка: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

