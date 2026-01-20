import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { AbilityTreeView } from './AbilityTreeView'

/**
 * Серверный компонент для админки PayloadCMS
 * Загружает данные веток и узлов способностей
 */
export async function AbilityTreeAdminView() {
  const payload = await getPayload({ config })

  // Загружаем ветки
  const branchesResult = await payload.find({
    collection: 'ability-branches',
    limit: 100,
    sort: 'order',
  })

  // Загружаем узлы с populated relationships
  const nodesResult = await payload.find({
    collection: 'ability-nodes',
    limit: 500,
    depth: 2, // Для загрузки prerequisites
    sort: 'order',
  })

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Дерево архитектурных способностей
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Визуализация всех веток и узлов способностей. 
          Узлы можно перетаскивать для настройки layout.
        </p>
        <div style={{ marginTop: '8px', fontSize: '14px', color: '#888' }}>
          Веток: {branchesResult.totalDocs} | Узлов: {nodesResult.totalDocs}
        </div>
      </div>
      
      <AbilityTreeView 
        branches={branchesResult.docs as any[]}
        nodes={nodesResult.docs as any[]}
      />
    </div>
  )
}

export default AbilityTreeAdminView
