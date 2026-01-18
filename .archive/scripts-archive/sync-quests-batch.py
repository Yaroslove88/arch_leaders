#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для массовой синхронизации всех квестов из quest-templates.json через один запрос
Использует POST /api/quests/sync-from-templates
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

def sync_all_quests_batch(api_url, auth_token=None):
    """Синхронизирует все квесты одним запросом"""
    
    # Читаем templates файл
    print(f"Читаю {TEMPLATES_FILE}...")
    with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
        templates_data = json.load(f)
    
    quest_templates = templates_data.get('quest_templates', [])
    
    # Подготавливаем данные для синхронизации
    templates_payload = []
    for quest_template in quest_templates:
        templates_payload.append({
            "id": quest_template.get('id'),
            "description": quest_template.get('description', '').strip(),
            "steps": quest_template.get('steps', []),
            "criteria": quest_template.get('criteria', {}),
        })
    
    headers = {
        'Content-Type': 'application/json',
    }
    
    if auth_token:
        headers['Authorization'] = f'Bearer {auth_token}'
    
    print(f"\nСинхронизирую {len(templates_payload)} квестов одним запросом через POST /api/quests/sync-from-templates...\n")
    
    try:
        response = requests.post(
            f"{api_url}/api/quests/sync-from-templates",
            json={"templates": templates_payload},
            headers=headers,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"[SUCCESS] Синхронизация завершена!")
            print(f"  Обновлено: {result.get('updated', 0)}")
            if result.get('notFound'):
                print(f"  Не найдено: {len(result['notFound'])}")
                if len(result['notFound']) <= 10:
                    print(f"  Не найденные квесты: {', '.join(result['notFound'])}")
                else:
                    print(f"  Не найденные квесты (первые 10): {', '.join(result['notFound'][:10])}...")
            if result.get('errors'):
                print(f"  Ошибок: {len(result['errors'])}")
                for error in result['errors'][:5]:
                    print(f"    - {error.get('id')}: {error.get('error')}")
        else:
            print(f"[ERROR] HTTP {response.status_code}: {response.text[:200]}")
            sys.exit(1)
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Ошибка запроса: {e}")
        sys.exit(1)

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Массовая синхронизация всех квестов из шаблонов с базой данных')
    parser.add_argument('--api-url', default=API_URL, help='URL API сервера')
    parser.add_argument('--token', help='Токен аутентификации (опционально)')
    
    args = parser.parse_args()
    
    try:
        sync_all_quests_batch(args.api_url, args.token)
    except Exception as e:
        print(f"[ERROR] Ошибка: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

