#!/usr/bin/env python3
"""
Скрипт для реструктуризации quest-templates.json

Исправляет архитектуру данных квестов:
- Разделяет description на краткое описание, шаги, критерии
- Интегрирует теорию из quest-theories-mapping.json в criteria.theory_and_examples
- Удаляет дублирование и мусорные данные
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

# Пути к файлам
BASE_DIR = Path(__file__).parent.parent
TEMPLATES_FILE = BASE_DIR / "data" / "quest-templates.json"
THEORIES_FILE = BASE_DIR / "data" / "quest-theories-mapping.json"
OUTPUT_FILE = BASE_DIR / "data" / "quest-templates-restructured.json"


def parse_description(description: str) -> Dict[str, Any]:
    """Парсит description и извлекает структурированные данные"""
    if not description:
        return {
            "short_description": "",
            "steps": [],
            "criteria_items": [],
            "theory_text": None
        }
    
    # Ищем раздел "Подробнее (теория и примеры):"
    theory_match = re.search(
        r'Подробнее\s*\(теория\s*и\s*примеры\)\s*:?\s*\n(.+)$',
        description,
        re.IGNORECASE | re.DOTALL
    )
    theory_text = theory_match.group(1).strip() if theory_match else None
    
    # Удаляем теорию из description, если она там была
    if theory_match:
        description = description[:theory_match.start()].strip()
    
    # Извлекаем краткое описание (до "Шаги:" или "Подготовка:")
    steps_match = re.search(r'\n\s*Шаги\s*:\s*\n', description, re.IGNORECASE)
    prep_match = re.search(r'\n\s*Подготовка\s*:\s*\n', description, re.IGNORECASE)
    
    if steps_match:
        short_description = description[:steps_match.start()].strip()
        remaining = description[steps_match.end():].strip()
    elif prep_match:
        short_description = description[:prep_match.start()].strip()
        remaining = description[prep_match.start():].strip()
    else:
        short_description = description
        remaining = ""
    
    # Извлекаем шаги
    steps = []
    if remaining:
        # Для структурированных квестов (Подготовка, Встреча, После встречи)
        if 'Подготовка:' in remaining or 'Встреча:' in remaining or 'После встречи:' in remaining:
            # Извлекаем этапы
            prep_match = re.search(r'Подготовка\s*:\s*\n(.+?)(?=\n\s*Встреча|$)', remaining, re.IGNORECASE | re.DOTALL)
            meeting_match = re.search(r'Встреча\s*:\s*\n(.+?)(?=\n\s*После встречи|$)', remaining, re.IGNORECASE | re.DOTALL)
            after_match = re.search(r'После встречи\s*:\s*\n(.+?)(?=\n\s*Критерии|$)', remaining, re.IGNORECASE | re.DOTALL)
            
            step_order = 1
            if prep_match:
                prep_text = prep_match.group(1).strip()
                # Извлекаем нумерованные пункты
                prep_items = re.findall(r'^(\d+)\.\s+(.+?)(?=^\d+\.|^[-•]|$)', prep_text, re.MULTILINE)
                for _, item in prep_items:
                    if len(item.strip()) > 3:
                        steps.append({
                            "order": step_order,
                            "title": "Подготовка",
                            "description": item.strip()
                        })
                        step_order += 1
                # Если нет нумерации, берем весь блок
                if not prep_items and prep_text:
                    steps.append({
                        "order": step_order,
                        "title": "Подготовка",
                        "description": prep_text
                    })
                    step_order += 1
            
            if meeting_match:
                meeting_text = meeting_match.group(1).strip()
                # Извлекаем маркированные пункты
                meeting_items = re.findall(r'^[-•]\s+(.+?)(?=^[-•]|$)', meeting_text, re.MULTILINE)
                if meeting_items:
                    for item in meeting_items:
                        if len(item.strip()) > 3:
                            steps.append({
                                "order": step_order,
                                "title": "Встреча",
                                "description": item.strip()
                            })
                            step_order += 1
                else:
                    steps.append({
                        "order": step_order,
                        "title": "Встреча",
                        "description": meeting_text
                    })
                    step_order += 1
            
            if after_match:
                after_text = after_match.group(1).strip()
                # Извлекаем нумерованные пункты
                after_items = re.findall(r'^(\d+)\.\s+(.+?)(?=^\d+\.|^[-•]|$)', after_text, re.MULTILINE)
                for _, item in after_items:
                    if len(item.strip()) > 3:
                        steps.append({
                            "order": step_order,
                            "title": "После встречи",
                            "description": item.strip()
                        })
                        step_order += 1
                # Если нет нумерации, берем весь блок
                if not after_items and after_text:
                    steps.append({
                        "order": step_order,
                        "title": "После встречи",
                        "description": after_text
                    })
                    step_order += 1
        else:
            # Паттерн для нумерованных шагов (обычный формат)
            step_pattern = r'^(\d+)\.\s+(.+?)(?=^\d+\.|^Критерии|^Награда|^Связанные|^Условия|$)'
            step_matches = re.finditer(step_pattern, remaining, re.MULTILINE | re.DOTALL)
            for match in step_matches:
                step_num = int(match.group(1))
                step_text = match.group(2).strip()
                if len(step_text) > 3:  # Игнорируем мусор
                    steps.append({
                        "order": step_num,
                        "title": None,
                        "description": step_text
                    })
    
    # Извлекаем критерии
    criteria_items = []
    criteria_match = re.search(r'\n\s*Критерии\s*:\s*\n(.+?)(?=\n\s*Награда|$)', remaining, re.IGNORECASE | re.DOTALL)
    if criteria_match:
        criteria_text = criteria_match.group(1).strip()
        # Извлекаем элементы списка (маркированные)
        for line in criteria_text.split('\n'):
            line = line.strip()
            if line.startswith('-') or line.startswith('•'):
                item = line.lstrip('-•').strip()
                if len(item) > 3:
                    criteria_items.append(item)
    
    return {
        "short_description": short_description,
        "steps": steps,
        "criteria_items": criteria_items,
        "theory_text": theory_text
    }


def find_theory_for_quest(title: str, linked_nodes: List[str], theories: List[Dict]) -> Optional[str]:
    """Находит теорию для квеста по названию или связанным узлам"""
    # Сначала ищем по точному совпадению названия
    for theory_item in theories:
        if theory_item.get("title") == title:
            return theory_item.get("theory")
    
    # Если не нашли, ищем по linked_nodes
    if linked_nodes:
        for theory_item in theories:
            theory_nodes = theory_item.get("linkedNodes", [])
            if any(node in theory_nodes for node in linked_nodes):
                return theory_item.get("theory")
    
    return None


def extract_reward_info(description: str) -> Dict[str, Any]:
    """Извлекает информацию о награде из description"""
    reward = {}
    
    # XP
    xp_match = re.search(r'(\d+)\s*XP', description, re.IGNORECASE)
    if xp_match:
        reward["xp"] = int(xp_match.group(1))
    
    # Skill XP (формат: +50 к "Контейнирование")
    skill_xp_match = re.search(r'\+(\d+)\s+к\s+["\'](.+?)["\']', description)
    if skill_xp_match:
        reward["skill_xp"] = int(skill_xp_match.group(1))
    
    # Множественные награды за узлы (формат: +250 к "Системное мышление", +250 к "Мышление через форму")
    skill_xp_matches = re.findall(r'\+(\d+)\s+к\s+["\'](.+?)["\']', description)
    if skill_xp_matches:
        if not reward.get("nodes"):
            reward["nodes"] = {}
        # Здесь нужно будет маппить названия на node_id, но пока просто сохраняем структуру
    
    return reward


def extract_linked_nodes(description: str) -> List[str]:
    """Извлекает связанные узлы из description"""
    nodes_match = re.search(r'Связанные\s+узлы\s*:\s*([^\n]+)', description, re.IGNORECASE)
    if nodes_match:
        nodes_str = nodes_match.group(1).strip()
        # Извлекаем node_id (формат: node_containment или node_system_thinking, node_recovery)
        node_ids = re.findall(r'node_\w+', nodes_str)
        return node_ids
    return []


def restructure_quest(quest: Dict[str, Any], theories: List[Dict]) -> Dict[str, Any]:
    """Реструктурирует один квест"""
    # Парсим description
    parsed = parse_description(quest.get("description", ""))
    
    # Извлекаем дополнительную информацию из description
    reward_info = extract_reward_info(quest.get("description", ""))
    linked_nodes = extract_linked_nodes(quest.get("description", ""))
    
    # Объединяем награды
    if reward_info:
        quest_reward = quest.get("reward", {})
        if quest_reward.get("xp"):
            reward_info["xp"] = quest_reward["xp"]
        if quest_reward.get("skill_xp"):
            reward_info["skill_xp"] = quest_reward["skill_xp"]
        quest["reward"] = reward_info
    
    # Обновляем linked_nodes, если они найдены в description
    if linked_nodes:
        quest["linked_nodes"] = linked_nodes
    
    # Обновляем краткое описание - делаем более подробным
    if parsed["short_description"]:
        new_description = parsed["short_description"]
        
        # Если описание короткое, добавляем информацию о связанных способностях
        linked_nodes = quest.get("linked_nodes") or extract_linked_nodes(quest.get("description", ""))
        if len(new_description) < 150 and linked_nodes:
            # Добавляем информацию о том, что квест помогает развить способность
            new_description += f" Этот квест направлен на развитие способностей через практику."
        
        quest["description"] = new_description
    elif quest.get("description"):
        # Если нет короткого описания, но есть полное - используем его
        # Но всё равно обрезаем, если там всё содержимое
        description = quest.get("description", "")
        # Проверяем, не содержит ли описание всё (шаги, критерии и т.д.)
        if "Шаги:" in description or "Подготовка:" in description or "Критерии:" in description:
            # Это старое описание со всем содержимым, оставляем только первую часть
            lines = description.split('\n')
            short_lines = []
            for line in lines[:3]:  # Берем первые 3 строки
                if line.strip() and not line.strip().startswith(('Шаги:', 'Критерии:', 'Награда:', 'Подготовка:', 'Встреча:')):
                    short_lines.append(line)
            if short_lines:
                quest["description"] = '\n'.join(short_lines).strip()
    
    # Обновляем шаги
    if parsed["steps"]:
        quest["steps"] = parsed["steps"]
    elif quest.get("steps"):
        # Очищаем мусорные шаги
        valid_steps = []
        for step in quest["steps"]:
            if isinstance(step, dict):
                step_desc = step.get("description", "").strip()
                step_title = step.get("title", "").strip()
                # Пропускаем мусор (одиночные буквы, пустые строки)
                if (step_desc and len(step_desc) > 3 and not re.match(r'^[А-Я]$', step_desc)) or \
                   (step_title and len(step_title) > 3 and not re.match(r'^[А-Я]$', step_title)):
                    valid_steps.append(step)
        if valid_steps:
            quest["steps"] = valid_steps
        else:
            quest["steps"] = []
    
    # Обновляем критерии
    criteria = quest.get("criteria", {})
    if not isinstance(criteria, dict):
        criteria = {"type": "custom", "description": ""}
    
    # Добавляем items, если они есть
    if parsed["criteria_items"]:
        criteria["items"] = parsed["criteria_items"]
    
    # Очищаем мусорное описание критериев
    if criteria.get("description") and len(criteria["description"].strip()) <= 3:
        if criteria.get("items"):
            # Если есть items, удаляем description
            criteria.pop("description", None)
        else:
            criteria["description"] = "Выполнены все шаги квеста"
    
    # Добавляем теорию
    theory = parsed["theory_text"]
    if not theory:
        # Пытаемся найти теорию в quest-theories-mapping.json
        theory = find_theory_for_quest(
            quest.get("title", ""),
            quest.get("linked_nodes", []),
            theories
        )
    
    if theory:
        criteria["theory_and_examples"] = theory
    
    quest["criteria"] = criteria
    
    return quest


def main():
    """Основная функция"""
    print("Загрузка файлов...")
    
    # Загружаем шаблоны квестов
    with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Загружаем теории
    with open(THEORIES_FILE, 'r', encoding='utf-8') as f:
        theories = json.load(f)
    
    print(f"Найдено квестов: {len(data.get('quest_templates', []))}")
    print(f"Найдено теорий: {len(theories)}")
    
    # Реструктурируем каждый квест
    restructured = []
    for quest in data.get("quest_templates", []):
        try:
            restructured_quest = restructure_quest(quest, theories)
            restructured.append(restructured_quest)
        except Exception as e:
            print(f"Ошибка при обработке квеста '{quest.get('title', 'unknown')}': {e}")
            # Добавляем как есть
            restructured.append(quest)
    
    # Сохраняем результат
    output_data = {"quest_templates": restructured}
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nРеструктуризация завершена!")
    print(f"Результат сохранен в: {OUTPUT_FILE}")
    print(f"\nОбработано квестов: {len(restructured)}")


if __name__ == "__main__":
    main()

