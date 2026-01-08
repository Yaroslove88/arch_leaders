#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для синхронизации квестов из quest-templates.json с базой данных через API
Обновляет description, steps, criteria (включая theory_and_examples и items)
"""

import json
import sys
import requests
from pathlib import Path

# Пути к файлам
BASE_DIR = Path(__file__).parent.parent
TEMPLATES_FILE = BASE_DIR / "data" / "quest-templates.json"
API_URL = "http://localhost:3001"  # Измените на ваш API URL

# Устанавливаем кодировку для вывода
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def sync_quest_from_template(quest_template, api_url, auth_token=None):
    """Синхронизирует один квест из шаблона с базой данных"""
    quest_id = quest_template.get('id')
    
    if not quest_id:
        return False, "No quest ID"
    
    # Подготавливаем данные для обновления
    update_data = {
        "title": quest_template.get('title'),
        "description": quest_template.get('description', '').strip(),
        "type": quest_template.get('type'),
        "steps": quest_template.get('steps', []),
        "criteria": quest_template.get('criteria', {}),
        "reward": quest_template.get('reward', {}),
        "linked_nodes": quest_template.get('linked_nodes', []),
        "tags": quest_template.get('tags', []),
    }
    
    # Обновляем квест через API
    headers = {
        'Content-Type': 'application/json',
    }
    
    if auth_token:
        headers['Authorization'] = f'Bearer {auth_token}'
    
    try:
        # Пытаемся обновить квест
        response = requests.put(
            f"{api_url}/api/quests/{quest_id}",
            json=update_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            return True, "Updated"
        elif response.status_code == 404:
            # Квест не найден - возможно, нужно создать
            return False, "Not found (may need to create)"
        else:
            return False, f"Error {response.status_code}: {response.text[:100]}"
    except requests.exceptions.RequestException as e:
        return False, f"Request error: {str(e)}"

def sync_all_quests(api_url, auth_token=None):
    """Синхронизирует все квесты из шаблонов"""
    
    # Читаем templates файл
    print(f"Читаю {TEMPLATES_FILE}...")
    with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
        templates_data = json.load(f)
    
    quest_templates = templates_data.get('quest_templates', [])
    
    updated_count = 0
    not_found_count = 0
    error_count = 0
    
    print(f"\nНайдено {len(quest_templates)} квестов в шаблонах")
    print(f"API URL: {api_url}")
    print(f"Начинаю синхронизацию...\n")
    
    # Синхронизируем каждый квест
    for quest_template in quest_templates:
        quest_id = quest_template.get('id')
        if not quest_id:
            continue
        
        print(f"Синхронизирую: {quest_id}")
        
        success, message = sync_quest_from_template(quest_template, api_url, auth_token)
        
        if success:
            updated_count += 1
            print(f"  [OK] Обновлен")
        else:
            if "Not found" in message:
                not_found_count += 1
                print(f"  [WARN] {message}")
            else:
                error_count += 1
                print(f"  [ERROR] {message}")
    
    print(f"\n[SUCCESS] Синхронизация завершена!")
    print(f"  Обновлено: {updated_count}")
    print(f"  Не найдено: {not_found_count}")
    print(f"  Ошибок: {error_count}")
    print(f"  Всего: {len(quest_templates)}")
    
    if not_found_count > 0:
        print(f"\n[INFO] Некоторые квесты не найдены в базе данных.")
        print(f"       Возможно, их нужно создать вручную или через другой процесс.")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Синхронизация квестов из шаблонов с базой данных')
    parser.add_argument('--api-url', default=API_URL, help='URL API сервера')
    parser.add_argument('--token', help='Токен аутентификации (опционально)')
    
    args = parser.parse_args()
    
    try:
        sync_all_quests(args.api_url, args.token)
    except Exception as e:
        print(f"[ERROR] Ошибка: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

