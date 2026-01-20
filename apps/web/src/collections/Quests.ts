import type { CollectionConfig } from 'payload'

export const Quests: CollectionConfig = {
  slug: 'quests',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'status', 'user', 'createdAt'],
    group: 'Игровые механики',
    description: 'Квесты развития лидерских способностей',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Название',
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      label: 'Описание',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Микро (10-30 мин)', value: 'micro' },
        { label: 'Недельный', value: 'weekly' },
        { label: 'Сюжетный (2-6 недель)', value: 'story' },
        { label: 'Очный', value: 'in-person' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'backlog',
      options: [
        { label: 'В бэклоге', value: 'backlog' },
        { label: 'Активен', value: 'active' },
        { label: 'Завершён', value: 'completed' },
        { label: 'Провален', value: 'failed' },
        { label: 'Архивирован', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'branch',
      type: 'relationship',
      relationTo: 'ability-branches',
      hasMany: false,
      label: 'Ветка способностей',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'linkedNodes',
      type: 'relationship',
      relationTo: 'ability-nodes',
      hasMany: true,
      label: 'Связанные узлы',
    },
    {
      name: 'stepsJson',
      type: 'json',
      label: 'Шаги квеста',
      defaultValue: [],
      admin: {
        description: 'Массив шагов квеста',
      },
    },
    {
      name: 'criteriaJson',
      type: 'json',
      required: true,
      label: 'Критерии выполнения',
      admin: {
        description: 'evidence_required, min_evidence_length, must_include',
      },
    },
    {
      name: 'rewardJson',
      type: 'json',
      label: 'Награда',
      admin: {
        description: 'xp, node_progress',
      },
    },
    {
      name: 'evidenceLinksJson',
      type: 'json',
      label: 'Ссылки на evidence',
      defaultValue: [],
    },
    {
      name: 'dueHint',
      type: 'text',
      label: 'Подсказка по срокам',
    },
    {
      name: 'session',
      type: 'relationship',
      relationTo: 'sessions',
      hasMany: false,
      label: 'Связанная сессия',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'source',
      type: 'text',
      label: 'Источник',
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Теги',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'activatedAt',
      type: 'date',
      label: 'Активирован',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      label: 'Завершён',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
  timestamps: true,
}
