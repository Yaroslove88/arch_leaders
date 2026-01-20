import type { CollectionConfig } from 'payload'

export const Evidence: CollectionConfig = {
  slug: 'evidence',
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['type', 'source', 'user', 'createdAt'],
    group: 'Игровые механики',
    description: 'Доказательства применения способностей',
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
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Ситуация', value: 'situation' },
        { label: 'Наблюдение', value: 'observation' },
        { label: 'Рефлексия', value: 'reflection' },
        { label: 'Обратная связь', value: 'feedback' },
        { label: 'Внешняя обратная связь', value: 'external_feedback' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'source',
      type: 'select',
      options: [
        { label: 'Web', value: 'web' },
        { label: 'Telegram', value: 'telegram' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'text',
      type: 'richText',
      required: true,
      label: 'Содержимое',
    },
    {
      name: 'quest',
      type: 'relationship',
      relationTo: 'quests',
      hasMany: false,
      label: 'Связанный квест',
    },
    {
      name: 'abilityNode',
      type: 'relationship',
      relationTo: 'ability-nodes',
      hasMany: false,
      label: 'Узел способности',
    },
    {
      name: 'session',
      type: 'relationship',
      relationTo: 'sessions',
      hasMany: false,
      label: 'Связанная сессия',
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
  ],
  timestamps: true,
}
