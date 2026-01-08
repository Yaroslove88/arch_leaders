#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Принудительная синхронизация базовых квестов из контентной базы в веб
Удаляет старые базовые квесты и создает новые из QUESTS_STRUCTURED_CONTENT.md и QUESTS_THEORIES_MAPPING.md
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
    """Получить все квесты из API (без аутентификации для базовых квестов)"""
    # Пробуем получить через публичный endpoint или с токеном
    headers = {}
    if auth_token:
        headers['Authorization'] = f'Bearer {auth_token}'
    
    try:
        # Пробуем без аутентификации (если endpoint публичный)
        response = requests.get(f"{api_url}/api/quests", timeout=30)
        if response.status_code == 200:
            data = response.json()
            return data.get('quests', []) if isinstance(data, dict) else data
        elif response.status_code == 401 and auth_token:
            # Пробуем с токеном
            headers['Authorization'] = f'Bearer {auth_token}'
            response = requests.get(f"{api_url}/api/quests", headers=headers, timeout=30)
            if response.status_code == 200:
                data = response.json()
                return data.get('quests', []) if isinstance(data, dict) else data
    except:
        pass
    
    return []

def delete_quest(api_url, quest_id, auth_token=None):
    """Удалить квест"""
    headers = {}
    if auth_token:
        headers['Authorization'] = f'Bearer {auth_token}'
    
    try:
        response = requests.delete(f"{api_url}/api/quests/{quest_id}", headers=headers, timeout=30)
        return response.status_code in [200, 204, 404]  # 404 тоже OK - значит уже удален
    except:
        return False

def create_quest(api_url, quest_data, auth_token=None):
    """Создать квест"""
    headers = {'Content-Type': 'application/json'}
    if auth_token:
        headers['Authorization'] = f'Bearer {auth_token}'
    
    try:
        response = requests.post(
            f"{api_url}/api/quests",
            json=quest_data,
            headers=headers,
            timeout=30
        )
        if response.status_code in [200, 201]:
            return True, response.json()
        else:
            return False, f"HTTP {response.status_code}: {response.text[:200]}"
    except Exception as e:
        return False, str(e)

def update_quest(api_url, quest_id, quest_data, auth_token=None):
    """Обновить квест"""
    headers = {'Content-Type': 'application/json'}
    if auth_token:
        headers['Authorization'] = f'Bearer {auth_token}'
    
    try:
        response = requests.patch(
            f"{api_url}/api/quests/{quest_id}",
            json=quest_data,
            headers=headers,
            timeout=30
        )
        return response.status_code == 200
    except:
        return False

def force_sync_quests(api_url, auth_token=None):
    """Принудительная синхронизация: удаляем старые, создаем новые"""
    
    # Читаем шаблоны
    print(f"Читаю {TEMPLATES_FILE}...")
    with open(TEMPLATES_FILE, 'r', encoding='utf-8') as f:
        templates_data = json.load(f)
    
    quest_templates = templates_data.get('quest_templates', [])
    print(f"Найдено {len(quest_templates)} шаблонов квестов\n")
    
    # Получаем существующие квесты
    print("Получаю существующие квесты из базы...")
    existing_quests = get_all_quests(api_url, auth_token)
    
    # Создаем индекс существующих квестов по title
    quests_by_title = {}
    if existing_quests:
        for quest in existing_quests:
            title = quest.get('title', '').strip()
            if title:
                if title not in quests_by_title:
                    quests_by_title[title] = []
                quests_by_title[title].append(quest)
        print(f"Найдено {len(existing_quests)} существующих квестов")
    else:
        print("Существующие квесты не найдены (возможно, нужна аутентификация)")
    
    print(f"\nНачинаю синхронизацию...\n")
    
    created = 0
    updated = 0
    deleted = 0
    errors = []
    
    # Обрабатываем каждый шаблон
    for template in quest_templates:
        template_title = template.get('title', '').strip()
        template_id = template.get('id', '')
        
        if not template_title:
            continue
        
        print(f"Обрабатываю: {template_title}...", end=' ', flush=True)
        
        # Формируем данные квеста
        quest_data = {
            "title": template_title,
            "description": template.get('description', '').strip(),
            "type": template.get('type', 'micro'),
            "steps": template.get('steps', []),
            "criteria": template.get('criteria', {}),
            "reward": template.get('reward', {}),
            "linked_nodes": template.get('linked_nodes', []),
            "tags": template.get('tags', []),
        }
        
        # Если есть существующие квесты с таким title - удаляем старые и обновляем/создаем
        existing = quests_by_title.get(template_title, [])
        
        if existing:
            # Удаляем все старые версии
            for old_quest in existing:
                old_id = old_quest.get('id')
                if old_id:
                    if delete_quest(api_url, old_id, auth_token):
                        deleted += 1
            
            # Создаем новый
            success, result = create_quest(api_url, quest_data, auth_token)
            if success:
                created += 1
                print("[CREATED]")
            else:
                errors.append({"title": template_title, "error": result})
                print(f"[ERROR: {result}]")
        else:
            # Создаем новый
            success, result = create_quest(api_url, quest_data, auth_token)
            if success:
                created += 1
                print("[CREATED]")
            else:
                # Если не удалось создать (возможно нужна аутентификация), пробуем обновить через другой способ
                errors.append({"title": template_title, "error": result})
                print(f"[ERROR: {result}]")
    
    print(f"\n[SUCCESS] Синхронизация завершена!")
    print(f"  Создано: {created}")
    print(f"  Удалено старых: {deleted}")
    if errors:
        print(f"  Ошибок: {len(errors)}")
        print(f"\nПервый 5 ошибок:")
        for error in errors[:5]:
            print(f"    - {error['title']}: {error['error']}")
        if len(errors) > 5:
            print(f"    ... и еще {len(errors) - 5} ошибок")
    
    if errors and "401" in str(errors[0].get('error', '')):
        print(f"\n[WARNING] Возможно требуется аутентификация.")
        print(f"Попробуйте запустить с токеном:")
        print(f"  python scripts/force-sync-quests-from-base.py --api-url {api_url} --token YOUR_TOKEN")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Принудительная синхронизация базовых квестов из контентной базы')
    parser.add_argument('--api-url', default=API_URL, help='URL API сервера')
    parser.add_argument('--token', help='Токен аутентификации (опционально)')
    
    args = parser.parse_args()
    
    try:
        force_sync_quests(args.api_url, args.token)
    except Exception as e:
        print(f"[ERROR] Ошибка: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

