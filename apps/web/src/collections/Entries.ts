import type { CollectionConfig } from 'payload'

export const Entries: CollectionConfig = {
  slug: 'entries',
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['type', 'source', 'isSensitive', 'createdAt'],
    group: 'Контент',
    description: 'Записи пользователей (ситуации, рефлексии, обратная связь)',
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
        { label: 'Рефлексия', value: 'reflection' },
        { label: 'Обратная связь', value: 'feedback' },
        { label: 'Голосовое', value: 'voice' },
        { label: 'Импорт', value: 'import' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      options: [
        { label: 'Файл', value: 'file' },
        { label: 'Telegram', value: 'telegram' },
        { label: 'Web', value: 'web' },
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
      name: 'textMasked',
      type: 'richText',
      label: 'Маскированное содержимое',
      admin: {
        description: 'Версия для оператора с маскированными данными',
        condition: (data) => data?.isSensitive,
      },
    },
    {
      name: 'isSensitive',
      type: 'checkbox',
      defaultValue: false,
      label: 'Конфиденциально',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'participants',
      type: 'array',
      label: 'Участники',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Имя/Роль',
        },
      ],
    },
    {
      name: 'contextJson',
      type: 'json',
      label: 'Дополнительный контекст',
      admin: {
        description: 'Встреча, решение, результат и т.д.',
      },
    },
    {
      name: 'fileRef',
      type: 'text',
      label: 'Ссылка на файл',
      admin: {
        description: 'S3 путь или локальный файл',
      },
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
