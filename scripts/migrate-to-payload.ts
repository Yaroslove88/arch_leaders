/**
 * Скрипт миграции данных из Prisma в PayloadCMS
 * 
 * Этот скрипт:
 * 1. Читает данные из существующей PostgreSQL базы через Prisma
 * 2. Трансформирует их в формат PayloadCMS
 * 3. Записывает в PayloadCMS через Local API
 * 
 * Запуск:
 * cd apps/api && npx prisma generate
 * cd ../.. && npx tsx scripts/migrate-to-payload.ts
 */

import { PrismaClient } from '@prisma/client'

// Импорт PayloadCMS (нужно настроить пути)
// import { getPayload } from 'payload'
// import config from '../apps/web/src/payload.config'

const prisma = new PrismaClient()

interface MigrationStats {
  users: { total: number; migrated: number; errors: number }
  entries: { total: number; migrated: number; errors: number }
  sessions: { total: number; migrated: number; errors: number }
  quests: { total: number; migrated: number; errors: number }
  evidence: { total: number; migrated: number; errors: number }
  abilityNodes: { total: number; migrated: number; errors: number }
  changeLogs: { total: number; migrated: number; errors: number }
}

async function migrateUsers() {
  console.log('\\n📦 Migrating Users...')
  const users = await prisma.user.findMany()
  console.log(`Found ${users.length} users`)
  
  // В реальной миграции:
  // const payload = await getPayload({ config })
  // for (const user of users) {
  //   await payload.create({
  //     collection: 'users',
  //     data: {
  //       telegramUsername: user.telegramUsername,
  //       email: user.email,
  //       password: user.password, // Возможно нужно перехешировать
  //       role: user.role,
  //       status: user.status,
  //       subscriptionPlan: user.subscription_plan,
  //       subscriptionExpiresAt: user.subscription_expires_at,
  //       isVerified: user.is_verified,
  //       lastSeenAt: user.last_seen_at,
  //     },
  //   })
  // }
  
  return users.length
}

async function migrateEntries() {
  console.log('\\n📦 Migrating Entries...')
  const entries = await prisma.entry.findMany()
  console.log(`Found ${entries.length} entries`)
  
  // В реальной миграции нужно:
  // 1. Преобразовать plain text в Lexical rich text
  // 2. Сопоставить userId с новым ID пользователя в Payload
  
  return entries.length
}

async function migrateSessions() {
  console.log('\\n📦 Migrating Sessions...')
  const sessions = await prisma.session.findMany()
  console.log(`Found ${sessions.length} sessions`)
  
  return sessions.length
}

async function migrateQuests() {
  console.log('\\n📦 Migrating Quests...')
  const quests = await prisma.quest.findMany()
  console.log(`Found ${quests.length} quests`)
  
  return quests.length
}

async function migrateEvidence() {
  console.log('\\n📦 Migrating Evidence...')
  const evidence = await prisma.evidence.findMany()
  console.log(`Found ${evidence.length} evidence records`)
  
  return evidence.length
}

async function migrateAbilityNodes() {
  console.log('\\n📦 Migrating Ability Nodes...')
  const nodes = await prisma.abilityNode.findMany()
  console.log(`Found ${nodes.length} ability nodes`)
  
  return nodes.length
}

async function migrateChangeLogs() {
  console.log('\\n📦 Migrating ChangeLogs...')
  const logs = await prisma.changeLog.findMany()
  console.log(`Found ${logs.length} change logs`)
  
  return logs.length
}

async function runMigration() {
  console.log('🚀 Starting migration from Prisma to PayloadCMS...')
  console.log('='.repeat(50))
  
  const stats: MigrationStats = {
    users: { total: 0, migrated: 0, errors: 0 },
    entries: { total: 0, migrated: 0, errors: 0 },
    sessions: { total: 0, migrated: 0, errors: 0 },
    quests: { total: 0, migrated: 0, errors: 0 },
    evidence: { total: 0, migrated: 0, errors: 0 },
    abilityNodes: { total: 0, migrated: 0, errors: 0 },
    changeLogs: { total: 0, migrated: 0, errors: 0 },
  }
  
  try {
    // 1. Миграция пользователей (первыми, т.к. от них зависят остальные)
    stats.users.total = await migrateUsers()
    
    // 2. Миграция узлов способностей (независимы от пользователей)
    stats.abilityNodes.total = await migrateAbilityNodes()
    
    // 3. Миграция записей
    stats.entries.total = await migrateEntries()
    
    // 4. Миграция сессий (зависят от entries)
    stats.sessions.total = await migrateSessions()
    
    // 5. Миграция квестов (зависят от sessions, nodes)
    stats.quests.total = await migrateQuests()
    
    // 6. Миграция evidence (зависят от quests, nodes)
    stats.evidence.total = await migrateEvidence()
    
    // 7. Миграция логов изменений
    stats.changeLogs.total = await migrateChangeLogs()
    
    // Вывод статистики
    console.log('\\n' + '='.repeat(50))
    console.log('📊 Migration Summary (DRY RUN):')
    console.log('='.repeat(50))
    console.log(`Users:        ${stats.users.total} found`)
    console.log(`Entries:      ${stats.entries.total} found`)
    console.log(`Sessions:     ${stats.sessions.total} found`)
    console.log(`Quests:       ${stats.quests.total} found`)
    console.log(`Evidence:     ${stats.evidence.total} found`)
    console.log(`AbilityNodes: ${stats.abilityNodes.total} found`)
    console.log(`ChangeLogs:   ${stats.changeLogs.total} found`)
    console.log('='.repeat(50))
    console.log('\\n⚠️  This was a DRY RUN. No data was actually migrated.')
    console.log('To perform actual migration, uncomment the PayloadCMS code.')
    
  } catch (error) {
    console.error('\\n❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Вспомогательные функции для трансформации данных

/**
 * Преобразовать plain text в Lexical rich text формат
 */
function textToLexical(text: string): any {
  if (!text) return null
  
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'text',
              format: 0,
              style: '',
              mode: 'normal',
              text: text,
              detail: 0,
              version: 1,
            },
          ],
          direction: 'ltr',
        },
      ],
      direction: 'ltr',
    },
  }
}

/**
 * Преобразовать массив строк в массив объектов { tag: string }
 */
function tagsToPayloadFormat(tags: string[] | null): { tag: string }[] {
  if (!tags || !Array.isArray(tags)) return []
  return tags.map(tag => ({ tag }))
}

/**
 * Преобразовать массив участников
 */
function participantsToPayloadFormat(participants: string[] | null): { name: string }[] {
  if (!participants || !Array.isArray(participants)) return []
  return participants.map(name => ({ name }))
}

// Запуск миграции
runMigration()
  .then(() => {
    console.log('\\n✅ Migration script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\\n❌ Migration failed:', error)
    process.exit(1)
  })
