import { describe, expect, it } from 'vitest'

import type { WorkflowStepItem } from './types'
import { buildSequentialWorkflowGraph, getWorkflowGraphStorageKey, isWorkflowGraphConnectionValid } from './workflowGraph'

const steps: WorkflowStepItem[] = [
  { step_order: 2, step_code: 'SECOND', service_id: 'service-b', description: 'Second step', processing_number: '', step_timeout: null, should_await_step: null, is_reverse: null, status: 'A', sending_template: '', sub_sending_template: '', mapping_response: '', sending_condition: '', worker_id_map: '' },
  { step_order: 1, step_code: 'FIRST', service_id: 'service-a', description: 'First step', processing_number: '', step_timeout: null, should_await_step: null, is_reverse: null, status: 'A', sending_template: '', sub_sending_template: '', mapping_response: '', sending_condition: '', worker_id_map: '' }
]

describe('buildSequentialWorkflowGraph', () => {
  it('creates Start, ordered workflow steps, and End with sequential connections', () => {
    const graph = buildSequentialWorkflowGraph(steps)

    expect(graph.nodes.map(node => node.id)).toEqual(['start', 'step:FIRST', 'step:SECOND', 'end'])
    expect(graph.edges.map(edge => [edge.source, edge.target])).toEqual([
      ['start', 'step:FIRST'],
      ['step:FIRST', 'step:SECOND'],
      ['step:SECOND', 'end']
    ])
  })

  it('uses the stored position for a step without storing layout on the workflow step itself', () => {
    const graph = buildSequentialWorkflowGraph(steps, { 'step:FIRST': { x: 420, y: 180 } })

    expect(graph.nodes.find(node => node.id === 'step:FIRST')?.position).toEqual({ x: 420, y: 180 })
    expect(steps[1]).not.toHaveProperty('position')
  })
})

describe('isWorkflowGraphConnectionValid', () => {
  it('rejects a self connection and a connection that would create a cycle', () => {
    const graph = buildSequentialWorkflowGraph(steps)

    expect(isWorkflowGraphConnectionValid({ source: 'step:FIRST', target: 'step:FIRST' }, graph.edges)).toBe(false)
    expect(isWorkflowGraphConnectionValid({ source: 'step:SECOND', target: 'step:FIRST' }, graph.edges)).toBe(false)
  })
})

describe('getWorkflowGraphStorageKey', () => {
  it('namespaces local-only layout by workflow id', () => {
    expect(getWorkflowGraphStorageKey('WF_FEE_IMPORT')).toBe('o24.workflow-graph-layout.WF_FEE_IMPORT')
  })
})
