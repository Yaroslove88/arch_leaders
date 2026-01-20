import type { CollectionConfig } from 'payload'

export const Sessions: CollectionConfig = {
  slug: 'sessions',
  admin: {
    useAsTitle: 'summary',
    defaultColumns: ['status', 'user', 'entry', 'createdAt'],
    group: 'Контент',
    description: 'Сессии анализа записей',
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
      name: 'entry',
      type: 'relationship',
      relationTo: 'entries',
      required: true,
      hasMany: false,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Ожидает', value: 'pending' },
        { label: 'Обрабатывается', value: 'processing' },
        { label: 'Успешно', value: 'succeeded' },
        { label: 'Ошибка', value: 'failed' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'summary',
      type: 'richText',
      label: 'Резюме',
    },
    {
      name: 'insightsJson',
      type: 'json',
      label: 'Инсайты',
      admin: {
        description: 'Массив инсайтов из анализа',
      },
    },
    {
      name: 'focusJson',
      type: 'json',
      label: 'Фокусные точки',
      admin: {
        description: 'Массив фокусных точек',
      },
    },
    {
      name: 'themes',
      type: 'array',
      label: 'Темы',
      fields: [
        {
          name: 'theme',
          type: 'text',
        },
      ],
    },
    {
      name: 'patterns',
      type: 'array',
      label: 'Паттерны поведения',
      fields: [
        {
          name: 'pattern',
          type: 'text',
        },
      ],
    },
    {
      name: 'tensions',
      type: 'array',
      label: 'Напряжения',
      fields: [
        {
          name: 'tension',
          type: 'text',
        },
      ],
    },
    {
      name: 'abilitySignalsJson',
      type: 'json',
      label: 'Сигналы способностей',
      defaultValue: [],
    },
    {
      name: 'analysisVersion',
      type: 'number',
      defaultValue: 1,
      label: 'Версия анализа',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'analysisError',
      type: 'textarea',
      label: 'Ошибка анализа',
      admin: {
        condition: (data) => data?.status === 'failed',
      },
    },
    {
      name: 'errorCode',
      type: 'text',
      label: 'Код ошибки',
      admin: {
        condition: (data) => data?.status === 'failed',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      label: 'Завершено',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
  timestamps: true,
}
