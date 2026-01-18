#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для синхронизации квестов из quest-templates.json с базой данных через API
Ищет квесты по title вместо id, так как в базе данных id - это UUID
"""

import json
import sys
import requests
from pathlib import Path

# Пути к файлам
BASE_DIR = Path(__file__).parent.parent
TEMPLATES_FILE = BASE_DIR / "data" / "quest-templates.json"
API_URL = "http://localhost:3001"

# Устанавливаем кодировку для вывода
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def get_all_quests(api_url, auth_token=None):
    """Получить все квесты из API"""
    headers = {}
    if auth_token:
        headers['Authorization'] = f'Bearer {auth_token}'
    
    try:
        response = requests.get(f"{api_url}/api/quests", headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return data.get('quests', []) if isinstance(data, dict) else data
        else:
            print(f"[ERROR] Не удалось получить квесты: HTTP {response.status_code}")
            return []
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Ошибка при получении квестов: {e}")
        return []

def sync_quests_by_title(api_url, auth_token=None):
    """Синхронизирует квесты, ища их по title"""
    
    # Читаем templates файл
    print(f"Читаю {TEMPLATES_FILE}...")
    with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
        templates_data = json.load(f)
    
    quest_templates = templates_data.get('quest_templates', [])
    
    # Получаем все квесты из базы данных
    print("\nПолучаю все квесты из базы данных...")
    all_quests = get_all_quests(api_url, auth_token)
    
    if not all_quests:
        print("[WARNING] Не найдено квестов в базе данных.")
        print("Квесты должны быть созданы перед синхронизацией.")
        return
    
    # Создаем индекс квестов по title
    quests_by_title = {quest.get('title'): quest for quest in all_quests if quest.get('title')}
    
    print(f"Найдено {len(quests_by_title)} квестов в базе данных.\n")
    
    headers = {
        'Content-Type': 'application/json',
    }
    
    if auth_token:
        headers['Authorization'] = f'Bearer {auth_token}'
    
    total_updated = 0
    total_not_found = []
    total_errors = []
    
    print(f"Синхронизирую {len(quest_templates)} квестов...\n")
    
    for quest_template in quest_templates:
        template_title = quest_template.get('title', '').strip()
        template_id = quest_template.get('id')
        
        if not template_title:
            continue
        
        # Ищем квест по title
        quest_in_db = quests_by_title.get(template_title)
        
        if not quest_in_db:
            total_not_found.append(f"{template_id} ({template_title})")
            print(f"[NOT FOUND] {template_title} (id: {template_id})")
            continue
        
        quest_db_id = quest_in_db.get('id')
        print(f"Синхронизирую: {template_title} (DB id: {quest_db_id})...", end=' ', flush=True)
        
        # Подготавливаем данные для обновления
        update_data = {
            "description": quest_template.get('description', '').strip(),
            "steps": quest_template.get('steps', []),
            "criteria": quest_template.get('criteria', {}),
        }
        
        try:
            response = requests.patch(
                f"{api_url}/api/quests/{quest_db_id}",
                json=update_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                total_updated += 1
                print(f"[OK]")
            else:
                error_msg = response.text[:100]
                total_errors.append({"id": template_id, "title": template_title, "error": f"HTTP {response.status_code}: {error_msg}"})
                print(f"[ERROR {response.status_code}]")
        except requests.exceptions.RequestException as e:
            error_msg = str(e)[:100]
            total_errors.append({"id": template_id, "title": template_title, "error": error_msg})
            print(f"[ERROR: {error_msg}]")
    
    print(f"\n[SUCCESS] Синхронизация завершена!")
    print(f"  Обновлено: {total_updated}")
    print(f"  Не найдено: {len(total_not_found)}")
    if total_not_found:
        print(f"  Не найденные квесты (первые 10):")
        for not_found in total_not_found[:10]:
            print(f"    - {not_found}")
    if total_errors:
        print(f"  Ошибок: {len(total_errors)}")
        for error in total_errors[:5]:
            print(f"    - {error.get('title')}: {error.get('error')}")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Синхронизация квестов из шаблонов с базой данных (поиск по title)')
    parser.add_argument('--api-url', default=API_URL, help='URL API сервера')
    parser.add_argument('--token', help='Токен аутентификации (опционально)')
    
    args = parser.parse_args()
    
    try:
        sync_quests_by_title(args.api_url, args.token)
    except Exception as e:
        print(f"[ERROR] Ошибка: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

