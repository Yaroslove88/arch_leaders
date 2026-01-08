#!/usr/bin/env python3
"""
Скрипт для дополнения теории квестов на основе методологии курса

Использует ИИ для создания детальных теорий, содержащих:
- Объяснение способности с обоснованием важности
- Пояснение терминов
- Связь с методологией архитектурного лидерства
- Примеры применения
- Практические советы
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Any, Optional
import openai
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

BASE_DIR = Path(__file__).parent.parent
TEMPLATES_FILE = BASE_DIR / "data" / "quest-templates.json"
THEORIES_FILE = BASE_DIR / "data" / "quest-theories-mapping.json"
OUTPUT_FILE = BASE_DIR / "data" / "quest-templates-enhanced.json"

# Методологическая основа курса
METHODOLOGY_BASE = """
МЕТОДОЛОГИЧЕСКАЯ ОСНОВА КУРСА "АРХИТЕКТУРНОЕ ЛИДЕРСТВО":

1. ПЕРЕХОД ОТ УПРАВЛЕНЦА К АРХИТЕКТОРУ:
   - Не контроль и иерархия, а создание среды, сцепок и форм
   - Лидер как архитектор связей, смыслов и взаимодействий
   - Создание условий для развития, а не диктат решений

2. КЛЮЧЕВЫЕ КОНЦЕПЦИИ:
   - Субъектность: способность действовать из себя, осмысленно, независимо от инструкций
   - Контейнирование напряжения (Bion): удержание напряжения без гашения и бегства
   - Различение: способность видеть различия (факты/интерпретации, роли, уровни)
   - Сборка форм: создание целого из частей без разрушения различий
   - Системное мышление: видение системы целиком (элементы, связи, зависимости)
   - Вертикальное развитие (Kegan, Torbert): переход от реактивности к зрелости

3. НАУЧНАЯ БАЗА:
   - Complexity Leadership Theory (Uhl-Bien): работа со сложными адаптивными системами
   - Self-Determination Theory (Deci & Ryan): автономная мотивация
   - Polyvagal Theory (Porges): ко-регуляция нервных систем
   - Paradoxical Leadership: интеграция противоположностей
   - Holding Environment (Winnicott, Petriglieri): создание поддерживающей среды

4. УРОВНИ РАЗВИТИЯ:
   - Реактивность/Новичок: локальные решения, контроль, геройство
   - Интеграция/Практик: сцепки, правила, контейнирование, системное мышление
   - Архитектура/Зрелость: среда, формы, передача субъектности, исчезновение лидера

5. ПРИНЦИПЫ:
   - Мир больше не работает по плану - навигация в неопределенности
   - Иерархия не гарантирует влияние - важна личная зрелость и присутствие
   - Лидер - не тот, кто знает, а тот, кто держит курс в неопределенности
   - Создание среды, где возможны различия, сцепки, субъектность, зрелость
"""


def enhance_theory_with_ai(
    quest_title: str,
    quest_description: str,
    quest_type: str,
    linked_nodes: List[str],
    current_theory: Optional[str],
    steps: List[Dict],
    criteria: Dict
) -> str:
    """Дополняет теорию квеста с помощью ИИ на основе методологии"""
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print(f"WARNING: OPENAI_API_KEY не найден, пропускаем квест: {quest_title}")
        return current_theory or ""
    
    client = openai.OpenAI(api_key=api_key)
    
    # Формируем контекст квеста
    steps_text = "\n".join([
        f"{idx + 1}. {step.get('description', step.get('text', ''))}"
        for idx, step in enumerate(steps[:10])  # Ограничиваем для промпта
    ]) if steps else "Не указаны"
    
    criteria_text = ""
    if isinstance(criteria, dict):
        if criteria.get('items'):
            criteria_text = "\n".join([f"- {item}" for item in criteria['items']])
        elif criteria.get('description'):
            criteria_text = criteria['description']
    
    # Формируем промпт
    prompt = f"""Ты — эксперт по архитектурному лидерству и развитию способностей. Твоя задача — создать или дополнить детальное теоретическое объяснение для квеста развития лидерства.

{METHODOLOGY_BASE}

КОНТЕКСТ КВЕСТА:
- Название: {quest_title}
- Описание: {quest_description}
- Тип: {quest_type}
- Связанные способности: {', '.join(linked_nodes) if linked_nodes else 'не указаны'}
- Шаги выполнения:
{steps_text}
- Критерии успеха:
{criteria_text}

{"ТЕКУЩАЯ ТЕОРИЯ (если есть, нужно дополнить и улучшить):" if current_theory else "ТЕОРИИ НЕТ — нужно создать новую:"}
{current_theory[:1000] if current_theory else "Нет"}

ЗАДАЧА:
Создай или дополни раздел "Теория" для этого квеста. Раздел должен содержать:

1. **ДЕТАЛЬНОЕ ОБЪЯСНЕНИЕ СПОСОБНОСТИ**:
   - Что это за способность в контексте архитектурного лидерства
   - Почему она критична для развития лидера (обоснование важности)
   - Как она связана с переходом от управленца к архитектору
   - Какое место занимает в вертикальном развитии (реактивность → интеграция → архитектура)
   - Как она связана с другими способностями в курсе

2. **ПОЯСНЕНИЕ ТЕРМИНОВ**:
   - Объясни все ключевые термины, используемые в квесте
   - Что они означают в контексте архитектурного лидерства
   - Как они отличаются от обыденного понимания

3. **ОБОСНОВАНИЕ ВАЖНОСТИ**:
   - Почему эта способность важна именно сейчас (в современном контексте)
   - Какие проблемы она решает
   - Что происходит, когда этой способности не хватает
   - Как она влияет на эффективность лидера

4. **СВЯЗЬ С МЕТОДОЛОГИЕЙ**:
   - Как эта способность связана с концепциями курса (субъектность, контейнирование, системное мышление и т.д.)
   - Какие научные теории и исследования её поддерживают
   - Примеры из практики архитектурного лидерства

5. **ПРИМЕРЫ ПРИМЕНЕНИЯ**:
   - 2-3 конкретных примера ситуаций из практики лидерства
   - Как способность проявляется в реальных ситуациях
   - Примеры "хорошо" и "плохо" (что происходит с/без этой способности)
   - Примеры из разных контекстов (работа с командой, принятие решений, работа с напряжением)

6. **ПРАКТИЧЕСКИЕ СОВЕТЫ**:
   - Как начать развивать эту способность
   - С чего начать, если это новая способность
   - Как заметить прогресс
   - Что делать, если не получается
   - Типичные ошибки и как их избежать

ВАЖНЫЕ ТРЕБОВАНИЯ:
- НЕ дублируй информацию из шагов выполнения (они уже описаны выше)
- НЕ дублируй критерии успеха
- ФОКУС на объяснении "ПОЧЕМУ" и "КАК", а не на "ЧТО делать" (это в шагах)
- Связывай с методологией архитектурного лидерства
- Используй научную базу и исследования, но простым языком
- Будь конкретным и практичным
- Пиши на русском языке
- Используй формат Markdown с заголовками ##, ### и списками
- Структурируй текст для легкого чтения

{"ВАЖНО: Если есть текущая теория, ДОПОЛНИ её недостающими частями, но сохрани хорошие элементы. Не просто перепиши, а УЛУЧШЬ и РАСШИРЬ." if current_theory else "ВАЖНО: Создай новую детальную теорию с нуля."}

Верни только текст теории в формате Markdown, готовый для сохранения в criteria.theory_and_examples.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Ты эксперт по архитектурному лидерству. Создаешь детальные теоретические объяснения для квестов развития лидерства, опираясь на методологию курса и научную базу."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        theory = response.choices[0].message.content.strip()
        
        # Очищаем от возможных маркеров кода
        theory = re.sub(r'```markdown\n?', '', theory)
        theory = re.sub(r'```\n?', '', theory)
        theory = theory.strip()
        
        return theory
        
    except Exception as e:
        print(f"❌ Ошибка при генерации теории для '{quest_title}': {e}")
        return current_theory or ""


def main():
    """Основная функция"""
    import sys
    import io
    # Настраиваем UTF-8 для Windows
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    print("Начало дополнения теории квестов...\n")
    
    # Загружаем шаблоны квестов
    with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    quests = data.get('quest_templates', [])
    print(f"Найдено квестов: {len(quests)}\n")
    
    enhanced = []
    updated = 0
    skipped = 0
    errors = 0
    
    for idx, quest in enumerate(quests, 1):
        try:
            quest_id = quest.get('id', 'unknown')
            quest_title = quest.get('title', 'Без названия')
            
            print(f"[{idx}/{len(quests)}] Обрабатываю: {quest_title}")
            
            # Получаем текущую теорию
            current_theory = None
            if quest.get('criteria') and isinstance(quest['criteria'], dict):
                current_theory = quest['criteria'].get('theory_and_examples')
            
            # Проверяем, нужно ли обновлять
            # Если теория уже есть и она достаточно подробная (более 500 символов), можно пропустить
            if current_theory and len(current_theory) > 500:
                # Проверяем, содержит ли она все необходимые элементы
                has_explanation = any(word in current_theory.lower() for word in ['объяснение', 'способность', 'означает'])
                has_terms = any(word in current_theory.lower() for word in ['термин', 'понятие', 'это значит'])
                has_justification = any(word in current_theory.lower() for word in ['важно', 'критичн', 'необходим', 'значение'])
                has_examples = any(word in current_theory.lower() for word in ['пример', 'ситуац', 'случа'])
                
                if has_explanation and has_examples:
                    print(f"  -> Теория уже достаточно подробная, пропускаю")
                    enhanced.append(quest)
                    skipped += 1
                    continue
            
            # Дополняем теорию с помощью ИИ
            enhanced_theory = enhance_theory_with_ai(
                quest_title=quest_title,
                quest_description=quest.get('description', ''),
                quest_type=quest.get('type', 'micro'),
                linked_nodes=quest.get('linked_nodes', []),
                current_theory=current_theory,
                steps=quest.get('steps', []),
                criteria=quest.get('criteria', {})
            )
            
            if enhanced_theory and enhanced_theory != current_theory:
                # Обновляем теорию в квесте
                if not quest.get('criteria'):
                    quest['criteria'] = {}
                
                if not isinstance(quest['criteria'], dict):
                    quest['criteria'] = {'type': 'custom', 'theory_and_examples': enhanced_theory}
                else:
                    quest['criteria']['theory_and_examples'] = enhanced_theory
                
                updated += 1
                print(f"  OK Теория обновлена ({len(enhanced_theory)} символов)")
            else:
                print(f"  -> Теория не изменилась")
            
            enhanced.append(quest)
            
        except Exception as e:
            errors += 1
            print(f"  ERROR: {e}")
            enhanced.append(quest)
        
        print()  # Пустая строка для читаемости
    
    # Сохраняем результат
    output_data = {'quest_templates': enhanced}
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nРезультаты:")
    print(f"   Обновлено: {updated}")
    print(f"   Пропущено: {skipped}")
    print(f"   Ошибок: {errors}")
    print(f"\nФайл сохранен: {OUTPUT_FILE}")
    print(f"\nПроверьте результат перед заменой оригинального файла!")


if __name__ == "__main__":
    main()

