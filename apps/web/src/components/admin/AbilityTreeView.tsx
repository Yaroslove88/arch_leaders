'use client'

import React, { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'

// Цвета веток
const BRANCH_COLORS: Record<string, string> = {
  subjectivity: '#E57373',
  architectural_thinking: '#64B5F6',
  resilience: '#81C784',
  responsibility: '#FFD54F',
  feedback: '#BA68C8',
  maturity_environment: '#4DB6AC',
}

// Типы узлов
const nodeTypes: NodeTypes = {
  abilityNode: AbilityNodeComponent,
}

function AbilityNodeComponent({ data }: { data: any }) {
  const branchColor = BRANCH_COLORS[data.branch] || '#9E9E9E'
  
  return (
    <div
      style={{
        padding: '10px 15px',
        borderRadius: '8px',
        border: `2px solid ${branchColor}`,
        background: `${branchColor}20`,
        minWidth: '150px',
        maxWidth: '200px',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}>
        {data.title}
      </div>
      <div style={{ fontSize: '10px', color: '#666' }}>
        {data.level}
      </div>
    </div>
  )
}

interface AbilityBranch {
  id: string
  slug: string
  title: string
  color?: string
}

interface AbilityNode {
  id: string
  nodeId: string
  title: string
  level: string
  branch: AbilityBranch | string
  prerequisites?: AbilityNode[] | string[]
  positionX?: number
  positionY?: number
}

interface AbilityTreeViewProps {
  branches?: AbilityBranch[]
  nodes?: AbilityNode[]
}

export function AbilityTreeView({ branches = [], nodes = [] }: AbilityTreeViewProps) {
  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState([])
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (nodes.length === 0) {
      setLoading(false)
      return
    }

    // Преобразуем данные в формат React Flow
    const flowNodes: Node[] = nodes.map((node, index) => {
      const branchSlug = typeof node.branch === 'string' ? node.branch : node.branch?.slug || 'unknown'
      
      // Автоматическая позиция если не задана
      const x = node.positionX ?? (index % 5) * 250 + 50
      const y = node.positionY ?? Math.floor(index / 5) * 150 + 50

      return {
        id: node.id,
        type: 'abilityNode',
        position: { x, y },
        data: {
          title: node.title,
          level: node.level,
          branch: branchSlug,
          nodeId: node.nodeId,
        },
      }
    })

    // Создаём рёбра на основе prerequisites
    const flowEdges: Edge[] = []
    nodes.forEach((node) => {
      const prerequisites = node.prerequisites || []
      prerequisites.forEach((prereq) => {
        const prereqId = typeof prereq === 'string' ? prereq : prereq.id
        const sourceNode = nodes.find(n => n.id === prereqId || n.nodeId === prereqId)
        if (sourceNode) {
          flowEdges.push({
            id: `${sourceNode.id}-${node.id}`,
            source: sourceNode.id,
            target: node.id,
            type: 'smoothstep',
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#666',
            },
            style: { stroke: '#666', strokeWidth: 2 },
          })
        }
      })
    })

    setNodes(flowNodes)
    setEdges(flowEdges)
    setLoading(false)
  }, [nodes, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '600px',
        color: '#666'
      }}>
        Загрузка дерева способностей...
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '600px',
        color: '#666',
        gap: '16px'
      }}>
        <p>Нет узлов способностей</p>
        <p style={{ fontSize: '14px' }}>
          Добавьте узлы в коллекции Ability Nodes
        </p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#f0f0f0" gap={20} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => BRANCH_COLORS[node.data?.branch] || '#9E9E9E'}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
      
      {/* Легенда веток */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        fontSize: '12px',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Ветки:</div>
        {Object.entries(BRANCH_COLORS).map(([key, color]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: color, borderRadius: '2px' }} />
            <span>{key.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AbilityTreeView
