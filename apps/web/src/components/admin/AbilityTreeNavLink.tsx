'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Ссылка на дерево способностей в навигации админки
 */
export function AbilityTreeNavLink() {
  const pathname = usePathname()
  const isActive = pathname?.includes('/admin/ability-tree')

  return (
    <Link
      href="/admin/ability-tree"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        color: isActive ? '#0070f3' : 'inherit',
        textDecoration: 'none',
        borderRadius: '4px',
        background: isActive ? 'rgba(0, 112, 243, 0.1)' : 'transparent',
        transition: 'all 0.2s ease',
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="5" r="3" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <circle cx="6" cy="17" r="3" />
        <circle cx="18" cy="17" r="3" />
        <line x1="12" y1="12" x2="6" y2="14" />
        <line x1="12" y1="12" x2="18" y2="14" />
      </svg>
      <span>Дерево способностей</span>
    </Link>
  )
}

export default AbilityTreeNavLink
