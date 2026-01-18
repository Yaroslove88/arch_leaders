#!/usr/bin/env ts-node

/**
 * Скрипт для экспорта пользовательских данных
 * 
 * Экспортирует:
 * - UserAbilityState - прогресс по узлам (state, progress, internal_progress, relevance, stored_experience)
 * - Quest (source='user_generated' или 'auto_generated') - пользовательские квесты
 * - CaseProgress - прогресс по кейсам
 * - TreeSemantic (tree_user_*) - пользовательские деревья (если есть)
 * - Entry - записи пользователя (опционально)
 * - Session - сессии пользователя (опционально)
 * - Evidence - доказательства пользователя (опционально)
 * 
 * Использование:
 * npx ts-node scripts/export-user-data.ts <userId> [--include-content]
 * 
 * Флаги:
 * --include-content - включить Entry, Session, Evidence (может быть большой файл)
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

async function exportUserData(userId: string, includeContent: boolean = false) {
  console.log(`📦 Экспорт пользовательских данных для userId: ${userId}\n`);

  try {
    // Проверяем, что пользователь существует
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        telegramUsername: true,
      },
    });

    if (!user) {
      console.error(`❌ Пользователь с ID ${userId} не найден`);
      process.exit(1);
    }

    console.log(`✅ Пользователь найден: ${user.email || user.telegramUsername || userId}\n`);

    // 1. Экспортируем UserAbilityState
    console.log('1️⃣  Экспорт UserAbilityState...');
    const abilityStates = await prisma.userAbilityState.findMany({
      where: { user_id: userId },
      orderBy: { last_updated_at: 'desc' },
    });
    console.log(`   ✅ Экспортировано: ${abilityStates.length} записей`);

    // 2. Экспортируем пользовательские квесты
    console.log('\n2️⃣  Экспорт пользовательских квестов...');
    const userQuests = await prisma.quest.findMany({
      where: {
        userId: userId,
        OR: [
          { source: 'user_generated' },
          { source: 'auto_generated' },
          { source: null },
        ],
      },
      orderBy: { created_at: 'desc' },
    });
    console.log(`   ✅ Экспортировано: ${userQuests.length} квестов`);

    // 3. Экспортируем CaseProgress
    console.log('\n3️⃣  Экспорт CaseProgress...');
    const caseProgress = await prisma.caseProgress.findMany({
      where: { user_id: userId },
      orderBy: { completed_at: 'desc' },
    });
    console.log(`   ✅ Экспортировано: ${caseProgress.length} записей`);

    // 4. Экспортируем пользовательское дерево (если есть)
    console.log('\n4️⃣  Экспорт пользовательского дерева...');
    const userTree = await prisma.treeSemantic.findUnique({
      where: { userId: userId },
    });
    if (userTree) {
      console.log(`   ✅ Найдено пользовательское дерево: ${userTree.id}`);
    } else {
      console.log('   ℹ️  Пользовательское дерево не найдено (используется глобальное)');
    }

    // 5. Опционально: экспортируем Entry, Session, Evidence
    let entries: any[] = [];
    let sessions: any[] = [];
    let evidence: any[] = [];

    if (includeContent) {
      console.log('\n5️⃣  Экспорт контента (Entry, Session, Evidence)...');
      
      entries = await prisma.entry.findMany({
        where: { userId: userId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          type: true,
          source: true,
          text: true,
          text_masked: true,
          is_sensitive: true,
          participants: true,
          context_json: true,
          file_ref: true,
          tags: true,
          created_at: true,
          updated_at: true,
        },
      });
      console.log(`   ✅ Экспортировано: ${entries.length} записей (Entry)`);

      sessions = await prisma.session.findMany({
        where: { userId: userId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          entry_id: true,
          summary: true,
          insights_json: true,
          focus_json: true,
          themes: true,
          patterns: true,
          tensions: true,
          ability_signals_json: true,
          status: true,
          analysis_version: true,
          analysis_error: true,
          error_code: true,
          error_message: true,
          created_at: true,
          updated_at: true,
          analyzed_at: true,
          completed_at: true,
        },
      });
      console.log(`   ✅ Экспортировано: ${sessions.length} сессий`);

      evidence = await prisma.evidence.findMany({
        where: { userId: userId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          type: true,
          source: true,
          text: true,
          quest_id: true,
          ability_node_id: true,
          session_id: true,
          tags: true,
          created_at: true,
          updated_at: true,
        },
      });
      console.log(`   ✅ Экспортировано: ${evidence.length} доказательств`);
    } else {
      console.log('\n5️⃣  Пропущен экспорт контента (используйте --include-content для включения)');
    }

    // Формируем объект экспорта
    const exportData: UserDataExport = {
      export_metadata: {
        version: '1.0.0',
        export_date: new Date().toISOString(),
        user_id: user.id,
        user_email: user.email || undefined,
        user_telegram_username: user.telegramUsername || undefined,
      },
      ability_states: abilityStates.map((state) => ({
        node_id: state.node_id,
        state: state.state,
        progress: Number(state.progress),
        internal_progress: Number(state.internal_progress),
        relevance: Number(state.relevance),
        stored_experience: Number(state.stored_experience),
        last_activity_date: state.last_activity_date?.toISOString() || null,
        last_updated_at: state.last_updated_at.toISOString(),
      })),
      user_quests: userQuests.map((quest) => ({
        id: quest.id,
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
        source: quest.source,
        tags: quest.tags,
        created_at: quest.created_at.toISOString(),
        updated_at: quest.updated_at.toISOString(),
        activated_at: quest.activated_at?.toISOString() || null,
        completed_at: quest.completed_at?.toISOString() || null,
      })),
      case_progress: caseProgress.map((progress) => ({
        case_id: progress.case_id,
        node_id: progress.node_id,
        selected_option: progress.selected_option,
        xp_earned: progress.xp_earned,
        completed_at: progress.completed_at.toISOString(),
      })),
      ...(userTree && {
        user_tree: {
          id: userTree.id,
          semantic_version: userTree.semantic_version,
          tree_revision: userTree.tree_revision,
          data: userTree.data,
          updated_at: userTree.updated_at.toISOString(),
        },
      }),
      ...(includeContent &&
        entries.length > 0 && {
          entries: entries.map((entry) => ({
            id: entry.id,
            type: entry.type,
            source: entry.source,
            text: entry.text,
            text_masked: entry.text_masked,
            is_sensitive: entry.is_sensitive,
            participants: entry.participants,
            context_json: entry.context_json,
            file_ref: entry.file_ref,
            tags: entry.tags,
            created_at: entry.created_at.toISOString(),
            updated_at: entry.updated_at.toISOString(),
          })),
        }),
      ...(includeContent &&
        sessions.length > 0 && {
          sessions: sessions.map((session) => ({
            id: session.id,
            entry_id: session.entry_id,
            summary: session.summary,
            insights_json: session.insights_json,
            focus_json: session.focus_json,
            themes: session.themes,
            patterns: session.patterns,
            tensions: session.tensions,
            ability_signals_json: session.ability_signals_json,
            status: session.status,
            analysis_version: session.analysis_version,
            analysis_error: session.analysis_error,
            error_code: session.error_code,
            error_message: session.error_message,
            created_at: session.created_at.toISOString(),
            updated_at: session.updated_at.toISOString(),
            analyzed_at: session.analyzed_at?.toISOString() || null,
            completed_at: session.completed_at?.toISOString() || null,
          })),
        }),
      ...(includeContent &&
        evidence.length > 0 && {
          evidence: evidence.map((ev) => ({
            id: ev.id,
            type: ev.type,
            source: ev.source,
            text: ev.text,
            quest_id: ev.quest_id,
            ability_node_id: ev.ability_node_id,
            session_id: ev.session_id,
            tags: ev.tags,
            created_at: ev.created_at.toISOString(),
            updated_at: ev.updated_at.toISOString(),
          })),
        }),
    };

    // Сохраняем экспорт в файл
    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `user-${userId}-${timestamp}.json`;
    const exportPath = path.join(exportDir, filename);

    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf-8');
    console.log(`\n✅ Данные экспортированы: ${exportPath}`);

    // Статистика
    console.log('\n📊 Статистика экспорта:');
    console.log(`   - AbilityStates: ${abilityStates.length}`);
    console.log(`   - User Quests: ${userQuests.length}`);
    console.log(`   - Case Progress: ${caseProgress.length}`);
    console.log(`   - User Tree: ${userTree ? 'Да' : 'Нет'}`);
    if (includeContent) {
      console.log(`   - Entries: ${entries.length}`);
      console.log(`   - Sessions: ${sessions.length}`);
      console.log(`   - Evidence: ${evidence.length}`);
    }
    console.log(`   - Размер файла: ${(fs.statSync(exportPath).size / 1024).toFixed(2)} KB`);

    return exportPath;
  } catch (error: any) {
    console.error('❌ Ошибка при экспорте:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск скрипта
const userId = process.argv[2];
const includeContent = process.argv.includes('--include-content');

if (!userId) {
  console.error('❌ Укажите userId для экспорта');
  console.log('Использование: npx ts-node scripts/export-user-data.ts <userId> [--include-content]');
  process.exit(1);
}

exportUserData(userId, includeContent)
  .then(() => {
    console.log('\n✅ Экспорт завершен успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });
