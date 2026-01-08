#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для синхронизации всех квестов из quest-templates.json с базой данных через API
Обновляет description, steps, criteria (включая theory_and_examples и items)
Использует PATCH /api/quests/:id для каждого квеста отдельно
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

def sync_all_quests(api_url, auth_token=None):
    """Синхронизирует все квесты из шаблонов по одному"""
    
    # Читаем templates файл
    print(f"Читаю {TEMPLATES_FILE}...")
    with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
        templates_data = json.load(f)
    
    quest_templates = templates_data.get('quest_templates', [])
    
    headers = {
        'Content-Type': 'application/json',
    }
    
    if auth_token:
        headers['Authorization'] = f'Bearer {auth_token}'
    
    total_updated = 0
    total_not_found = []
    total_errors = []
    
    print(f"\nСинхронизирую {len(quest_templates)} квестов по одному через PATCH /api/quests/:id...\n")
    
    for quest_template in quest_templates:
        quest_id = quest_template.get('id')
        if not quest_id:
            continue
        
        print(f"Синхронизирую: {quest_id}...", end=' ', flush=True)
        
        # Подготавливаем данные для обновления
        update_data = {
            "description": quest_template.get('description', '').strip(),
            "steps": quest_template.get('steps', []),
            "criteria": quest_template.get('criteria', {}),
        }
        
        try:
            response = requests.patch(
                f"{api_url}/api/quests/{quest_id}",
                json=update_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                total_updated += 1
                print(f"[OK]")
            elif response.status_code == 404:
                total_not_found.append(quest_id)
                print(f"[NOT FOUND]")
            else:
                error_msg = response.text[:100]
                total_errors.append({"id": quest_id, "error": f"HTTP {response.status_code}: {error_msg}"})
                print(f"[ERROR {response.status_code}]")
        except requests.exceptions.RequestException as e:
            error_msg = str(e)[:100]
            total_errors.append({"id": quest_id, "error": error_msg})
            print(f"[ERROR: {error_msg}]")
    
    print(f"\n[SUCCESS] Синхронизация завершена!")
    print(f"  Обновлено: {total_updated}")
    print(f"  Не найдено: {len(total_not_found)}")
    if total_not_found:
        print(f"  Не найденные квесты: {', '.join(total_not_found[:10])}")
    if total_errors:
        print(f"  Ошибок: {len(total_errors)}")
        for error in total_errors[:5]:
            print(f"    - {error['id']}: {error['error']}")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Синхронизация всех квестов из шаблонов с базой данных')
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
