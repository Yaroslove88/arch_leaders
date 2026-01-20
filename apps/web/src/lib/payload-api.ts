/**
 * Payload API Client
 * 
 * Этот клиент предоставляет доступ к данным через Payload CMS.
 * - Server Components: используют Local API (getPayload)
 * - Client Components: используют REST API (/api/...)
 * 
 * Постепенная миграция с NestJS на Payload:
 * 1. Импортируйте функции из этого файла вместо api.ts
 * 2. Server Components используют getPayloadClient()
 * 3. Client Components используют REST endpoints
 */

import { getPayload, type BasePayload } from 'payload'
import config from '@payload-config'

// Типы для совместимости с существующим API
export interface User {
  id: string
  telegramUsername: string
  email?: string
  role: string
  status: string
  subscriptionPlan?: string
  isVerified?: boolean
  lastSeenAt?: string
  createdAt: string
  updatedAt: string
}

export interface Entry {
  id: string
  user: string | User
  type: string
  source: string
  text: any // Lexical rich text
  textMasked?: any
  isSensitive: boolean
  participants?: { name: string }[]
  contextJson?: any
  fileRef?: string
  tags?: { tag: string }[]
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  user: string | User
  entry: string | Entry
  status: string
  summary?: any // Rich text
  insightsJson?: any
  focusJson?: any
  themes?: { theme: string }[]
  patterns?: { pattern: string }[]
  tensions?: { tension: string }[]
  abilitySignalsJson?: any
  analysisVersion: number
  analysisError?: string
  errorCode?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Quest {
  id: string
  user: string | User
  title: string
  description: any // Rich text
  type: string
  status: string
  branch?: string
  linkedNodes?: string[]
  stepsJson?: any
  criteriaJson: any
  rewardJson?: any
  evidenceLinksJson?: any
  dueHint?: string
  session?: string | Session
  source?: string
  tags?: { tag: string }[]
  activatedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Evidence {
  id: string
  user: string | User
  type: string
  source?: string
  text: any // Rich text
  quest?: string | Quest
  abilityNode?: string
  session?: string | Session
  tags?: { tag: string }[]
  createdAt: string
  updatedAt: string
}

export interface AbilityBranch {
  id: string
  slug: string
  title: string
  titleEn?: string
  description: any
  centralAbility: string
  color?: string
  icon?: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AbilityNode {
  id: string
  nodeId: string
  branch: string | AbilityBranch
  title: string
  titleEn?: string
  description: any
  level: string
  prerequisites?: string[] | AbilityNode[]
  conditionsJson?: any
  whatItGives?: any
  tradeoffs?: any
  signals?: any
  noviceTraps?: any
  icon?: string
  color?: string
  order: number
  positionX?: number
  positionY?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// =========================================================================
// SERVER-SIDE API (для Server Components и Server Actions)
// =========================================================================

/**
 * Получить инстанс Payload для серверных операций
 * Использовать только в Server Components и Server Actions!
 */
export async function getPayloadClient(): Promise<BasePayload> {
  return getPayload({ config })
}

// --- Users ---

export async function getUsers(options?: {
  limit?: number
  page?: number
  where?: any
}) {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'users',
    limit: options?.limit ?? 100,
    page: options?.page ?? 1,
    where: options?.where,
  })
}

export async function getUserById(id: string) {
  const payload = await getPayloadClient()
  return payload.findByID({
    collection: 'users',
    id,
  })
}

export async function createUser(data: Partial<User> & { password: string }) {
  const payload = await getPayloadClient()
  return payload.create({
    collection: 'users',
    data: data as any,
  })
}

export async function updateUser(id: string, data: Partial<User>) {
  const payload = await getPayloadClient()
  return payload.update({
    collection: 'users',
    id,
    data: data as any,
  })
}

// --- Entries ---

export async function getEntries(options?: {
  limit?: number
  page?: number
  where?: any
  user?: string
}) {
  const payload = await getPayloadClient()
  const where = options?.where ?? {}
  if (options?.user) {
    where.user = { equals: options.user }
  }
  return payload.find({
    collection: 'entries',
    limit: options?.limit ?? 100,
    page: options?.page ?? 1,
    where,
    sort: '-createdAt',
  })
}

export async function getEntryById(id: string) {
  const payload = await getPayloadClient()
  return payload.findByID({
    collection: 'entries',
    id,
  })
}

export async function createEntry(data: {
  user: string
  type: string
  source: string
  text: any
  isSensitive?: boolean
  participants?: { name: string }[]
  contextJson?: any
  fileRef?: string
  tags?: { tag: string }[]
}) {
  const payload = await getPayloadClient()
  return payload.create({
    collection: 'entries',
    data: data as any,
  })
}

// --- Sessions ---

export async function getSessions(options?: {
  limit?: number
  page?: number
  where?: any
  user?: string
  status?: string
}) {
  const payload = await getPayloadClient()
  const where = options?.where ?? {}
  if (options?.user) {
    where.user = { equals: options.user }
  }
  if (options?.status) {
    where.status = { equals: options.status }
  }
  return payload.find({
    collection: 'sessions',
    limit: options?.limit ?? 100,
    page: options?.page ?? 1,
    where,
    sort: '-createdAt',
    depth: 2,
  })
}

export async function getSessionById(id: string) {
  const payload = await getPayloadClient()
  return payload.findByID({
    collection: 'sessions',
    id,
    depth: 2,
  })
}

export async function createSession(data: {
  user: string
  entry: string
  status?: string
}) {
  const payload = await getPayloadClient()
  return payload.create({
    collection: 'sessions',
    data: data as any,
  })
}

export async function updateSession(id: string, data: Partial<Session>) {
  const payload = await getPayloadClient()
  return payload.update({
    collection: 'sessions',
    id,
    data: data as any,
  })
}

// --- Quests ---

export async function getQuests(options?: {
  limit?: number
  page?: number
  where?: any
  user?: string
  status?: string
  type?: string
}) {
  const payload = await getPayloadClient()
  const where = options?.where ?? {}
  if (options?.user) {
    where.user = { equals: options.user }
  }
  if (options?.status) {
    where.status = { equals: options.status }
  }
  if (options?.type) {
    where.type = { equals: options.type }
  }
  return payload.find({
    collection: 'quests',
    limit: options?.limit ?? 100,
    page: options?.page ?? 1,
    where,
    sort: '-createdAt',
    depth: 2,
  })
}

export async function getQuestById(id: string) {
  const payload = await getPayloadClient()
  return payload.findByID({
    collection: 'quests',
    id,
    depth: 2,
  })
}

export async function createQuest(data: {
  user: string
  title: string
  description: any
  type: string
  criteriaJson: any
  status?: string
  linkedNodes?: string[]
}) {
  const payload = await getPayloadClient()
  return payload.create({
    collection: 'quests',
    data: data as any,
  })
}

export async function updateQuest(id: string, data: Partial<Quest>) {
  const payload = await getPayloadClient()
  return payload.update({
    collection: 'quests',
    id,
    data: data as any,
  })
}

// --- Evidence ---

export async function getEvidenceList(options?: {
  limit?: number
  page?: number
  where?: any
  user?: string
  quest?: string
  abilityNode?: string
}) {
  const payload = await getPayloadClient()
  const where = options?.where ?? {}
  if (options?.user) {
    where.user = { equals: options.user }
  }
  if (options?.quest) {
    where.quest = { equals: options.quest }
  }
  if (options?.abilityNode) {
    where.abilityNode = { equals: options.abilityNode }
  }
  return payload.find({
    collection: 'evidence',
    limit: options?.limit ?? 100,
    page: options?.page ?? 1,
    where,
    sort: '-createdAt',
    depth: 2,
  })
}

export async function getEvidenceById(id: string) {
  const payload = await getPayloadClient()
  return payload.findByID({
    collection: 'evidence',
    id,
    depth: 2,
  })
}

export async function createEvidence(data: {
  user: string
  type: string
  text: any
  source?: string
  quest?: string
  abilityNode?: string
  session?: string
  tags?: { tag: string }[]
}) {
  const payload = await getPayloadClient()
  return payload.create({
    collection: 'evidence',
    data: data as any,
  })
}

// --- Ability Branches ---

export async function getAbilityBranches(options?: {
  limit?: number
  where?: any
}) {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'ability-branches',
    limit: options?.limit ?? 100,
    where: options?.where,
    sort: 'order',
  })
}

export async function getAbilityBranchById(id: string) {
  const payload = await getPayloadClient()
  return payload.findByID({
    collection: 'ability-branches',
    id,
  })
}

export async function getAbilityBranchBySlug(slug: string) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'ability-branches',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
  })
  return result.docs[0] || null
}

// --- Ability Nodes ---

export async function getAbilityNodes(options?: {
  limit?: number
  page?: number
  where?: any
  branch?: string
  level?: string
}) {
  const payload = await getPayloadClient()
  const where = options?.where ?? {}
  if (options?.branch) {
    where.branch = { equals: options.branch }
  }
  if (options?.level) {
    where.level = { equals: options.level }
  }
  return payload.find({
    collection: 'ability-nodes',
    limit: options?.limit ?? 500,
    page: options?.page ?? 1,
    where,
    sort: 'order',
    depth: 2,
  })
}

export async function getAbilityNodeById(id: string) {
  const payload = await getPayloadClient()
  return payload.findByID({
    collection: 'ability-nodes',
    id,
    depth: 2,
  })
}

export async function getAbilityNodeByNodeId(nodeId: string) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'ability-nodes',
    where: {
      nodeId: { equals: nodeId },
    },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] || null
}

// --- ChangeLogs ---

export async function getChangeLogs(options?: {
  limit?: number
  page?: number
  where?: any
  user?: string
  scope?: string
}) {
  const payload = await getPayloadClient()
  const where = options?.where ?? {}
  if (options?.user) {
    where.user = { equals: options.user }
  }
  if (options?.scope) {
    where.scope = { equals: options.scope }
  }
  return payload.find({
    collection: 'changelogs',
    limit: options?.limit ?? 100,
    page: options?.page ?? 1,
    where,
    sort: '-createdAt',
  })
}

export async function createChangeLog(data: {
  user: string
  changeId: string
  scope: string
  action: string
  actor: string
  rationale: string
  entityType?: string
  entityId?: string
  before?: any
  after?: any
}) {
  const payload = await getPayloadClient()
  return payload.create({
    collection: 'changelogs',
    data: data as any,
  })
}

// =========================================================================
// CLIENT-SIDE API (для Client Components)
// =========================================================================

const API_BASE = '/api'

/**
 * REST API клиент для клиентских компонентов
 */
export const payloadRestApi = {
  // Users
  async getUsers(params?: { limit?: number; page?: number }) {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.page) query.set('page', String(params.page))
    const res = await fetch(`${API_BASE}/users?${query}`)
    if (!res.ok) throw new Error('Failed to fetch users')
    return res.json()
  },

  async getUser(id: string) {
    const res = await fetch(`${API_BASE}/users/${id}`)
    if (!res.ok) throw new Error('Failed to fetch user')
    return res.json()
  },

  // Entries
  async getEntries(params?: { limit?: number; page?: number; type?: string }) {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.page) query.set('page', String(params.page))
    if (params?.type) query.set('where[type][equals]', params.type)
    const res = await fetch(`${API_BASE}/entries?${query}`)
    if (!res.ok) throw new Error('Failed to fetch entries')
    return res.json()
  },

  async getEntry(id: string) {
    const res = await fetch(`${API_BASE}/entries/${id}`)
    if (!res.ok) throw new Error('Failed to fetch entry')
    return res.json()
  },

  async createEntry(data: any) {
    const res = await fetch(`${API_BASE}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create entry')
    return res.json()
  },

  // Sessions
  async getSessions(params?: { limit?: number; status?: string }) {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.status) query.set('where[status][equals]', params.status)
    const res = await fetch(`${API_BASE}/sessions?${query}`)
    if (!res.ok) throw new Error('Failed to fetch sessions')
    return res.json()
  },

  async getSession(id: string) {
    const res = await fetch(`${API_BASE}/sessions/${id}?depth=2`)
    if (!res.ok) throw new Error('Failed to fetch session')
    return res.json()
  },

  // Quests
  async getQuests(params?: { limit?: number; status?: string; type?: string }) {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.status) query.set('where[status][equals]', params.status)
    if (params?.type) query.set('where[type][equals]', params.type)
    const res = await fetch(`${API_BASE}/quests?${query}`)
    if (!res.ok) throw new Error('Failed to fetch quests')
    return res.json()
  },

  async getQuest(id: string) {
    const res = await fetch(`${API_BASE}/quests/${id}?depth=2`)
    if (!res.ok) throw new Error('Failed to fetch quest')
    return res.json()
  },

  async createQuest(data: any) {
    const res = await fetch(`${API_BASE}/quests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create quest')
    return res.json()
  },

  async updateQuest(id: string, data: any) {
    const res = await fetch(`${API_BASE}/quests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update quest')
    return res.json()
  },

  // Evidence
  async getEvidence(params?: { limit?: number; quest?: string; abilityNode?: string }) {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.quest) query.set('where[quest][equals]', params.quest)
    if (params?.abilityNode) query.set('where[abilityNode][equals]', params.abilityNode)
    const res = await fetch(`${API_BASE}/evidence?${query}`)
    if (!res.ok) throw new Error('Failed to fetch evidence')
    return res.json()
  },

  async createEvidence(data: any) {
    const res = await fetch(`${API_BASE}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create evidence')
    return res.json()
  },

  // Ability Tree
  async getAbilityBranches() {
    const res = await fetch(`${API_BASE}/ability-branches?sort=order`)
    if (!res.ok) throw new Error('Failed to fetch ability branches')
    return res.json()
  },

  async getAbilityNodes(params?: { branch?: string; level?: string }) {
    const query = new URLSearchParams()
    query.set('limit', '500')
    query.set('sort', 'order')
    query.set('depth', '2')
    if (params?.branch) query.set('where[branch][equals]', params.branch)
    if (params?.level) query.set('where[level][equals]', params.level)
    const res = await fetch(`${API_BASE}/ability-nodes?${query}`)
    if (!res.ok) throw new Error('Failed to fetch ability nodes')
    return res.json()
  },

  async getAbilityNode(id: string) {
    const res = await fetch(`${API_BASE}/ability-nodes/${id}?depth=2`)
    if (!res.ok) throw new Error('Failed to fetch ability node')
    return res.json()
  },

  // ChangeLogs
  async getChangeLogs(params?: { limit?: number; scope?: string }) {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.scope) query.set('where[scope][equals]', params.scope)
    query.set('sort', '-createdAt')
    const res = await fetch(`${API_BASE}/changelogs?${query}`)
    if (!res.ok) throw new Error('Failed to fetch changelogs')
    return res.json()
  },
}

// =========================================================================
// UTILITY FUNCTIONS
// =========================================================================

/**
 * Преобразовать Lexical rich text в plain text
 */
export function richTextToPlainText(richText: any): string {
  if (!richText) return ''
  if (typeof richText === 'string') return richText
  
  // Простое извлечение текста из Lexical формата
  const extractText = (node: any): string => {
    if (!node) return ''
    if (node.text) return node.text
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join('')
    }
    return ''
  }
  
  if (richText.root) {
    return extractText(richText.root)
  }
  
  return ''
}

/**
 * Преобразовать plain text в Lexical rich text
 */
export function plainTextToRichText(text: string): any {
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
