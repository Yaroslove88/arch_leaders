import type { CollectionConfig } from 'payload'

export const ChangeLogs: CollectionConfig = {
  slug: 'changelogs',
  admin: {
    useAsTitle: 'changeId',
    defaultColumns: ['changeId', 'scope', 'action', 'actor', 'createdAt'],
    group: 'Система',
    description: 'Журнал изменений с поддержкой undo',
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
    update: ({ req: { user } }) => user?.role === 'admin',
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
      name: 'changeId',
      type: 'text',
      required: true,
      unique: true,
      label: 'ID изменения',
    },
    {
      name: 'scope',
      type: 'select',
      required: true,
      options: [
        { label: 'Способности', value: 'ability' },
        { label: 'Квесты', value: 'quest' },
        { label: 'Настройки', value: 'settings' },
        { label: 'Система', value: 'system' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'entityType',
      type: 'text',
      label: 'Тип сущности',
      admin: {
        description: 'node, quest, config',
      },
    },
    {
      name: 'entityId',
      type: 'text',
      label: 'ID сущности',
    },
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        { label: 'Создание', value: 'create' },
        { label: 'Обновление', value: 'update' },
        { label: 'Разблокировка', value: 'unlock' },
        { label: 'Интеграция', value: 'integrate' },
        { label: 'Регенерация', value: 'regenerate' },
        { label: 'Откат', value: 'undo' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'treeRevision',
      type: 'number',
      label: 'Ревизия дерева',
    },
    {
      name: 'actor',
      type: 'select',
      required: true,
      options: [
        { label: 'Анализатор', value: 'analyzer' },
        { label: 'Пользователь', value: 'user' },
        { label: 'Система', value: 'system' },
        { label: 'Админ', value: 'admin' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'rationale',
      type: 'textarea',
      required: true,
      label: 'Обоснование',
    },
    {
      name: 'before',
      type: 'json',
      label: 'Состояние до',
    },
    {
      name: 'after',
      type: 'json',
      label: 'Состояние после',
    },
    {
      name: 'linksJson',
      type: 'json',
      label: 'Связи',
      defaultValue: [],
      admin: {
        description: 'entry_ids, evidence_ids, session_id',
      },
    },
    {
      name: 'opsJson',
      type: 'json',
      label: 'Операции',
    },
    {
      name: 'inverseOpsJson',
      type: 'json',
      label: 'Обратные операции',
      admin: {
        description: 'Для undo',
      },
    },
    {
      name: 'isUndoable',
      type: 'checkbox',
      defaultValue: true,
      label: 'Можно откатить',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'undoneAt',
      type: 'date',
      label: 'Откачено',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'undoneByAdmin',
      type: 'text',
      label: 'Откатил админ',
    },
  ],
  timestamps: true,
}
