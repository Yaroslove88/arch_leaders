import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7200, // 2 часа
    verify: false,
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // 10 минут
  },
  admin: {
    useAsTitle: 'telegramUsername',
    defaultColumns: ['telegramUsername', 'email', 'role', 'status', 'subscriptionPlan'],
    group: 'Пользователи',
    description: 'Пользователи системы Leadership Architect',
  },
  access: {
    // Только админы могут видеть всех пользователей
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      // Пользователи видят только себя
      return {
        id: {
          equals: user?.id,
        },
      }
    },
    create: () => true, // Регистрация открыта
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        id: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'telegramUsername',
      type: 'text',
      required: true,
      unique: true,
      label: 'Telegram Username',
      admin: {
        description: 'Username в Telegram (без @)',
      },
    },
    {
      name: 'email',
      type: 'email',
      unique: true,
      label: 'Email',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'Пользователь', value: 'user' },
        { label: 'Администратор', value: 'admin' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Активен', value: 'active' },
        { label: 'Заблокирован', value: 'blocked' },
        { label: 'Удалён', value: 'deleted' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    // Монетизация
    {
      name: 'subscriptionPlan',
      type: 'select',
      defaultValue: 'free',
      options: [
        { label: 'Бесплатный', value: 'free' },
        { label: 'Базовый', value: 'basic' },
        { label: 'Премиум', value: 'premium' },
      ],
      label: 'Тарифный план',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'subscriptionExpiresAt',
      type: 'date',
      label: 'Подписка истекает',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'isVerified',
      type: 'checkbox',
      defaultValue: false,
      label: 'Верифицирован',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'lastSeenAt',
      type: 'date',
      label: 'Последняя активность',
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
