#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для обновления quest-templates.json полными теоретическими блоками из QUESTS_THEORIES_MAPPING.md
"""

import json
import re
import sys
from pathlib import Path

# Устанавливаем кодировку для вывода
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Пути к файлам
BASE_DIR = Path(__file__).parent.parent
MAPPING_FILE = BASE_DIR / "QUESTS_THEORIES_MAPPING.md"
TEMPLATES_FILE = BASE_DIR / "data" / "quest-templates.json"

def extract_theory_from_mapping(mapping_content: str, quest_id: str) -> str | None:
    """Извлекает полную теорию для квеста из QUESTS_THEORIES_MAPPING.md"""
    
    # Ищем секцию с квестом по ID
    # Паттерн: #### Название квеста\n\n- **ID:** `quest_id`
    pattern = rf'#### [^\n]+\n\n- \*\*ID:\*\* `{re.escape(quest_id)}`'
    match = re.search(pattern, mapping_content)
    
    if not match:
        return None
    
    # Находим начало теории (после "**Теория:**")
    start_pos = mapping_content.find("**Теория:**", match.end())
    if start_pos == -1:
        return None
    
    # Находим конец теории (до следующего "---" или "####")
    theory_start = mapping_content.find("\n\n", start_pos) + 2
    if theory_start == 1:
        return None
    
    # Ищем конец теории
    next_section = mapping_content.find("\n---\n", theory_start)
    next_quest = mapping_content.find("\n#### ", theory_start)
    
    end_pos = len(mapping_content)
    if next_section != -1:
        end_pos = min(end_pos, next_section)
    if next_quest != -1:
        end_pos = min(end_pos, next_quest)
    
    theory_text = mapping_content[theory_start:end_pos].strip()
    
    # Убираем блоки цитат (если есть)
    theory_text = re.sub(r'^> ', '', theory_text, flags=re.MULTILINE)
    
    # Убираем лишние пробелы
    theory_text = re.sub(r'\n{3,}', '\n\n', theory_text)
    
    return theory_text if theory_text else None

def update_quest_templates():
    """Обновляет quest-templates.json полными теориями"""
    
    # Читаем mapping файл
    print(f"Читаю {MAPPING_FILE}...")
    with open(MAPPING_FILE, 'r', encoding='utf-8') as f:
        mapping_content = f.read()
    
    # Читаем templates файл
    print(f"Читаю {TEMPLATES_FILE}...")
    with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
        templates_data = json.load(f)
    
    quest_templates = templates_data.get('quest_templates', [])
    
    updated_count = 0
    not_found_count = 0
    
    # Обновляем каждый квест
    for quest in quest_templates:
        quest_id = quest.get('id')
        if not quest_id:
            continue
        
        print(f"\nОбрабатываю квест: {quest_id}")
        
        # Извлекаем теорию из mapping
        theory = extract_theory_from_mapping(mapping_content, quest_id)
        
        if theory:
            # Обновляем theory_and_examples в criteria
            if 'criteria' not in quest:
                quest['criteria'] = {}
            
            if not isinstance(quest['criteria'], dict):
                quest['criteria'] = {'type': 'custom', 'items': []}
            
            quest['criteria']['theory_and_examples'] = theory
            updated_count += 1
            print(f"  [OK] Обновлено (длина: {len(theory)} символов)")
        else:
            not_found_count += 1
            print(f"  [WARN] Теория не найдена в mapping")
    
    # Сохраняем обновленный файл
    print(f"\nСохраняю обновленный {TEMPLATES_FILE}...")
    with open(TEMPLATES_FILE, 'w', encoding='utf-8') as f:
        json.dump(templates_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n[SUCCESS] Готово!")
    print(f"  Обновлено: {updated_count}")
    print(f"  Не найдено: {not_found_count}")
    print(f"  Всего квестов: {len(quest_templates)}")

if __name__ == '__main__':
    try:
        update_quest_templates()
    except Exception as e:
        print(f"[ERROR] Ошибка: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

