---
title: Жёсткий регламент работы с деревом, XP, квестами и LLM
title_en: ops-ssot-playbook
type: reference
status: draft
domain: leadership
created: 2026-01-14
modified: 2026-01-14
tags: [ssot, ops, llm, quests, cases]
---

# Жёсткий регламент: дерево, XP, квесты/кейсы, LLM

## Инварианты SSOT (обязательны)
- Структура дерева (`TreeSemantic.data`) содержит **только**: `node_id`, `branch_id`, `tier`, `prerequisites`, `unlock_conditions`, `xp_required`, `edges/branches`. Никаких `state/xp_current/name/description`.
- Контент узлов/веток — только из `data/node-descriptions.json` и `branch-descriptions.json`.
- Пользовательские данные — только `UserAbilityState`, `Quest`, `CaseProgress`, `Session/SessionArtifact`, `ChangeLog`.
- Прогресс/XP берём из `UserAbilityState` (поле `internal_progress`), а не из дерева.

## Процедуры дерева
- Auto-sync seed → TreeSemantic пишет **structureOnly** (без пользовательских полей). Переменная `DISABLE_TREE_AUTO_SYNC=true` отключает автосинк; после обновления seed требуется ручная миграция.
- При загрузке дерева данные из БД/seed очищаются до структуры (`normalizeSeedData`).
- Миграция user state по месту: при отсутствии записи `UserAbilityState` для узла создаётся locked/available (для tier=basic) запись.
- Layout guard: если `computed_from_tree_revision` ≠ `tree_revision`, layout помечается пустым → нужно пересобрать layout.

## Прогресс/XP
- Источник истины: `UserAbilityState.state`, `internal_progress`, `stored_experience`, `relevance`.
- `AbilityStateService.loadCurrentStates` читает только БД; `xp_required` берётся из структуры seed.

## Валидации связей
- Квесты: при генерации логируем отсутствующие `linked_nodes` в текущем дереве.
- Кейсы: при загрузке валидируем `node_id/branch_id` против дерева; предупреждаем о расхождениях.
- Layout: ревизия layout должна совпадать с `TreeSemantic.tree_revision`.

## Промпты / LLM
- Анализ ситуаций: prompt_id=`analysis_situation`, version=1. Метаданные пишутся в `SessionArtifact` (`kind=raw_analysis`, `prompt_id`, `prompt_version`, `model`, `payload`).
- Теория квестов: prompt_id=`quest_theory`, version=1 — логируется при вызове генерации.
- В prod запрещено использовать mock: провайдер должен быть OpenAI/Anthropic; при отсутствии ключей — ошибка (healthcheck).

## Кэши и актуализация
- TTL 5 минут для кешей: node/branch descriptions (TreeService) и interactive cases (CasesService). `refreshContentCache()` сбрасывает node/branch кэш, `clearCache()` в CasesService — кейсы.
- При правках JSON-файлов данных обязательно сбрасывать кэши или ждать TTL.

## Оперативные команды (dev)
- Обновить кэш контента: вызвать `TreeService.refreshContentCache()`.
- Очистить кейсы: вызвать `CasesService.clearCache()`.
- Проверить отсутствие лишних полей в TreeSemantic: открыть `tree_semantic` и убедиться, что нет `state/xp_current/name/description`.
- Проверить связки: логи при старте/запросе кейсов/квестов (warn о невалидных ссылках).

## Действия при обновлении seed/контента
1) Обновить `packages/shared/src/seed/initial-ability-tree.json` (только структура).  
2) Обновить `data/node-descriptions.json`/`branch-descriptions.json` для контента.  
3) Перезапустить API либо выполнить refresh кэшей.  
4) Проверить логи на mismatch `linked_nodes` и layout ревизии.  
5) При необходимости пересобрать layout (если ревизии расходятся).

## Действия при смене ревизии дерева
- Auto-sync применит новую структуру.  
- UserAbilityState автоматически досоздаст отсутствующие узлы (locked/available для базовых).  
- Проверить layout ревизию; при несовпадении выполнить rebuild.  
- Провести ручную валидацию квестов/кейсов на корректность связей.

## Журналирование и артефакты
- Все вызовы анализа ситуаций сохраняют сырой артефакт с prompt_id/version/model.
- Логи предупреждают о недостающих node_id в квестах/кейсах, об истёкшем кэше, о рассинхроне ревизий layout.

