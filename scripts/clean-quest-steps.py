#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для очистки шагов квестов от дублирования контента
Удаляет шаги "Начать выполнение", которые содержат весь контент квеста
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
TEMPLATES_FILE = BASE_DIR / "data" / "quest-templates.json"
BACKUP_FILE = BASE_DIR / "data" / "quest-templates.backup.json"

def clean_steps(quest):
    """Очищает шаги от дублирования"""
    steps = quest.get('steps', [])
    if not steps or not isinstance(steps, list):
        return []
    
    cleaned_steps = []
    
    for step in steps:
        if not step or not isinstance(step, dict):
            continue
        
        title = (step.get('title') or '').strip()
        description = (step.get('description') or step.get('text') or '').strip()
        
        # Пропускаем шаги "Начать выполнение", которые содержат весь контент квеста
        if title == "Начать выполнение" and description:
            # Проверяем, не содержит ли description все элементы квеста
            # (этапы, критерии, награда, связанные узлы, теорию)
            suspicious_patterns = [
                "Этап 1", "Этап 2", "Этап 3",
                "Критерии:", "Критерии\n",
                "Награда:", "Награда\n",
                "Связанные узлы:", "Связанные узлы\n",
                "Подробнее", "теория и примеры",
                "\r\n\r\n",  # Двойные переносы строк (признак много текста)
            ]
            
            # Если содержит более 2 паттернов - вероятно, это дублирование
            pattern_count = sum(1 for pattern in suspicious_patterns if pattern in description)
            
            if pattern_count >= 2:
                print(f"  [WARN] Пропущен шаг с дублированием: {quest.get('id')}")
                continue
        
        # Оставляем шаг как есть
        cleaned_steps.append(step)
    
    return cleaned_steps

def clean_quests():
    """Очищает все квесты"""
    
    # Читаем файл
    with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Создаем бэкап
    with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[OK] Создан бэкап: {BACKUP_FILE}")
    
    quests = data.get('quest_templates', [])
    cleaned_count = 0
    total_steps_removed = 0
    
    for quest in quests:
        original_steps_count = len(quest.get('steps', []))
        cleaned_steps = clean_steps(quest)
        quest['steps'] = cleaned_steps
        
        removed_count = original_steps_count - len(cleaned_steps)
        if removed_count > 0:
            cleaned_count += 1
            total_steps_removed += removed_count
            print(f"  [OK] {quest.get('id')}: удалено {removed_count} шаг(ов)")
    
    # Сохраняем очищенный файл
    with open(TEMPLATES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n[OK] Очистка завершена:")
    print(f"   - Обработано квестов: {len(quests)}")
    print(f"   - Квестов с изменениями: {cleaned_count}")
    print(f"   - Всего удалено шагов: {total_steps_removed}")
    print(f"   - Результат сохранен в: {TEMPLATES_FILE}")

if __name__ == "__main__":
    clean_quests()

