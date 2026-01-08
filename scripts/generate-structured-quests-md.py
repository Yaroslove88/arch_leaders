#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для генерации структурированного MD файла со всеми квестами
Согласно docs/QUEST_CONTENT_STRUCTURE.md
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
TEMPLATES_FILE = BASE_DIR / "data" / "quest-templates.json"
OUTPUT_FILE = BASE_DIR / "QUESTS_STRUCTURED_CONTENT.md"

def escape_markdown(text):
    """Экранирует специальные символы Markdown"""
    if not text:
        return ""
    return str(text).replace("|", "\\|")

def format_steps(steps):
    """Форматирует шаги выполнения"""
    if not steps or not isinstance(steps, list):
        return None
    
    lines = []
    for step in steps:
        if isinstance(step, str):
            lines.append(f"- {escape_markdown(step)}")
        elif isinstance(step, dict):
            title = (step.get('title') or '').strip() if step.get('title') else ''
            description = (step.get('description') or step.get('text') or '').strip()
            
            if title and description:
                lines.append(f"**{escape_markdown(title)}**")
                lines.append(f"  {escape_markdown(description)}")
            elif description:
                lines.append(f"- {escape_markdown(description)}")
            elif title:
                lines.append(f"- {escape_markdown(title)}")
    
    return "\n".join(lines) if lines else None

def format_criteria(criteria):
    """Форматирует критерии успеха"""
    if not criteria:
        return None
    
    if isinstance(criteria, str):
        return criteria
    
    if isinstance(criteria, dict):
        items = criteria.get('items', [])
        description = criteria.get('description', '')
        
        if items and isinstance(items, list):
            lines = []
            for item in items:
                if isinstance(item, str) and item.strip():
                    lines.append(f"- {escape_markdown(item)}")
            return "\n".join(lines) if lines else None
        
        if description:
            return description
    
    return None

def format_reward(reward):
    """Форматирует награду"""
    if not reward:
        return None
    
    parts = []
    if reward.get('xp'):
        parts.append(f"{reward['xp']} XP")
    
    if reward.get('skill_xp'):
        parts.append(f"+{reward['skill_xp']} к связанным способностям")
    
    if reward.get('nodes') and isinstance(reward['nodes'], dict):
        for node_id, points in reward['nodes'].items():
            parts.append(f"+{points} к \"{node_id}\"")
    
    return ", ".join(parts) if parts else None

def format_linked_nodes(nodes, node_name_map):
    """Форматирует связанные способности"""
    if not nodes or not isinstance(nodes, list):
        return None
    
    names = []
    for node_id in nodes:
        name = node_name_map.get(node_id, node_id)
        names.append(f"`{node_id}` ({name})")
    
    return ", ".join(names)

def generate_md():
    """Генерирует MD файл"""
    
    # Читаем шаблоны
    with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    quests = data.get('quest_templates', [])
    
    # Маппинг node_id на названия (можно расширить)
    node_name_map = {}
    
    # Группируем по типам
    quests_by_type = {
        'micro': [],
        'weekly': [],
        'story': [],
        'in-person': []
    }
    
    for quest in quests:
        quest_type = quest.get('type', 'unknown')
        if quest_type in quests_by_type:
            quests_by_type[quest_type].append(quest)
    
    # Генерируем MD
    lines = [
        "# Структурированное описание квестов",
        "",
        "> **Источник данных:** `data/quest-templates.json`  ",
        "> **Структура:** Соответствует `docs/QUEST_CONTENT_STRUCTURE.md`  ",
        "> **Обновлено:** 2025-01-27",
        "",
        "Этот документ содержит все квесты, структурированные согласно `docs/QUEST_CONTENT_STRUCTURE.md`.",
        "",
        "**Важно:** Теоретическая часть (`theory_and_examples`) не включена в этот файл. ",
        "Полные теоретические блоки см. в `QUESTS_THEORIES_MAPPING.md`.",
        "",
        "## Правила структуры",
        "",
        "Согласно `docs/QUEST_CONTENT_STRUCTURE.md`, каждый квест должен иметь четкое разделение:",
        "",
        "1. **Описание (description)** - краткое описание цели (1-3 предложения)",
        "2. **Шаги выполнения (steps)** - конкретные действия, которые нужно выполнить",
        "3. **Критерии успеха (criteria.items)** - проверяемые условия выполнения",
        "4. **Награда (reward)** - XP и прогресс по способностям",
        "5. **Связанные способности (linked_nodes)** - список способностей",
        "6. **Почему появился этот квест** - если есть session_id, source",
        "",
        "**Теория и примеры** находится в `QUESTS_THEORIES_MAPPING.md` и не дублируется здесь.",
        "",
        "---",
        ""
    ]
    
    # Генерируем для каждого типа
    type_names = {
        'micro': 'MICRO квесты',
        'weekly': 'WEEKLY квесты',
        'story': 'STORY квесты',
        'in-person': 'IN-PERSON квесты'
    }
    
    for quest_type in ['micro', 'weekly', 'story', 'in-person']:
        type_quests = quests_by_type[quest_type]
        if not type_quests:
            continue
        
        lines.append(f"## {type_names[quest_type]}")
        lines.append("")
        lines.append(f"Всего: {len(type_quests)}")
        lines.append("")
        
        for quest in sorted(type_quests, key=lambda x: x.get('id', '')):
            quest_id = quest.get('id', 'unknown')
            title = quest.get('title', 'Без названия')
            
            lines.append(f"### {escape_markdown(title)}")
            lines.append("")
            lines.append(f"- **ID:** `{quest_id}`")
            lines.append(f"- **Тип:** `{quest.get('type', 'unknown')}`")
            lines.append("")
            
            # 1. Описание
            description = quest.get('description', '').strip()
            if description:
                lines.append("#### 1. Описание")
                lines.append("")
                lines.append(escape_markdown(description))
                lines.append("")
            
            # 2. Теория и примеры - НЕ включаем в этот файл (только ссылка)
            # theory = quest.get('criteria', {}).get('theory_and_examples', '')
            # Пропускаем теорию - она в QUESTS_THEORIES_MAPPING.md
            
            # 2. Шаги выполнения (вместо 3, так как теорию пропускаем)
            steps = format_steps(quest.get('steps', []))
            if steps:
                lines.append("#### 2. Шаги выполнения")
                lines.append("")
                lines.append(steps)
                lines.append("")
            
            # 3. Критерии успеха
            criteria = format_criteria(quest.get('criteria'))
            if criteria:
                lines.append("#### 3. Критерии успеха")
                lines.append("")
                lines.append(criteria)
                lines.append("")
            
            # 4. Награда
            reward = format_reward(quest.get('reward'))
            if reward:
                lines.append("#### 4. Награда")
                lines.append("")
                lines.append(reward)
                lines.append("")
            
            # 5. Связанные способности
            linked_nodes = format_linked_nodes(quest.get('linked_nodes', []), node_name_map)
            if linked_nodes:
                lines.append("#### 5. Связанные способности")
                lines.append("")
                lines.append(linked_nodes)
                lines.append("")
            
            # 6. Почему появился (если есть)
            source = quest.get('source')
            session_id = quest.get('session_id')
            if source or session_id:
                lines.append("#### 6. Почему появился этот квест")
                lines.append("")
                if session_id:
                    lines.append(f"- Связан с ситуацией: `{session_id}`")
                if source:
                    lines.append(f"- Источник: `{escape_markdown(source)}`")
                lines.append("")
            
            # Примечание о теории
            theory = quest.get('criteria', {}).get('theory_and_examples', '')
            if theory:
                lines.append("> **Теория:** См. `QUESTS_THEORIES_MAPPING.md` для полного теоретического блока")
                lines.append("")
            
            lines.append("---")
            lines.append("")
    
    # Сохраняем
    output_text = "\n".join(lines)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(output_text)
    
    print(f"[OK] Создан файл: {OUTPUT_FILE}")
    print(f"[OK] Обработано квестов: {len(quests)}")
    print(f"   - Micro: {len(quests_by_type['micro'])}")
    print(f"   - Weekly: {len(quests_by_type['weekly'])}")
    print(f"   - Story: {len(quests_by_type['story'])}")
    print(f"   - In-person: {len(quests_by_type['in-person'])}")

if __name__ == "__main__":
    generate_md()

