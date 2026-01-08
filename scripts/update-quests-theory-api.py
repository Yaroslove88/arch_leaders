#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для обновления теории всех квестов через API endpoint
Использует POST /api/quests/update-theories-from-mapping
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

def update_theories_via_api(api_url, auth_token=None):
    """Обновляет теории всех квестов через API"""
    
    # Читаем templates файл
    print(f"Читаю {TEMPLATES_FILE}...")
    with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
        templates_data = json.load(f)
    
    quest_templates = templates_data.get('quest_templates', [])
    
    # Подготавливаем маппинг для API
    mapping = []
    
    for quest_template in quest_templates:
        quest_id = quest_template.get('id')
        title = quest_template.get('title')
        linked_nodes = quest_template.get('linked_nodes', [])
        theory = None
        
        # Извлекаем теорию из criteria
        criteria = quest_template.get('criteria', {})
        if isinstance(criteria, dict):
            theory = criteria.get('theory_and_examples')
        
        if theory and isinstance(theory, str) and theory.strip():
            mapping.append({
                "title": title,
                "linkedNodes": linked_nodes,
                "theory": theory
            })
            print(f"  [OK] {quest_id}: {title[:50]}...")
        else:
            print(f"  [WARN] {quest_id}: нет теории")
    
    if not mapping:
        print("[ERROR] Нет теорий для обновления")
        return
    
    # Отправляем запрос на обновление
    headers = {
        'Content-Type': 'application/json',
    }
    
    if auth_token:
        headers['Authorization'] = f'Bearer {auth_token}'
    
    print(f"\nОтправляю {len(mapping)} теорий на обновление...")
    
    try:
        response = requests.post(
            f"{api_url}/api/quests/update-theories-from-mapping",
            json={"mapping": mapping},
            headers=headers,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n[SUCCESS] Обновление завершено!")
            print(f"  Обновлено: {result.get('updated', 0)}")
            print(f"  Не найдено: {len(result.get('notFound', []))}")
            if result.get('notFound'):
                print(f"  Не найденные квесты: {', '.join(result['notFound'][:5])}")
        else:
            print(f"[ERROR] Ошибка {response.status_code}: {response.text[:200]}")
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Ошибка запроса: {e}")
        print(f"\n[INFO] Убедитесь, что API сервер запущен на {api_url}")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Обновление теорий квестов через API')
    parser.add_argument('--api-url', default=API_URL, help='URL API сервера')
    parser.add_argument('--token', help='Токен аутентификации (опционально)')
    
    args = parser.parse_args()
    
    try:
        update_theories_via_api(args.api_url, args.token)
    except Exception as e:
        print(f"[ERROR] Ошибка: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

