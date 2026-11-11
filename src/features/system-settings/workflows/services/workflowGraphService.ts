import type { Edge, Node } from '@xyflow/react'

import type { WorkflowStepItem } from '../types'
import type { WorkflowGraphNodeData, WorkflowGraphLayout } from '../workflowGraph'

export type WorkflowGraphSaveRequest = {
  workflowId: string
  nodes: Array<Node<WorkflowGraphNodeData>>
  edges: Edge[]
  layout: WorkflowGraphLayout
}

export type WorkflowStepSource = {
  stepCode: string
  service?: string
  className?: string
  method?: string
  filePath?: string
  sourceCode?: string
}

export type WorkflowGraphService = {
  getAvailableSteps: (workflowId: string) => Promise<WorkflowStepItem[]>
  saveWorkflowGraph: (request: WorkflowGraphSaveRequest) => Promise<void>
  getStepSource: (stepCode: string) => Promise<WorkflowStepSource>
}

export class WorkflowGraphBackendUnavailableError extends Error {
  constructor() {
    super('Workflow graph backend APIs have not been configured.')
    this.name = 'WorkflowGraphBackendUnavailableError'
  }
}

const backendUnavailable = <Value,>(): Promise<Value> => Promise.reject(new WorkflowGraphBackendUnavailableError())

// This explicit contract intentionally has no endpoint or workflow-id assumptions.
// Wire the three methods to backend routes when their request/response samples are available.
export const workflowGraphService: WorkflowGraphService = {
  getAvailableSteps: () => backendUnavailable<WorkflowStepItem[]>(),
  saveWorkflowGraph: () => backendUnavailable<void>(),
  getStepSource: () => backendUnavailable<WorkflowStepSource>()
}
