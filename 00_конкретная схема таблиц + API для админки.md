# 0) Принципы (важно для админки)

1. **RBAC + аудит**: любые “опасные” операции (просмотр приватного текста, пересчёты, правка конфигов) требуют `reason` и пишутся в `admin_audit_log`.
    
2. **Версионирование**: результаты анализа, конфиги, промпты — versioned. Никаких “затираний”.
    
3. **Recompute = async job**: все пересчёты только через очередь.
    
4. **“User 360” быстро**: под админку нужна либо денормализация, либо аккуратные индексы + “последние N событий” быстрыми запросами.
    

---

# 1) Таблицы (DDL-уровень, логическая схема)

## 1.1 Users / Admin

### `users`

- `id` UUID PK
    
- `email` citext unique
    
- `status` enum: `active|blocked|deleted`
    
- `created_at` timestamptz
    
- `last_seen_at` timestamptz null
    

**Индексы**

- `users_email_uq` (unique)
    
- `users_status_created_idx` (`status`, `created_at desc`)
    
- `users_last_seen_idx` (`last_seen_at desc`)
    

### `admin_users`

- `id` UUID PK
    
- `email` citext unique
    
- `role` enum: `super_admin|operator|analyst`
    
- `created_at`
    
- `last_login_at`
    

### `admin_audit_log`

- `id` UUID PK
    
- `admin_user_id` FK
    
- `action` text (enum-like)
    
- `target_type` text (`user|entry|session|quest|config|prompt|job`)
    
- `target_id` UUID/text
    
- `reason` text null (required for sensitive)
    
- `metadata` jsonb (diff, params)
    
- `ip` inet null
    
- `created_at` timestamptz
    

**Индексы**

- `audit_created_idx` (`created_at desc`)
    
- `audit_admin_created_idx` (`admin_user_id`, `created_at desc`)
    
- `audit_target_idx` (`target_type`, `target_id`, `created_at desc`)
    
- GIN по `metadata` (опционально): `audit_metadata_gin`
    

---

## 1.2 Entries / Sessions / Analysis

### `entries`

- `id` UUID PK
    
- `user_id` FK
    
- `type` enum: `situation|reflection|feedback`
    
- `source` enum: `web|telegram|api`
    
- `title` text null
    
- `content_raw` text (можно шифровать на уровне приложения)
    
- `content_masked` text null (для operator)
    
- `is_sensitive` bool default false
    
- `created_at`
    

**Индексы**

- `entries_user_created_idx` (`user_id`, `created_at desc`)
    
- `entries_type_created_idx` (`type`, `created_at desc`)
    
- `entries_source_created_idx` (`source`, `created_at desc`)
    
- `entries_sensitive_idx` (`is_sensitive`, `created_at desc`)
    

### `sessions`

Сессия = результат анализа одного entry (или группы, если позже появится batching).

- `id` UUID PK
    
- `user_id` FK
    
- `entry_id` FK unique (в MVP 1:1)
    
- `status` enum: `pending|processing|succeeded|failed`
    
- `analysis_version` int (версия пайплайна)
    
- `created_at`
    
- `completed_at` null
    
- `error_code` text null
    
- `error_message` text null
    

**Индексы**

- `sessions_user_created_idx` (`user_id`, `created_at desc`)
    
- `sessions_status_created_idx` (`status`, `created_at desc`)
    
- `sessions_entry_idx` (`entry_id`)
    

### `session_artifacts` (версионирование выходов LLM)

- `id` UUID PK
    
- `session_id` FK
    
- `kind` enum: `summary|themes|patterns|tensions|insights|ability_signals|quest_candidates|raw_json`
    
- `version` int (1..n)
    
- `prompt_id` text null
    
- `prompt_version` int null
    
- `model` text null
    
- `payload` jsonb
    
- `created_at`
    

**Индексы**

- `artifacts_session_kind_ver_idx` (`session_id`, `kind`, `version desc`)
    
- GIN `artifacts_payload_gin` (опционально)
    

---

## 1.3 Ability Tree / Progress / ChangeLog

### `ability_nodes`

Каталог узлов (глобальный).

- `id` text PK (например `node_architecture_coupling`)
    
- `branch` enum/text
    
- `title` text
    
- `description` text
    
- `level` enum: `basic|mid|advanced|master`
    
- `conditions` jsonb (unlock criteria)
    
- `created_at`
    

**Индексы**

- `ability_nodes_branch_level_idx` (`branch`, `level`)
    
- GIN `conditions_gin` (если будешь искать)
    

### `user_ability_state`

Состояние узла у пользователя.

- `user_id` FK
    
- `node_id` FK
    
- `state` enum: `locked|available|active|unlocked|integrated`
    
- `progress` numeric(5,4) default 0.0 (0..1+)
    
- `relevance` numeric(5,4) default 0.0 (актуальность)
    
- `last_updated_at`
    

PK: (`user_id`, `node_id`)

**Индексы**

- `uas_user_state_idx` (`user_id`, `state`, `last_updated_at desc`)
    
- `uas_user_progress_idx` (`user_id`, `progress desc`)
    
- `uas_state_updated_idx` (`state`, `last_updated_at desc`) (для агрегатов)
    

### `change_log`

- `id` UUID PK
    
- `user_id` FK
    
- `scope` enum: `ability|quest|settings|system`
    
- `entity_type` text (`node|quest|config`)
    
- `entity_id` text/uuid
    
- `action` enum: `create|update|unlock|integrate|regenerate|undo`
    
- `before` jsonb
    
- `after` jsonb
    
- `rationale` text
    
- `references` jsonb (entry_ids, evidence_ids, session_id)
    
- `created_at`
    
- `is_undoable` bool default true
    
- `undone_at` timestamptz null
    
- `undone_by_admin` uuid null
    

**Индексы**

- `changelog_user_created_idx` (`user_id`, `created_at desc`)
    
- `changelog_scope_created_idx` (`scope`, `created_at desc`)
    
- `changelog_entity_idx` (`entity_type`, `entity_id`, `created_at desc`)
    
- GIN `references_gin`
    

---

## 1.4 Quests / Evidence

### `quests`

- `id` UUID PK
    
- `user_id` FK
    
- `title` text
    
- `type` enum: `micro|weekly|story|in_person`
    
- `status` enum: `backlog|active|completed|failed|archived`
    
- `branch` text
    
- `linked_nodes` text[] (или отдельная таблица link)
    
- `criteria` jsonb
    
- `steps` jsonb
    
- `rewards` jsonb
    
- `created_at`
    
- `activated_at` null
    
- `completed_at` null
    

**Индексы**

- `quests_user_status_idx` (`user_id`, `status`, `created_at desc`)
    
- `quests_user_type_idx` (`user_id`, `type`, `created_at desc`)
    
- `quests_status_created_idx` (`status`, `created_at desc`)
    
- GIN `quests_linked_nodes_gin` (если массив)
    
- GIN `quests_criteria_gin` (опционально)
    

### `evidences`

- `id` UUID PK
    
- `user_id` FK
    
- `source` enum: `web|telegram`
    
- `type` enum: `situation|observation|reflection|external_feedback`
    
- `content_raw` text
    
- `created_at`
    

**Индексы**

- `evidence_user_created_idx` (`user_id`, `created_at desc`)
    
- `evidence_type_created_idx` (`type`, `created_at desc`)
    

### `evidence_links`

- `evidence_id` FK
    
- `link_type` enum: `quest|node|entry|session`
    
- `link_id` uuid/text
    
- `created_at`
    

PK: (`evidence_id`, `link_type`, `link_id`)

**Индексы**

- `evidence_links_link_idx` (`link_type`, `link_id`, `created_at desc`)
    

---

## 1.5 Config / Prompt Registry (для “формулы смотреть/досчитать”)

### `config_sets`

- `id` UUID PK
    
- `name` text (например `prod_default`)
    
- `status` enum: `draft|active|deprecated`
    
- `created_at`
    
- `created_by_admin` uuid
    

### `config_versions`

- `id` UUID PK
    
- `config_set_id` FK
    
- `version` int
    
- `payload` jsonb (веса, пороги, лимиты)
    
- `comment` text
    
- `created_at`
    
- `created_by_admin` uuid
    
- `activated_at` null
    

**Индексы**

- `config_set_ver_idx` (`config_set_id`, `version desc`)
    
- GIN `config_payload_gin`
    

### `user_config_bindings`

- `user_id` FK
    
- `config_set_id` FK
    
- `pinned_version` int null (если нужно “прикрепить”)
    
- `created_at`
    

PK (`user_id`, `config_set_id`)

### `prompt_registry`

- `prompt_id` text
    
- `version` int
    
- `status` enum: `draft|active|deprecated`
    
- `purpose` enum: `extract|summarize|quest_generate|ability_update|digest`
    
- `template` text (или хранить в s3, а тут ссылку)
    
- `schema` jsonb (ожидаемый JSON output)
    
- `created_at`
    
- `created_by_admin`
    

PK (`prompt_id`, `version`)

**Индексы**

- `prompt_status_purpose_idx` (`status`, `purpose`)
    

---

## 1.6 Jobs / Pipeline

### `jobs`

- `id` UUID PK
    
- `queue` text
    
- `job_type` enum: `analyze_entry|recompute_user|reembed_entry|regenerate_quests|send_telegram|backfill`
    
- `status` enum: `pending|running|succeeded|failed|cancelled`
    
- `user_id` FK null
    
- `entity_type` text null
    
- `entity_id` text null
    
- `priority` int default 0
    
- `attempt` int default 0
    
- `max_attempts` int default 3
    
- `scheduled_for` timestamptz null
    
- `started_at` null
    
- `finished_at` null
    
- `error` jsonb null
    
- `params` jsonb
    
- `created_at`
    

**Индексы**

- `jobs_status_scheduled_idx` (`status`, `scheduled_for nulls first`, `created_at desc`)
    
- `jobs_user_created_idx` (`user_id`, `created_at desc`)
    
- `jobs_type_status_idx` (`job_type`, `status`, `created_at desc`)
    
- `jobs_entity_idx` (`entity_type`, `entity_id`, `created_at desc`)
    
- GIN `jobs_params_gin` (опционально)
    

---

# 2) Admin API (эндпоинты, фильтры, сортировки)

Базовый префикс: `/admin/v1`

## 2.1 Auth / RBAC

### `POST /admin/v1/auth/login`

### `GET /admin/v1/auth/me`

---

## 2.2 Users

### `GET /admin/v1/users`

**Query params**

- `q` (поиск: email, user_id)
    
- `status=active|blocked|deleted`
    
- `created_from`, `created_to`
    
- `last_seen_from`, `last_seen_to`
    
- `has_telegram=true|false`
    
- `min_entries`, `min_quests_completed` (если сделаешь агрегации)
    
- pagination: `limit`, `cursor` (или offset)
    
- sort: `sort=created_at|last_seen_at`, `order=asc|desc`
    

**Индексы, на которые опирается**

- `users_email_uq`, `users_status_created_idx`, `users_last_seen_idx`
    
- (для фильтров “min_entries” лучше материализованная статистика — ниже)
    

### `GET /admin/v1/users/{user_id}`

Возвращает “шапку” карточки пользователя + агрегаты.

### `PATCH /admin/v1/users/{user_id}`

- `status`
    
- `note` (админская заметка)
    
- `force_logout` (опционально)
    

**Audit**: обязательно.

### `POST /admin/v1/users/{user_id}/impersonate`

Если вообще хочешь “войти как пользователь” — крайне опасно.  
Рекомендую: только Super Admin + audit + TTL токена.

---

## 2.3 User 360 (подтабличные выборки)

### `GET /admin/v1/users/{user_id}/activity`

**params**

- `from`, `to`
    
- `granularity=day|week`
    
- `include=entries,evidences,quests`
    

### `GET /admin/v1/users/{user_id}/entries`

**params**

- `type`
    
- `source`
    
- `is_sensitive`
    
- `from`, `to`
    
- `limit`, `cursor`
    
- `sort=created_at`, `order`
    

### `GET /admin/v1/entries/{entry_id}`

**params**

- `view=masked|full`
    
- `reason=...` (required if `full`)  
    **Audit**: `view_full_entry`
    

### `POST /admin/v1/entries/{entry_id}/rerun-analysis`

**body**

- `analysis_version` (optional)
    
- `prompt_overrides` (optional; лучше запрещать в проде)
    
- `dry_run=true|false` (в MVP можно без dry_run)  
    Запускает job `analyze_entry`.
    

---

### `GET /admin/v1/users/{user_id}/sessions`

**params**

- `status`
    
- `from`, `to`
    
- `limit`, `cursor`
    

### `GET /admin/v1/sessions/{session_id}`

Возвращает session + список artifacts последних версий.

### `GET /admin/v1/sessions/{session_id}/artifacts`

**params**

- `kind`
    
- `latest=true|false`
    
- `version` (если нужно)
    

---

### `GET /admin/v1/users/{user_id}/abilities`

Возвращает `user_ability_state` + опционально каталог узлов.  
**params**

- `state=locked|available|...`
    
- `branch=...`
    
- `changed_from`, `changed_to`
    

### `GET /admin/v1/users/{user_id}/abilities/{node_id}`

Карточка узла + прогресс + последние change_log, references.

---

### `GET /admin/v1/users/{user_id}/quests`

**params**

- `status`
    
- `type`
    
- `branch`
    
- `linked_node`
    
- `from`, `to`
    
- `limit`, `cursor`
    

### `GET /admin/v1/quests/{quest_id}`

### `POST /admin/v1/quests/{quest_id}/override`

**body**

- `action=force_complete|force_fail|archive|reactivate`
    
- `reason`  
    **Audit** + запись в `change_log` со scope `quest`.
    

### `POST /admin/v1/users/{user_id}/quests/regenerate`

**body**

- `mode=append|replace_backlog|replace_all_non_completed`
    
- `reason`  
    Запускает job `regenerate_quests`.
    

---

### `GET /admin/v1/users/{user_id}/evidences`

**params**

- `type`
    
- `source`
    
- `from`, `to`
    
- `linked_type=quest|node|entry|session`
    
- `linked_id=...`
    
- `limit`, `cursor`
    

### `GET /admin/v1/evidences/{evidence_id}`

---

### `GET /admin/v1/users/{user_id}/changelog`

**params**

- `scope`
    
- `entity_type`
    
- `from`, `to`
    
- `limit`, `cursor`
    

### `POST /admin/v1/changelog/{change_id}/undo`

**body**

- `reason`  
    Запускает job `undo_change` или синхронно, если безопасно (лучше async).
    

---

## 2.4 Config / Formulas

### `GET /admin/v1/config-sets`

### `GET /admin/v1/config-sets/{config_set_id}`

### `GET /admin/v1/config-sets/{config_set_id}/versions`

### `POST /admin/v1/config-sets/{config_set_id}/versions`

- создать новую версию (draft)
    

### `POST /admin/v1/config-sets/{config_set_id}/activate`

- активировать версию  
    **Audit** обязательный.
    

### `GET /admin/v1/users/{user_id}/config`

- какой config set и версия применяются
    

### `POST /admin/v1/users/{user_id}/config/pin`

- закрепить версию (для тестов)
    

---

## 2.5 Prompt Registry / LLM tracing

### `GET /admin/v1/prompts`

**params**

- `purpose`
    
- `status`
    
- `q` (поиск по id)
    

### `GET /admin/v1/prompts/{prompt_id}/versions`

### `GET /admin/v1/prompts/{prompt_id}/versions/{version}`

### `POST /admin/v1/prompts/{prompt_id}/versions`

### `POST /admin/v1/prompts/{prompt_id}/activate`

### `GET /admin/v1/llm-runs`

(если заведёшь таблицу `llm_runs`, см. ниже)  
**params**

- `user_id`
    
- `session_id`
    
- `prompt_id`
    
- `status`
    
- `from`, `to`
    

**Рекомендую таблицу** `llm_runs`:

- `id`, `session_id`, `stage`, `prompt_id`, `prompt_version`, `model`, `status`, `input_hash`, `output_json`, `tokens_in/out`, `latency_ms`, `created_at`  
    Индекс: `(session_id, created_at desc)`, `(prompt_id, prompt_version)`.
    

---

## 2.6 Jobs / System ops

### `GET /admin/v1/jobs`

**params**

- `status`
    
- `job_type`
    
- `user_id`
    
- `entity_type`, `entity_id`
    
- `from`, `to`
    
- `limit`, `cursor`
    
- `sort=created_at|scheduled_for|started_at`, `order`
    

### `POST /admin/v1/jobs/{job_id}/retry`

### `POST /admin/v1/jobs/{job_id}/cancel`

---

## 2.7 Audit

### `GET /admin/v1/audit-log`

**params**

- `admin_user_id`
    
- `action`
    
- `target_type`
    
- `target_id`
    
- `from`, `to`
    
- `limit`, `cursor`
    

---

# 3) Материализованные агрегаты (чтобы фильтры работали быстро)

Если ты хочешь в `/admin/users` фильтры типа `min_entries` / `quest_completion_rate`, лучше завести агрегат:

### `user_stats_daily`

- `user_id`
    
- `date`
    
- `entries_count`
    
- `sessions_succeeded`
    
- `quests_completed`
    
- `evidences_count`  
    PK (`user_id`, `date`)
    

Индекс: (`date desc`, `entries_count desc`) и (`user_id`, `date desc`)

### `user_stats_rollup`

- `user_id` PK
    
- `entries_7d`, `entries_30d`
    
- `quests_completed_30d`
    
- `last_entry_at`
    
- `last_session_at`
    
- `undo_count_30d`
    
- `failed_jobs_7d`
    

Индекс: (`last_entry_at desc`), (`entries_30d desc`)

**Обновление**

- nightly cron + инкрементально по событиям (event-driven) — как тебе удобнее.
    

---

# 4) Список критичных индексов (коротко)

Если оставить только “самое нужное” под админку:

- `entries_user_created_idx (user_id, created_at desc)`
    
- `sessions_entry_idx (entry_id)`
    
- `sessions_user_created_idx (user_id, created_at desc)`
    
- `quests_user_status_idx (user_id, status, created_at desc)`
    
- `user_ability_state PK (user_id, node_id)` + `uas_user_state_idx`
    
- `change_log_user_created_idx (user_id, created_at desc)`
    
- `jobs_type_status_idx (job_type, status, created_at desc)`
    
- `admin_audit_log (target_type, target_id, created_at desc)`
    

---

# 5) Мини-спека “опасных операций” (чтобы потом не пожалеть)

Операции, которые **всегда** требуют `reason` и audit:

- просмотр `content_raw` (full view)
    
- change user status
    
- override quest
    
- regenerate quests
    
- rerun analysis
    
- recompute user state
    
- activate config / prompt
    
- undo change_log