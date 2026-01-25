import { buildConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { postgresAdapter } from '@payloadcms/db-postgres'
import path from 'path'

// Collections
import { Users } from '@/collections/Users'
import { Entries } from '@/collections/Entries'
import { Sessions } from '@/collections/Sessions'
import { Quests } from '@/collections/Quests'
import { Evidence } from '@/collections/Evidence'
import { AbilityBranches } from '@/collections/AbilityBranches'
import { AbilityNodes } from '@/collections/AbilityNodes'
import { ChangeLogs } from '@/collections/ChangeLogs'

const dirname = __dirname

export default buildConfig({
  // Базовый URL админки
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  
  // Путь к админке
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' | Leadership Architect',
    },
    components: {
      views: {
        // Кастомный view для дерева способностей
        AbilityTree: {
          Component: '@/components/admin/AbilityTreeAdminView#AbilityTreeAdminView',
          path: '/ability-tree',
        },
      },
      // Навигация в админке - единая навигация для всех разделов
      afterNavLinks: ['@/components/admin/UnifiedAdminNavLink#UnifiedAdminNavLink'],
    },
  },
  
  // Коллекции
  collections: [
    Users,
    Entries,
    Sessions,
    Quests,
    Evidence,
    AbilityBranches,
    AbilityNodes,
    ChangeLogs,
  ],
  
  // Rich Text редактор
  editor: lexicalEditor({}),
  
  // База данных PostgreSQL
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/leadership_architect',
    },
    // Не использовать push для автоматической миграции (безопаснее)
    push: false,
  }),
  
  // Секретный ключ для JWT
  secret: process.env.PAYLOAD_SECRET || 'your-super-secret-key-change-in-production',
  
  // TypeScript генерация типов
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  
  // Локализация (русский по умолчанию)
  localization: {
    locales: [
      {
        label: 'Русский',
        code: 'ru',
      },
      {
        label: 'English',
        code: 'en',
      },
    ],
    defaultLocale: 'ru',
    fallback: true,
  },
  
  // CORS для API
  cors: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.NEXT_PUBLIC_SERVER_URL || '',
  ].filter(Boolean),
  
  // GraphQL
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },
  
  // Uploads
  upload: {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  },
})
