/**
 * Скрипт для генерации миграций Payload
 * 
 * Запуск: npx tsx src/payload-migrate.ts
 */
import { getPayload } from 'payload'
import config from './payload.config'

async function migrate() {
  console.log('Initializing Payload...')
  
  const payload = await getPayload({ config })
  
  console.log('Payload initialized successfully!')
  console.log('Collections:', Object.keys(payload.collections))
  
  // Payload автоматически создаст таблицы при инициализации
  // если используется push: true в db adapter
  
  process.exit(0)
}

migrate().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
