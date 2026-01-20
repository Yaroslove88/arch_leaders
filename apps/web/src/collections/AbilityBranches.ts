import type { CollectionConfig } from 'payload'

export const AbilityBranches: CollectionConfig = {
  slug: 'ability-branches',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'order'],
    group: 'Дерево способностей',
    description: 'Ветки дерева архитектурных способностей',
  },
  access: {
    read: () => true, // Публичный доступ на чтение
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Идентификатор',
      admin: {
        description: 'Уникальный slug ветки (например: subjectivity, architectural_thinking)',
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
      name: 'centralAbility',
      type: 'text',
      required: true,
      localized: true,
      label: 'Центральная способность',
      admin: {
        description: 'Главная способность ветки',
      },
    },
    {
      name: 'color',
      type: 'text',
      label: 'Цвет',
      admin: {
        description: 'HEX цвет для визуализации (например: #4CAF50)',
      },
    },
    {
      name: 'icon',
      type: 'text',
      label: 'Иконка',
      admin: {
        description: 'Имя иконки или эмодзи',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Порядок',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Активна',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
