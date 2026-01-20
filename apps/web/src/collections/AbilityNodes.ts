import type { CollectionConfig } from 'payload'

export const AbilityNodes: CollectionConfig = {
  slug: 'ability-nodes',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'branch', 'level', 'order'],
    group: 'Дерево способностей',
    description: 'Узлы дерева архитектурных способностей',
  },
  access: {
    read: () => true, // Публичный доступ на чтение
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'nodeId',
      type: 'text',
      required: true,
      unique: true,
      label: 'ID узла',
      admin: {
        description: 'Уникальный идентификатор (например: node_architecture_coupling)',
      },
    },
    {
      name: 'branch',
      type: 'relationship',
      relationTo: 'ability-branches',
      required: true,
      hasMany: false,
      label: 'Ветка',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: 'Название',
    },
    {
      name: 'titleEn',
      type: 'text',
      label: 'Название (EN)',
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      localized: true,
      label: 'Описание',
    },
    {
      name: 'level',
      type: 'select',
      required: true,
      options: [
        { label: 'Базовый', value: 'basic' },
        { label: 'Средний', value: 'mid' },
        { label: 'Продвинутый', value: 'advanced' },
        { label: 'Мастерский', value: 'master' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'prerequisites',
      type: 'relationship',
      relationTo: 'ability-nodes',
      hasMany: true,
      label: 'Пререквизиты',
      admin: {
        description: 'Узлы, которые должны быть разблокированы',
      },
    },
    {
      name: 'conditionsJson',
      type: 'json',
      label: 'Условия разблокировки',
      admin: {
        description: 'JSON с критериями (квесты, evidence и т.д.)',
      },
    },
    // Контент узла
    {
      name: 'whatItGives',
      type: 'richText',
      localized: true,
      label: 'Что даёт',
      admin: {
        description: 'Гипотезы эффектов (не обещания)',
      },
    },
    {
      name: 'tradeoffs',
      type: 'richText',
      localized: true,
      label: 'Trade-offs',
      admin: {
        description: 'Что может стать сложнее',
      },
    },
    {
      name: 'signals',
      type: 'richText',
      localized: true,
      label: 'Признаки интеграции',
      admin: {
        description: 'Signals of integration',
      },
    },
    {
      name: 'noviceTraps',
      type: 'richText',
      localized: true,
      label: 'Ловушки Novice',
      admin: {
        description: 'Типичные ошибки на начальном уровне',
      },
    },
    // Визуализация
    {
      name: 'icon',
      type: 'text',
      label: 'Иконка',
    },
    {
      name: 'color',
      type: 'text',
      label: 'Цвет',
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      label: 'Порядок',
      admin: {
        position: 'sidebar',
      },
    },
    // Позиция на canvas
    {
      name: 'positionX',
      type: 'number',
      label: 'Позиция X',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'positionY',
      type: 'number',
      label: 'Позиция Y',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Активен',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
