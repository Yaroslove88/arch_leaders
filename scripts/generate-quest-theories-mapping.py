#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для создания документа, связывающего квесты с их теоретическими блоками.

Создает документ QUESTS_THEORIES_MAPPING.md, который содержит:
- ID квеста
- Название квеста
- Тип квеста
- Статус теории (есть/нет, соответствует ли требованиям)
- Ссылка на блок theory_and_examples
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any

# Путь к файлу с квестами
QUEST_TEMPLATES_PATH = Path(__file__).parent.parent / "data" / "quest-templates.json"
OUTPUT_PATH = Path(__file__).parent.parent / "QUESTS_THEORIES_MAPPING.md"

# Минимальная длина теории для считания её достаточной (примерно 500 символов)
MIN_THEORY_LENGTH = 500

# Ключевые слова, которые должны быть в хорошей теории
REQUIRED_SECTIONS = [
    "что это",
    "почему",
    "важно",
    "термин",
    "пример",
    "практик",
    "методолог",
    "связь",
    "совет"
]


def analyze_theory_quality(theory: str) -> Dict[str, Any]:
    """Анализирует качество теории."""
    if not theory or not theory.strip():
        return {
            "has_theory": False,
            "length": 0,
            "quality": "missing",
            "issues": ["Теория отсутствует"]
        }
    
    theory_lower = theory.lower()
    length = len(theory)
    
    issues = []
    quality_score = 0
    
    # Проверка длины
    if length < MIN_THEORY_LENGTH:
        issues.append(f"Теория слишком короткая ({length} символов, минимум {MIN_THEORY_LENGTH})")
    else:
        quality_score += 1
    
    # Проверка наличия ключевых разделов
    found_sections = []
    for section in REQUIRED_SECTIONS:
        if section in theory_lower:
            found_sections.append(section)
            quality_score += 0.5
    
    if len(found_sections) < 3:
        issues.append(f"Недостаточно ключевых разделов (найдено: {found_sections})")
    
    # Определение качества
    if quality_score >= 3:
        quality = "good"
    elif quality_score >= 1.5:
        quality = "basic"
    else:
        quality = "poor"
    
    return {
        "has_theory": True,
        "length": length,
        "quality": quality,
        "issues": issues,
        "found_sections": found_sections
    }


def generate_mapping_document(quests: List[Dict[str, Any]]) -> str:
    """Генерирует Markdown документ с маппингом квестов и теорий."""
    
    lines = []
    lines.append("# Маппинг квестов и теоретических блоков")
    lines.append("")
    lines.append("Этот документ связывает каждый квест с его теоретическим блоком (`theory_and_examples`).")
    lines.append("")
    lines.append("## Легенда")
    lines.append("")
    lines.append("- ✅ **good** — теория полная и соответствует требованиям")
    lines.append("- ⚠️ **basic** — теория есть, но может быть улучшена")
    lines.append("- ❌ **poor** — теория недостаточная или отсутствует")
    lines.append("")
    lines.append("## Статистика")
    lines.append("")
    
    # Подсчет статистики
    total = len(quests)
    with_theory = sum(1 for q in quests if q.get("criteria", {}).get("theory_and_examples"))
    good_quality = 0
    basic_quality = 0
    poor_quality = 0
    missing = 0
    
    for quest in quests:
        theory = quest.get("criteria", {}).get("theory_and_examples", "")
        analysis = analyze_theory_quality(theory)
        if not analysis["has_theory"]:
            missing += 1
        elif analysis["quality"] == "good":
            good_quality += 1
        elif analysis["quality"] == "basic":
            basic_quality += 1
        else:
            poor_quality += 1
    
    lines.append(f"- **Всего квестов:** {total}")
    lines.append(f"- **С теорией:** {with_theory} ({with_theory/total*100:.1f}%)")
    lines.append(f"- **Хорошего качества:** {good_quality} ({good_quality/total*100:.1f}%)")
    lines.append(f"- **Базового качества:** {basic_quality} ({basic_quality/total*100:.1f}%)")
    lines.append(f"- **Низкого качества:** {poor_quality} ({poor_quality/total*100:.1f}%)")
    lines.append(f"- **Отсутствует:** {missing} ({missing/total*100:.1f}%)")
    lines.append("")
    lines.append("---")
    lines.append("")
    
    # Группировка по типам
    by_type = {}
    for quest in quests:
        quest_type = quest.get("type", "unknown")
        if quest_type not in by_type:
            by_type[quest_type] = []
        by_type[quest_type].append(quest)
    
    # Сортировка типов
    type_order = ["micro", "weekly", "story", "coaching", "group", "mentor"]
    sorted_types = sorted(by_type.keys(), key=lambda x: (type_order.index(x) if x in type_order else 999, x))
    
    # Генерация разделов по типам
    for quest_type in sorted_types:
        type_quests = by_type[quest_type]
        lines.append(f"## {quest_type.upper()} квесты")
        lines.append("")
        lines.append(f"Всего: {len(type_quests)}")
        lines.append("")
        lines.append("| ID | Название | Статус теории | Длина | Проблемы |")
        lines.append("|----|----------|---------------|------|----------|")
        
        for quest in sorted(type_quests, key=lambda x: x.get("id", "")):
            quest_id = quest.get("id", "N/A")
            title = quest.get("title", "N/A")
            theory = quest.get("criteria", {}).get("theory_and_examples", "")
            analysis = analyze_theory_quality(theory)
            
            # Иконка статуса
            if analysis["quality"] == "good":
                status_icon = "✅ good"
            elif analysis["quality"] == "basic":
                status_icon = "⚠️ basic"
            elif analysis["has_theory"]:
                status_icon = "❌ poor"
            else:
                status_icon = "❌ missing"
            
            # Длина
            length_str = f"{analysis['length']} симв." if analysis["has_theory"] else "-"
            
            # Проблемы
            issues_str = "; ".join(analysis["issues"][:2]) if analysis["issues"] else "-"
            if len(analysis["issues"]) > 2:
                issues_str += f" (+{len(analysis['issues'])-2} еще)"
            
            lines.append(f"| `{quest_id}` | {title} | {status_icon} | {length_str} | {issues_str} |")
        
        lines.append("")
        lines.append("---")
        lines.append("")
    
    # Детальная информация по каждому квесту
    lines.append("## Детальная информация по квестам")
    lines.append("")
    
    for quest_type in sorted_types:
        type_quests = by_type[quest_type]
        lines.append(f"### {quest_type.upper()} квесты")
        lines.append("")
        
        for quest in sorted(type_quests, key=lambda x: x.get("id", "")):
            quest_id = quest.get("id", "N/A")
            title = quest.get("title", "N/A")
            description = quest.get("description", "")
            theory = quest.get("criteria", {}).get("theory_and_examples", "")
            analysis = analyze_theory_quality(theory)
            
            lines.append(f"#### {title}")
            lines.append("")
            lines.append(f"- **ID:** `{quest_id}`")
            lines.append(f"- **Тип:** `{quest_type}`")
            lines.append(f"- **Описание:** {description[:100]}{'...' if len(description) > 100 else ''}")
            lines.append("")
            
            # Статус теории
            if analysis["quality"] == "good":
                lines.append(f"- **Статус теории:** ✅ Хорошее качество")
            elif analysis["quality"] == "basic":
                lines.append(f"- **Статус теории:** ⚠️ Базовое качество (требует улучшения)")
            elif analysis["has_theory"]:
                lines.append(f"- **Статус теории:** ❌ Низкое качество (требует доработки)")
            else:
                lines.append(f"- **Статус теории:** ❌ Отсутствует")
            
            lines.append(f"- **Длина теории:** {analysis['length']} символов")
            
            if analysis["found_sections"]:
                lines.append(f"- **Найденные разделы:** {', '.join(analysis['found_sections'])}")
            
            if analysis["issues"]:
                lines.append("- **Проблемы:**")
                for issue in analysis["issues"]:
                    lines.append(f"  - {issue}")
            
            lines.append("")
            lines.append("**Теория:**")
            lines.append("")
            if theory:
                # Показываем первые 300 символов теории
                preview = theory[:300].replace("\r\n", " ").replace("\n", " ")
                lines.append(f"> {preview}{'...' if len(theory) > 300 else ''}")
            else:
                lines.append("> *Теория отсутствует*")
            
            lines.append("")
            lines.append("---")
            lines.append("")
    
    # Инструкции по использованию
    lines.append("## Как использовать этот документ")
    lines.append("")
    lines.append("1. **Найти квест по ID или названию** — используйте поиск в документе")
    lines.append("2. **Проверить статус теории** — посмотрите, соответствует ли теория требованиям")
    lines.append("3. **Создать/улучшить теорию** — используйте требования из `ENHANCE_QUESTS_THEORIES.md`")
    lines.append("4. **Обновить файл** — после создания теории обновите `quest-templates.json`")
    lines.append("")
    lines.append("## Требования к теории")
    lines.append("")
    lines.append("Каждый блок `theory_and_examples` должен содержать:")
    lines.append("")
    lines.append("1. **Детальное объяснение способности**")
    lines.append("   - Что это за способность в контексте архитектурного лидерства")
    lines.append("   - Почему она критична для развития лидера")
    lines.append("   - Как она связана с переходом от управленца к архитектору")
    lines.append("")
    lines.append("2. **Пояснение терминов**")
    lines.append("   - Объяснение всех ключевых терминов")
    lines.append("   - Что они означают в контексте курса")
    lines.append("")
    lines.append("3. **Обоснование важности**")
    lines.append("   - Почему способность важна сейчас")
    lines.append("   - Какие проблемы она решает")
    lines.append("   - Связь с научной базой")
    lines.append("")
    lines.append("4. **Связь с методологией курса**")
    lines.append("   - Связь с субъектностью, контейнированием, системным мышлением")
    lines.append("   - Научные теории и исследования")
    lines.append("")
    lines.append("5. **Примеры применения**")
    lines.append("   - 2-3 конкретных примера из практики")
    lines.append("   - Примеры \"хорошо\" и \"плохо\"")
    lines.append("")
    lines.append("6. **Практические советы**")
    lines.append("   - Как начать развивать способность")
    lines.append("   - Как заметить прогресс")
    lines.append("   - Типичные ошибки")
    lines.append("")
    lines.append("Подробнее см. `ENHANCE_QUESTS_THEORIES.md`")
    lines.append("")
    
    return "\n".join(lines)


def main():
    """Основная функция."""
    import sys
    import io
    
    # Устанавливаем UTF-8 для вывода
    if sys.stdout.encoding != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    print(f"Чтение файла: {QUEST_TEMPLATES_PATH}")
    
    if not QUEST_TEMPLATES_PATH.exists():
        print(f"Ошибка: файл {QUEST_TEMPLATES_PATH} не найден")
        return 1
    
    with open(QUEST_TEMPLATES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    quests = data.get("quest_templates", [])
    print(f"Найдено квестов: {len(quests)}")
    
    # Генерация документа
    document = generate_mapping_document(quests)
    
    # Сохранение
    print(f"Сохранение документа: {OUTPUT_PATH}")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(document)
    
    print("[OK] Документ успешно создан!")
    return 0


if __name__ == "__main__":
    exit(main())

