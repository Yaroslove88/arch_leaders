'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Единая навигация для объединённой админки
 * Включает ссылки на Payload CMS коллекции и кастомные разделы
 */
export function UnifiedAdminNavLink() {
  const pathname = usePathname()
  
  // Кастомные разделы админки (из admin-legacy)
  const customSections = [
    { href: '/admin/overview', label: '📊 Обзор', icon: '📊' },
    { href: '/admin/users-management', label: '👥 Управление пользователями', icon: '👥' },
    { href: '/admin/analytics', label: '📈 Аналитика', icon: '📈' },
    { href: '/admin/content-management', label: '📝 Контент', icon: '📝' },
    { href: '/admin/ai-pipeline', label: '🤖 AI & Pipeline', icon: '🤖' },
    { href: '/admin/jobs', label: '⚙️ Задачи', icon: '⚙️' },
    { href: '/admin/audit', label: '🔒 Аудит', icon: '🔒' },
    { href: '/admin/settings', label: '⚙️ Настройки', icon: '⚙️' },
    { href: '/admin/ability-tree', label: '🌳 Дерево способностей', icon: '🌳' },
  ]

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
      <div style={{ 
        fontSize: '11px', 
        fontWeight: 600, 
        textTransform: 'uppercase', 
        letterSpacing: '0.5px',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: '12px',
        paddingLeft: '16px'
      }}>
        Кастомные разделы
      </div>
      {customSections.map((section) => {
        const isActive = pathname?.startsWith(section.href)
        return (
          <Link
            key={section.href}
            href={section.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              color: isActive ? '#0070f3' : 'rgba(255, 255, 255, 0.7)',
              textDecoration: 'none',
              borderRadius: '4px',
              background: isActive ? 'rgba(0, 112, 243, 0.1)' : 'transparent',
              transition: 'all 0.2s ease',
              fontSize: '14px',
            }}
          >
            <span>{section.icon}</span>
            <span>{section.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export default UnifiedAdminNavLink
