import type { getDictionary } from '@/shared/utils/getDictionary'

export type WorkflowsDictionary = Awaited<ReturnType<typeof getDictionary>>

export type WorkflowFilterModel = {
  search_text: string
  page_index: number
  page_size: number
  channel_id: string
}

export type WorkflowSearchRequest = {
  search_text: string
  page_index: number
  page_size: number
  channel_id: string
}

export type WorkflowDefinition = {
  workflow_id: string
  workflow_name: string
  description: string
  channel_id: string
  timeout: number | null
  is_reverse: boolean | null
  status: string | null
  template_response: string
  workflow_event: string
}

export type WorkflowStepItem = {
  step_order: number
  step_code: string
  service_id: string
  description: string
  processing_number: string
  step_timeout: number | null
  should_await_step: boolean | null
  is_reverse: boolean | null
  status: string | null
  sending_template: string
  sub_sending_template: string
  mapping_response: string
  sending_condition: string
  worker_id_map: string
}

export type WorkflowItem = {
  def: WorkflowDefinition
}

export type WorkflowStepsFetchStatus = 'idle' | 'loading' | 'loaded' | 'error'

export type WorkflowStepsCacheEntry = {
  status: WorkflowStepsFetchStatus
  steps: WorkflowStepItem[]
  errorMessage?: string
}

export type WorkflowSearchResponse = {
  items: WorkflowItem[]
  total_count: number
  total_pages: number
  page_index: number
  page_size: number
  has_previous_page: boolean
  has_next_page: boolean
}

export class WorkflowApiError extends Error {
  executionId?: string
  nextAction?: string

  constructor(message: string, executionId?: string, nextAction?: string) {
    super(message)
    this.name = 'WorkflowApiError'
    this.executionId = executionId
    this.nextAction = nextAction
  }
}

export type WorkflowImportResult = {
  def_inserted?: number
  def_updated?: number
  step_inserted?: number
  step_updated?: number
}
