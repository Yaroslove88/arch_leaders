#!/usr/bin/env ts-node

/**
 * Скрипт для импорта пользовательских данных
 * 
 * Импортирует:
 * - UserAbilityState - прогресс по узлам
 * - Quest (source='user_generated' или 'auto_generated') - пользовательские квесты
 * - CaseProgress - прогресс по кейсам
 * - TreeSemantic (tree_user_*) - пользовательские деревья (если есть)
 * - Entry, Session, Evidence (опционально)
 * 
 * Валидация:
 * - Проверяет, что пользователь существует
 * - Проверяет, что узлы существуют (для UserAbilityState)
 * - Проверяет формат данных
 * - Предупреждает о конфликтах (если данные уже существуют)
 * 
 * Использование:
 * npx ts-node scripts/import-user-data.ts <export-file-path> <target-userId> [--dry-run] [--overwrite]
 * 
 * Флаги:
 * --dry-run - только проверить и показать, что будет импортировано (не применять)
 * --overwrite - перезаписать существующие данные (по умолчанию пропускает)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface UserDataExport {
  export_metadata: {
    version: string;
    export_date: string;
    user_id: string;
    user_email?: string;
    user_telegram_username?: string;
  };
  ability_states: any[];
  user_quests: any[];
  case_progress: any[];
  user_tree?: any;
  entries?: any[];
  sessions?: any[];
  evidence?: any[];
}

async function importUserData(
  exportFilePath: string,
  targetUserId: string,
  dryRun: boolean = false,
  overwrite: boolean = false,
) {
  console.log(`📥 Импорт пользовательских данных из: ${exportFilePath}`);
  console.log(`   Целевой пользователь: ${targetUserId}`);
  console.log(`   Режим: ${dryRun ? 'DRY-RUN (проверка)' : overwrite ? 'ИМПОРТ (с перезаписью)' : 'ИМПОРТ (без перезаписи)'}\n`);

  try {
    // 1. Проверяем, что файл экспорта существует
    if (!fs.existsSync(exportFilePath)) {
      console.error(`❌ Файл экспорта не найден: ${exportFilePath}`);
      process.exit(1);
    }

    // 2. Читаем данные из файла
    console.log('1️⃣  Чтение файла экспорта...');
    const exportData: UserDataExport = JSON.parse(fs.readFileSync(exportFilePath, 'utf-8'));

    if (!exportData.export_metadata || !exportData.export_metadata.user_id) {
      console.error('❌ Неверный формат файла экспорта: отсутствует export_metadata');
      process.exit(1);
    }

    const sourceUserId = exportData.export_metadata.user_id;
    console.log(`   ✅ Файл прочитан: экспорт от ${exportData.export_metadata.export_date}`);
    console.log(`   📝 Исходный пользователь: ${sourceUserId} (${exportData.export_metadata.user_email || exportData.export_metadata.user_telegram_username || 'unknown'})`);

    // 3. Проверяем, что целевой пользователь существует
    console.log('\n2️⃣  Проверка целевого пользователя...');
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, telegramUsername: true },
    });

    if (!targetUser) {
      console.error(`❌ Целевой пользователь с ID ${targetUserId} не найден`);
      process.exit(1);
    }

    console.log(`   ✅ Целевой пользователь найден: ${targetUser.email || targetUser.telegramUsername || targetUserId}`);

    if (sourceUserId === targetUserId) {
      console.log('   ℹ️  Импорт в того же пользователя (восстановление данных)');
    } else {
      console.log(`   ⚠️  Импорт данных от другого пользователя (${sourceUserId} → ${targetUserId})`);
    }

    // 4. Валидация данных
    console.log('\n3️⃣  Валидация данных...');
    const validationErrors: string[] = [];

    // Валидация ability_states
    if (exportData.ability_states && Array.isArray(exportData.ability_states)) {
      for (let i = 0; i < exportData.ability_states.length; i++) {
        const state = exportData.ability_states[i];
        if (!state.node_id || !state.state) {
          validationErrors.push(`Неверный формат ability_state[${i}]: отсутствует node_id или state`);
        }
        if (state.progress !== undefined && (typeof state.progress !== 'number' || state.progress < 0 || state.progress > 1)) {
          validationErrors.push(`Неверный формат ability_state[${i}]: progress должен быть числом от 0 до 1`);
        }
        if (state.internal_progress !== undefined && (typeof state.internal_progress !== 'number' || state.internal_progress < 0)) {
          validationErrors.push(`Неверный формат ability_state[${i}]: internal_progress должен быть неотрицательным числом`);
        }
        const validStates = ['locked', 'available', 'active', 'unlocked', 'integrated'];
        if (state.state && !validStates.includes(state.state)) {
          validationErrors.push(`Неверный формат ability_state[${i}]: state должен быть одним из: ${validStates.join(', ')}`);
        }
      }
    }

    // Валидация user_quests
    if (exportData.user_quests && Array.isArray(exportData.user_quests)) {
      for (let i = 0; i < exportData.user_quests.length; i++) {
        const quest = exportData.user_quests[i];
        if (!quest.id || !quest.title) {
          validationErrors.push(`Неверный формат quest[${i}]: отсутствует id или title`);
        }
        if (quest.source === 'base_template') {
          validationErrors.push(`Нельзя импортировать базовый квест (source=base_template): ${quest.id || 'unknown'}`);
        }
        const validStatuses = ['backlog', 'active', 'completed', 'failed', 'archived'];
        if (quest.status && !validStatuses.includes(quest.status)) {
          validationErrors.push(`Неверный формат quest[${i}]: status должен быть одним из: ${validStatuses.join(', ')}`);
        }
        if (quest.steps_json && !Array.isArray(quest.steps_json)) {
          validationErrors.push(`Неверный формат quest[${i}]: steps_json должен быть массивом`);
        }
        if (quest.criteria_json && typeof quest.criteria_json !== 'object') {
          validationErrors.push(`Неверный формат quest[${i}]: criteria_json должен быть объектом`);
        }
      }
    }

    // Валидация case_progress
    if (exportData.case_progress) {
      for (const progress of exportData.case_progress) {
        if (!progress.case_id || !progress.node_id) {
          validationErrors.push(`Неверный формат case_progress: отсутствует case_id или node_id`);
        }
      }
    }

    // Валидация user_tree
    if (exportData.user_tree) {
      if (!exportData.user_tree.semantic_version || !exportData.user_tree.data) {
        validationErrors.push('Неверный формат user_tree: отсутствует semantic_version или data');
      }
      if (typeof exportData.user_tree.tree_revision !== 'number') {
        validationErrors.push('Неверный формат user_tree: tree_revision должен быть числом');
      }
    }

    // Валидация entries (если есть)
    if (exportData.entries && Array.isArray(exportData.entries)) {
      for (let i = 0; i < exportData.entries.length; i++) {
        const entry = exportData.entries[i];
        if (!entry.id || !entry.type || !entry.text) {
          validationErrors.push(`Неверный формат entry[${i}]: отсутствует id, type или text`);
        }
        const validTypes = ['situation', 'reflection', 'feedback', 'voice', 'import'];
        if (entry.type && !validTypes.includes(entry.type)) {
          validationErrors.push(`Неверный формат entry[${i}]: type должен быть одним из: ${validTypes.join(', ')}`);
        }
      }
    }

    // Валидация sessions (если есть)
    if (exportData.sessions && Array.isArray(exportData.sessions)) {
      for (let i = 0; i < exportData.sessions.length; i++) {
        const session = exportData.sessions[i];
        if (!session.id || !session.entry_id || !session.summary) {
          validationErrors.push(`Неверный формат session[${i}]: отсутствует id, entry_id или summary`);
        }
        const validStatuses = ['pending', 'processing', 'succeeded', 'failed'];
        if (session.status && !validStatuses.includes(session.status)) {
          validationErrors.push(`Неверный формат session[${i}]: status должен быть одним из: ${validStatuses.join(', ')}`);
        }
      }
    }

    // Валидация evidence (если есть)
    if (exportData.evidence && Array.isArray(exportData.evidence)) {
      for (let i = 0; i < exportData.evidence.length; i++) {
        const ev = exportData.evidence[i];
        if (!ev.id || !ev.type || !ev.text) {
          validationErrors.push(`Неверный формат evidence[${i}]: отсутствует id, type или text`);
        }
        const validTypes = ['situation', 'observation', 'reflection', 'feedback', 'external_feedback'];
        if (ev.type && !validTypes.includes(ev.type)) {
          validationErrors.push(`Неверный формат evidence[${i}]: type должен быть одним из: ${validTypes.join(', ')}`);
        }
      }
    }

    if (validationErrors.length > 0) {
      console.error('❌ Ошибки валидации:');
      validationErrors.forEach((error) => console.error(`   - ${error}`));
      process.exit(1);
    }

    console.log('   ✅ Валидация пройдена');

    // 5. Проверяем существующие данные (если не перезаписываем)
    console.log('\n4️⃣  Проверка существующих данных...');
    const existingAbilityStates = await prisma.userAbilityState.count({
      where: { user_id: targetUserId },
    });
    const existingQuests = await prisma.quest.count({
      where: {
        userId: targetUserId,
        OR: [{ source: 'user_generated' }, { source: 'auto_generated' }, { source: null }],
      },
    });
    const existingCaseProgress = await prisma.caseProgress.count({
      where: { user_id: targetUserId },
    });

    console.log(`   - AbilityStates: ${existingAbilityStates} существующих`);
    console.log(`   - User Quests: ${existingQuests} существующих`);
    console.log(`   - Case Progress: ${existingCaseProgress} существующих`);

    if (!overwrite && (existingAbilityStates > 0 || existingQuests > 0 || existingCaseProgress > 0)) {
      console.log('\n   ⚠️  ВНИМАНИЕ: У целевого пользователя уже есть данные!');
      console.log('   Используйте --overwrite для перезаписи или удалите данные вручную перед импортом');
      if (!dryRun) {
        process.exit(1);
      }
    }

    // 6. Проверяем, что узлы существуют (для UserAbilityState)
    console.log('\n5️⃣  Проверка существования узлов...');
    const nodeIds = new Set(exportData.ability_states?.map((s) => s.node_id) || []);
    const existingNodes = await prisma.abilityNode.findMany({
      where: { id: { in: Array.from(nodeIds) } },
      select: { id: true },
    });

    const existingNodeIds = new Set(existingNodes.map((n) => n.id));
    const missingNodes = Array.from(nodeIds).filter((id) => !existingNodeIds.has(id));

    if (missingNodes.length > 0) {
      console.warn(`   ⚠️  Предупреждение: ${missingNodes.length} узлов не найдены в БД:`);
      missingNodes.slice(0, 5).forEach((id) => console.warn(`      - ${id}`));
      if (missingNodes.length > 5) {
        console.warn(`      ... и еще ${missingNodes.length - 5} узлов`);
      }
      console.warn('   Импорт продолжится, но данные для этих узлов будут пропущены');
    } else {
      console.log(`   ✅ Все ${nodeIds.size} узлов найдены в БД`);
    }

    // 7. Если dry-run, только показываем, что будет импортировано
    if (dryRun) {
      console.log('\n📋 DRY-RUN: Что будет импортировано:');
      console.log(`   - AbilityStates: ${exportData.ability_states?.length || 0} записей`);
      console.log(`   - User Quests: ${exportData.user_quests?.length || 0} квестов`);
      console.log(`   - Case Progress: ${exportData.case_progress?.length || 0} записей`);
      console.log(`   - User Tree: ${exportData.user_tree ? 'Да' : 'Нет'}`);
      if (exportData.entries || exportData.sessions || exportData.evidence) {
        console.log(`   - Entries: ${exportData.entries?.length || 0}`);
        console.log(`   - Sessions: ${exportData.sessions?.length || 0}`);
        console.log(`   - Evidence: ${exportData.evidence?.length || 0}`);
      }
      console.log('\n✅ DRY-RUN завершен. Используйте без --dry-run для импорта');
      return;
    }

    // 8. Импортируем данные в транзакции
    console.log('\n6️⃣  Импорт данных...');
    await prisma.$transaction(async (tx) => {
      // 8.1. Импортируем UserAbilityState
      if (exportData.ability_states && exportData.ability_states.length > 0) {
        console.log(`   Импорт AbilityStates (${exportData.ability_states.length} записей)...`);
        let imported = 0;
        let skipped = 0;
        let updated = 0;

        for (const state of exportData.ability_states) {
          // Пропускаем узлы, которых нет в БД
          if (!existingNodeIds.has(state.node_id)) {
            skipped++;
            continue;
          }

          if (overwrite) {
            await tx.userAbilityState.upsert({
              where: {
                user_id_node_id: {
                  user_id: targetUserId,
                  node_id: state.node_id,
                },
              },
              update: {
                state: state.state,
                progress: state.progress,
                internal_progress: state.internal_progress,
                relevance: state.relevance,
                stored_experience: state.stored_experience,
                last_activity_date: state.last_activity_date
                  ? new Date(state.last_activity_date)
                  : null,
              },
              create: {
                user_id: targetUserId,
                node_id: state.node_id,
                state: state.state,
                progress: state.progress,
                internal_progress: state.internal_progress,
                relevance: state.relevance,
                stored_experience: state.stored_experience,
                last_activity_date: state.last_activity_date ? new Date(state.last_activity_date) : null,
              },
            });
            updated++;
          } else {
            const exists = await tx.userAbilityState.findUnique({
              where: {
                user_id_node_id: {
                  user_id: targetUserId,
                  node_id: state.node_id,
                },
              },
            });

            if (!exists) {
              await tx.userAbilityState.create({
                data: {
                  user_id: targetUserId,
                  node_id: state.node_id,
                  state: state.state,
                  progress: state.progress,
                  internal_progress: state.internal_progress,
                  relevance: state.relevance,
                  stored_experience: state.stored_experience,
                  last_activity_date: state.last_activity_date
                    ? new Date(state.last_activity_date)
                    : null,
                },
              });
              imported++;
            } else {
              skipped++;
            }
          }
        }

        console.log(
          `      ✅ Импортировано: ${imported}, обновлено: ${updated}, пропущено: ${skipped}`,
        );
      }

      // 8.2. Импортируем пользовательские квесты
      if (exportData.user_quests && exportData.user_quests.length > 0) {
        console.log(`   Импорт User Quests (${exportData.user_quests.length} квестов)...`);
        let imported = 0;
        let skipped = 0;
        let updated = 0;

        for (const quest of exportData.user_quests) {
          // Проверяем, что это не базовый квест
          if (quest.source === 'base_template') {
            skipped++;
            continue;
          }

          if (overwrite) {
            await tx.quest.upsert({
              where: { id: quest.id },
              update: {
                title: quest.title,
                description: quest.description,
                type: quest.type,
                status: quest.status,
                branch: quest.branch,
                steps_json: quest.steps_json,
                criteria_json: quest.criteria_json,
                reward_json: quest.reward_json,
                linked_nodes: quest.linked_nodes,
                evidence_links_json: quest.evidence_links_json,
                due_hint: quest.due_hint,
                source: quest.source || 'user_generated',
                tags: quest.tags,
                activated_at: quest.activated_at ? new Date(quest.activated_at) : null,
                completed_at: quest.completed_at ? new Date(quest.completed_at) : null,
              },
              create: {
                id: quest.id,
                userId: targetUserId,
                title: quest.title,
                description: quest.description,
                type: quest.type,
                status: quest.status,
                branch: quest.branch,
                steps_json: quest.steps_json,
                criteria_json: quest.criteria_json,
                reward_json: quest.reward_json,
                linked_nodes: quest.linked_nodes,
                evidence_links_json: quest.evidence_links_json,
                due_hint: quest.due_hint,
                source: quest.source || 'user_generated',
                tags: quest.tags,
                created_at: quest.created_at ? new Date(quest.created_at) : new Date(),
                activated_at: quest.activated_at ? new Date(quest.activated_at) : null,
                completed_at: quest.completed_at ? new Date(quest.completed_at) : null,
              },
            });
            updated++;
          } else {
            const exists = await tx.quest.findUnique({
              where: { id: quest.id },
            });

            if (!exists) {
              await tx.quest.create({
                data: {
                  id: quest.id,
                  userId: targetUserId,
                  title: quest.title,
                  description: quest.description,
                  type: quest.type,
                  status: quest.status,
                  branch: quest.branch,
                  steps_json: quest.steps_json,
                  criteria_json: quest.criteria_json,
                  reward_json: quest.reward_json,
                  linked_nodes: quest.linked_nodes,
                  evidence_links_json: quest.evidence_links_json,
                  due_hint: quest.due_hint,
                  source: quest.source || 'user_generated',
                  tags: quest.tags,
                  created_at: quest.created_at ? new Date(quest.created_at) : new Date(),
                  activated_at: quest.activated_at ? new Date(quest.activated_at) : null,
                  completed_at: quest.completed_at ? new Date(quest.completed_at) : null,
                },
              });
              imported++;
            } else {
              skipped++;
            }
          }
        }

        console.log(
          `      ✅ Импортировано: ${imported}, обновлено: ${updated}, пропущено: ${skipped}`,
        );
      }

      // 8.3. Импортируем CaseProgress
      if (exportData.case_progress && exportData.case_progress.length > 0) {
        console.log(`   Импорт Case Progress (${exportData.case_progress.length} записей)...`);
        let imported = 0;
        let skipped = 0;
        let updated = 0;

        for (const progress of exportData.case_progress) {
          const existing = await tx.caseProgress.findUnique({
            where: {
              user_id_case_id: {
                user_id: targetUserId,
                case_id: progress.case_id,
              },
            },
          });

          if (existing) {
            if (overwrite) {
              await tx.caseProgress.update({
                where: { id: existing.id },
                data: {
                  node_id: progress.node_id,
                  selected_option: progress.selected_option,
                  xp_earned: progress.xp_earned,
                  completed_at: new Date(progress.completed_at),
                },
              });
              updated++;
            } else {
              skipped++;
            }
          } else {
            await tx.caseProgress.create({
              data: {
                user_id: targetUserId,
                case_id: progress.case_id,
                node_id: progress.node_id,
                selected_option: progress.selected_option,
                xp_earned: progress.xp_earned,
                completed_at: new Date(progress.completed_at),
              },
            });
            imported++;
          }
        }

        console.log(`      ✅ Импортировано: ${imported}, обновлено: ${updated}, пропущено: ${skipped}`);
      }

      // 8.4. Опционально: импортируем Entry, Session, Evidence
      if (exportData.entries && exportData.entries.length > 0) {
        console.log(`   Импорт Entries (${exportData.entries.length} записей)...`);
        let imported = 0;
        let skipped = 0;

        for (const entry of exportData.entries) {
          if (overwrite) {
            await tx.entry.upsert({
              where: { id: entry.id },
              update: {
                type: entry.type,
                source: entry.source,
                text: entry.text,
                text_masked: entry.text_masked || null,
                is_sensitive: entry.is_sensitive || false,
                participants: entry.participants || [],
                context_json: entry.context_json || null,
                file_ref: entry.file_ref || null,
                tags: entry.tags || [],
              },
              create: {
                id: entry.id,
                userId: targetUserId,
                type: entry.type,
                source: entry.source,
                text: entry.text,
                text_masked: entry.text_masked || null,
                is_sensitive: entry.is_sensitive || false,
                participants: entry.participants || [],
                context_json: entry.context_json || null,
                file_ref: entry.file_ref || null,
                tags: entry.tags || [],
                created_at: entry.created_at ? new Date(entry.created_at) : new Date(),
              },
            });
            imported++;
          } else {
            const exists = await tx.entry.findUnique({ where: { id: entry.id } });
            if (!exists) {
              await tx.entry.create({
                data: {
                  id: entry.id,
                  userId: targetUserId,
                  type: entry.type,
                  source: entry.source,
                  text: entry.text,
                  text_masked: entry.text_masked || null,
                  is_sensitive: entry.is_sensitive || false,
                  participants: entry.participants || [],
                  context_json: entry.context_json || null,
                  file_ref: entry.file_ref || null,
                  tags: entry.tags || [],
                  created_at: entry.created_at ? new Date(entry.created_at) : new Date(),
                },
              });
              imported++;
            } else {
              skipped++;
            }
          }
        }
        console.log(`      ✅ Импортировано: ${imported}, пропущено: ${skipped}`);
      }

      if (exportData.sessions && exportData.sessions.length > 0) {
        console.log(`   Импорт Sessions (${exportData.sessions.length} сессий)...`);
        let imported = 0;
        let skipped = 0;

        for (const session of exportData.sessions) {
          // Проверяем, что entry существует (если не перезаписываем)
          if (!overwrite) {
            const entryExists = await tx.entry.findUnique({ where: { id: session.entry_id } });
            if (!entryExists) {
              console.warn(`      ⚠️  Пропущена сессия ${session.id}: entry ${session.entry_id} не найден`);
              skipped++;
              continue;
            }
          }

          if (overwrite) {
            await tx.session.upsert({
              where: { id: session.id },
              update: {
                entry_id: session.entry_id,
                summary: session.summary,
                insights_json: session.insights_json || [],
                focus_json: session.focus_json || [],
                themes: session.themes || [],
                patterns: session.patterns || [],
                tensions: session.tensions || [],
                ability_signals_json: session.ability_signals_json || [],
                status: session.status || 'pending',
                analysis_version: session.analysis_version || 1,
                analysis_error: session.analysis_error || null,
                error_code: session.error_code || null,
                error_message: session.error_message || null,
                analyzed_at: session.analyzed_at ? new Date(session.analyzed_at) : null,
                completed_at: session.completed_at ? new Date(session.completed_at) : null,
              },
              create: {
                id: session.id,
                userId: targetUserId,
                entry_id: session.entry_id,
                summary: session.summary,
                insights_json: session.insights_json || [],
                focus_json: session.focus_json || [],
                themes: session.themes || [],
                patterns: session.patterns || [],
                tensions: session.tensions || [],
                ability_signals_json: session.ability_signals_json || [],
                status: session.status || 'pending',
                analysis_version: session.analysis_version || 1,
                analysis_error: session.analysis_error || null,
                error_code: session.error_code || null,
                error_message: session.error_message || null,
                created_at: session.created_at ? new Date(session.created_at) : new Date(),
                analyzed_at: session.analyzed_at ? new Date(session.analyzed_at) : null,
                completed_at: session.completed_at ? new Date(session.completed_at) : null,
              },
            });
            imported++;
          } else {
            const exists = await tx.session.findUnique({ where: { id: session.id } });
            if (!exists) {
              await tx.session.create({
                data: {
                  id: session.id,
                  userId: targetUserId,
                  entry_id: session.entry_id,
                  summary: session.summary,
                  insights_json: session.insights_json || [],
                  focus_json: session.focus_json || [],
                  themes: session.themes || [],
                  patterns: session.patterns || [],
                  tensions: session.tensions || [],
                  ability_signals_json: session.ability_signals_json || [],
                  status: session.status || 'pending',
                  analysis_version: session.analysis_version || 1,
                  analysis_error: session.analysis_error || null,
                  error_code: session.error_code || null,
                  error_message: session.error_message || null,
                  created_at: session.created_at ? new Date(session.created_at) : new Date(),
                  analyzed_at: session.analyzed_at ? new Date(session.analyzed_at) : null,
                  completed_at: session.completed_at ? new Date(session.completed_at) : null,
                },
              });
              imported++;
            } else {
              skipped++;
            }
          }
        }
        console.log(`      ✅ Импортировано: ${imported}, пропущено: ${skipped}`);
      }

      if (exportData.evidence && exportData.evidence.length > 0) {
        console.log(`   Импорт Evidence (${exportData.evidence.length} записей)...`);
        let imported = 0;
        let skipped = 0;

        for (const ev of exportData.evidence) {
          if (overwrite) {
            await tx.evidence.upsert({
              where: { id: ev.id },
              update: {
                type: ev.type,
                source: ev.source || null,
                text: ev.text,
                quest_id: ev.quest_id || null,
                ability_node_id: ev.ability_node_id || null,
                session_id: ev.session_id || null,
                tags: ev.tags || [],
              },
              create: {
                id: ev.id,
                userId: targetUserId,
                type: ev.type,
                source: ev.source || null,
                text: ev.text,
                quest_id: ev.quest_id || null,
                ability_node_id: ev.ability_node_id || null,
                session_id: ev.session_id || null,
                tags: ev.tags || [],
                created_at: ev.created_at ? new Date(ev.created_at) : new Date(),
              },
            });
            imported++;
          } else {
            const exists = await tx.evidence.findUnique({ where: { id: ev.id } });
            if (!exists) {
              await tx.evidence.create({
                data: {
                  id: ev.id,
                  userId: targetUserId,
                  type: ev.type,
                  source: ev.source || null,
                  text: ev.text,
                  quest_id: ev.quest_id || null,
                  ability_node_id: ev.ability_node_id || null,
                  session_id: ev.session_id || null,
                  tags: ev.tags || [],
                  created_at: ev.created_at ? new Date(ev.created_at) : new Date(),
                },
              });
              imported++;
            } else {
              skipped++;
            }
          }
        }
        console.log(`      ✅ Импортировано: ${imported}, пропущено: ${skipped}`);
      }

      // 8.5. Импортируем пользовательское дерево (если есть)
      if (exportData.user_tree) {
        console.log('   Импорт User Tree...');
        const treeId = `tree_user_${targetUserId}`;
        await tx.treeSemantic.upsert({
          where: { id: treeId },
          update: {
            semantic_version: exportData.user_tree.semantic_version,
            tree_revision: exportData.user_tree.tree_revision,
            data: exportData.user_tree.data,
          },
          create: {
            id: treeId,
            userId: targetUserId,
            semantic_version: exportData.user_tree.semantic_version,
            tree_revision: exportData.user_tree.tree_revision,
            data: exportData.user_tree.data,
          },
        });
        console.log('      ✅ Пользовательское дерево импортировано');
      }

      // 8.5. Опционально: импортируем Entry, Session, Evidence
      if (exportData.entries && exportData.entries.length > 0) {
        console.log(`   Импорт Entries (${exportData.entries.length} записей)...`);
        let imported = 0;
        let skipped = 0;

        for (const entry of exportData.entries) {
          if (overwrite) {
            await tx.entry.upsert({
              where: { id: entry.id },
              update: {
                type: entry.type,
                source: entry.source,
                text: entry.text,
                text_masked: entry.text_masked || null,
                is_sensitive: entry.is_sensitive || false,
                participants: entry.participants || [],
                context_json: entry.context_json || null,
                file_ref: entry.file_ref || null,
                tags: entry.tags || [],
              },
              create: {
                id: entry.id,
                userId: targetUserId,
                type: entry.type,
                source: entry.source,
                text: entry.text,
                text_masked: entry.text_masked || null,
                is_sensitive: entry.is_sensitive || false,
                participants: entry.participants || [],
                context_json: entry.context_json || null,
                file_ref: entry.file_ref || null,
                tags: entry.tags || [],
                created_at: entry.created_at ? new Date(entry.created_at) : new Date(),
              },
            });
            imported++;
          } else {
            const exists = await tx.entry.findUnique({ where: { id: entry.id } });
            if (!exists) {
              await tx.entry.create({
                data: {
                  id: entry.id,
                  userId: targetUserId,
                  type: entry.type,
                  source: entry.source,
                  text: entry.text,
                  text_masked: entry.text_masked || null,
                  is_sensitive: entry.is_sensitive || false,
                  participants: entry.participants || [],
                  context_json: entry.context_json || null,
                  file_ref: entry.file_ref || null,
                  tags: entry.tags || [],
                  created_at: entry.created_at ? new Date(entry.created_at) : new Date(),
                },
              });
              imported++;
            } else {
              skipped++;
            }
          }
        }
        console.log(`      ✅ Импортировано: ${imported}, пропущено: ${skipped}`);
      }

      if (exportData.sessions && exportData.sessions.length > 0) {
        console.log(`   Импорт Sessions (${exportData.sessions.length} сессий)...`);
        let imported = 0;
        let skipped = 0;

        for (const session of exportData.sessions) {
          // Проверяем, что entry существует (если не перезаписываем)
          if (!overwrite) {
            const entryExists = await tx.entry.findUnique({ where: { id: session.entry_id } });
            if (!entryExists) {
              console.warn(`      ⚠️  Пропущена сессия ${session.id}: entry ${session.entry_id} не найден`);
              skipped++;
              continue;
            }
          }

          if (overwrite) {
            await tx.session.upsert({
              where: { id: session.id },
              update: {
                entry_id: session.entry_id,
                summary: session.summary,
                insights_json: session.insights_json || [],
                focus_json: session.focus_json || [],
                themes: session.themes || [],
                patterns: session.patterns || [],
                tensions: session.tensions || [],
                ability_signals_json: session.ability_signals_json || [],
                status: session.status || 'pending',
                analysis_version: session.analysis_version || 1,
                analysis_error: session.analysis_error || null,
                error_code: session.error_code || null,
                error_message: session.error_message || null,
                analyzed_at: session.analyzed_at ? new Date(session.analyzed_at) : null,
                completed_at: session.completed_at ? new Date(session.completed_at) : null,
              },
              create: {
                id: session.id,
                userId: targetUserId,
                entry_id: session.entry_id,
                summary: session.summary,
                insights_json: session.insights_json || [],
                focus_json: session.focus_json || [],
                themes: session.themes || [],
                patterns: session.patterns || [],
                tensions: session.tensions || [],
                ability_signals_json: session.ability_signals_json || [],
                status: session.status || 'pending',
                analysis_version: session.analysis_version || 1,
                analysis_error: session.analysis_error || null,
                error_code: session.error_code || null,
                error_message: session.error_message || null,
                created_at: session.created_at ? new Date(session.created_at) : new Date(),
                analyzed_at: session.analyzed_at ? new Date(session.analyzed_at) : null,
                completed_at: session.completed_at ? new Date(session.completed_at) : null,
              },
            });
            imported++;
          } else {
            const exists = await tx.session.findUnique({ where: { id: session.id } });
            if (!exists) {
              await tx.session.create({
                data: {
                  id: session.id,
                  userId: targetUserId,
                  entry_id: session.entry_id,
                  summary: session.summary,
                  insights_json: session.insights_json || [],
                  focus_json: session.focus_json || [],
                  themes: session.themes || [],
                  patterns: session.patterns || [],
                  tensions: session.tensions || [],
                  ability_signals_json: session.ability_signals_json || [],
                  status: session.status || 'pending',
                  analysis_version: session.analysis_version || 1,
                  analysis_error: session.analysis_error || null,
                  error_code: session.error_code || null,
                  error_message: session.error_message || null,
                  created_at: session.created_at ? new Date(session.created_at) : new Date(),
                  analyzed_at: session.analyzed_at ? new Date(session.analyzed_at) : null,
                  completed_at: session.completed_at ? new Date(session.completed_at) : null,
                },
              });
              imported++;
            } else {
              skipped++;
            }
          }
        }
        console.log(`      ✅ Импортировано: ${imported}, пропущено: ${skipped}`);
      }

      if (exportData.evidence && exportData.evidence.length > 0) {
        console.log(`   Импорт Evidence (${exportData.evidence.length} записей)...`);
        let imported = 0;
        let skipped = 0;

        for (const ev of exportData.evidence) {
          if (overwrite) {
            await tx.evidence.upsert({
              where: { id: ev.id },
              update: {
                type: ev.type,
                source: ev.source || null,
                text: ev.text,
                quest_id: ev.quest_id || null,
                ability_node_id: ev.ability_node_id || null,
                session_id: ev.session_id || null,
                tags: ev.tags || [],
              },
              create: {
                id: ev.id,
                userId: targetUserId,
                type: ev.type,
                source: ev.source || null,
                text: ev.text,
                quest_id: ev.quest_id || null,
                ability_node_id: ev.ability_node_id || null,
                session_id: ev.session_id || null,
                tags: ev.tags || [],
                created_at: ev.created_at ? new Date(ev.created_at) : new Date(),
              },
            });
            imported++;
          } else {
            const exists = await tx.evidence.findUnique({ where: { id: ev.id } });
            if (!exists) {
              await tx.evidence.create({
                data: {
                  id: ev.id,
                  userId: targetUserId,
                  type: ev.type,
                  source: ev.source || null,
                  text: ev.text,
                  quest_id: ev.quest_id || null,
                  ability_node_id: ev.ability_node_id || null,
                  session_id: ev.session_id || null,
                  tags: ev.tags || [],
                  created_at: ev.created_at ? new Date(ev.created_at) : new Date(),
                },
              });
              imported++;
            } else {
              skipped++;
            }
          }
        }
        console.log(`      ✅ Импортировано: ${imported}, пропущено: ${skipped}`);
      }
    });

    console.log('\n✅ Импорт завершен успешно!');

    // Статистика после импорта
    console.log('\n📊 Статистика после импорта:');
    const finalAbilityStates = await prisma.userAbilityState.count({
      where: { user_id: targetUserId },
    });
    const finalQuests = await prisma.quest.count({
      where: {
        userId: targetUserId,
        OR: [{ source: 'user_generated' }, { source: 'auto_generated' }, { source: null }],
      },
    });
    const finalCaseProgress = await prisma.caseProgress.count({
      where: { user_id: targetUserId },
    });

    console.log(`   - AbilityStates: ${finalAbilityStates}`);
    console.log(`   - User Quests: ${finalQuests}`);
    console.log(`   - Case Progress: ${finalCaseProgress}`);
  } catch (error: any) {
    console.error('❌ Ошибка при импорте:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск скрипта
const exportFilePath = process.argv[2];
const targetUserId = process.argv[3];
const dryRun = process.argv.includes('--dry-run');
const overwrite = process.argv.includes('--overwrite');

if (!exportFilePath || !targetUserId) {
  console.error('❌ Укажите путь к файлу экспорта и targetUserId');
  console.log(
    'Использование: npx ts-node scripts/import-user-data.ts <export-file-path> <target-userId> [--dry-run] [--overwrite]',
  );
  process.exit(1);
}

importUserData(exportFilePath, targetUserId, dryRun, overwrite)
  .then(() => {
    console.log('\n✅ Импорт завершен успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });
