import type { Connection, Edge, Node, XYPosition } from '@xyflow/react'

import type { WorkflowStepItem } from './types'

export type WorkflowGraphNodeKind = 'start' | 'step' | 'end'

export type WorkflowGraphNodeData = {
  kind: WorkflowGraphNodeKind
  label: string
  step?: WorkflowStepItem
  onViewDetail?: (step: WorkflowStepItem) => void
  onViewCode?: (step: WorkflowStepItem) => void
  onRemove?: (nodeId: string) => void
  menuLabels?: { viewDetail: string; viewCode: string; remove: string }
}

export type WorkflowGraph = {
  nodes: Array<Node<WorkflowGraphNodeData>>
  edges: Edge[]
}

export type WorkflowGraphLayout = Record<string, XYPosition>
export type WorkflowGraphLabels = { start: string; end: string }

const DEFAULT_START_POSITION = { x: 40, y: 220 }
const DEFAULT_END_POSITION = { x: 900, y: 220 }

const getDefaultStepPosition = (index: number): XYPosition => ({ x: 240 + index * 280, y: 180 })

export const getWorkflowGraphStorageKey = (workflowId: string) => `o24.workflow-graph-layout.${workflowId}`

export const getWorkflowStepNodeId = (stepCode: string) => `step:${stepCode}`

export const buildSequentialWorkflowGraph = (steps: WorkflowStepItem[], layout: WorkflowGraphLayout = {}, labels: WorkflowGraphLabels = { start: 'Start', end: 'End' }): WorkflowGraph => {
  const orderedSteps = [...steps].sort((left, right) => left.step_order - right.step_order)
  const stepNodes = orderedSteps.map((step, index) => {
    const id = getWorkflowStepNodeId(step.step_code)

    return {
      id,
      type: 'workflowStep',
      position: layout[id] ?? getDefaultStepPosition(index),
      data: { kind: 'step' as const, label: step.step_code, step }
    }
  })
  const nodes: Array<Node<WorkflowGraphNodeData>> = [
    { id: 'start', type: 'workflowBoundary', position: layout.start ?? DEFAULT_START_POSITION, data: { kind: 'start', label: labels.start }, draggable: true },
    ...stepNodes,
    { id: 'end', type: 'workflowBoundary', position: layout.end ?? { ...DEFAULT_END_POSITION, x: Math.max(DEFAULT_END_POSITION.x, 260 + orderedSteps.length * 280) }, data: { kind: 'end', label: labels.end }, draggable: true }
  ]
  const nodeIds = nodes.map(node => node.id)
  const edges = nodeIds.slice(0, -1).map((source, index) => ({
    id: `${source}-${nodeIds[index + 1]}`,
    source,
    target: nodeIds[index + 1],
    type: 'smoothstep'
  }))

  return { nodes, edges }
}

const hasPath = (from: string, to: string, edges: Edge[]): boolean => {
  const visited = new Set<string>()
  const visit = (nodeId: string): boolean => {
    if (nodeId === to) return true
    if (visited.has(nodeId)) return false
    visited.add(nodeId)

    return edges.filter(edge => edge.source === nodeId).some(edge => visit(edge.target))
  }

  return visit(from)
}

export const isWorkflowGraphConnectionValid = (connection: Pick<Connection, 'source' | 'target'>, edges: Edge[]) => {
  if (!connection.source || !connection.target || connection.source === connection.target) return false
  if (connection.source === 'end' || connection.target === 'start') return false

  return !hasPath(connection.target, connection.source, edges)
}

export const getWorkflowGraphLayout = (nodes: Array<Node<WorkflowGraphNodeData>>): WorkflowGraphLayout => (
  Object.fromEntries(nodes.map(node => [node.id, node.position]))
)
