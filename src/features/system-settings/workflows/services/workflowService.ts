import type { Locale } from '@/configs/i18n'

import type {
  WorkflowDefinition,
  WorkflowFilterModel,
  WorkflowImportResult,
  WorkflowItem,
  WorkflowSearchRequest,
  WorkflowSearchResponse,
  WorkflowStepItem
} from '../types'
import { WorkflowApiError } from '../types'

const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10
const CLIENT_REQUEST_TIMEOUT_MS = 20000

type JsonRecord = Record<string, unknown>

const isRecord = (value: unknown): value is JsonRecord => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const toRequestBody = (filter: WorkflowFilterModel): WorkflowSearchRequest => ({
  search_text: filter.search_text.trim(),
  page_index: Math.max(filter.page_index, 0),
  page_size: filter.page_size,
  channel_id: (filter.channel_id ?? '').trim()
})

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

const toNullableNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') return null

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

const toBoolean = (value: unknown): boolean | null => {
  if (value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y') return true
  if (value === false || value === 0 || value === '0' || value === 'false' || value === 'F' || value === 'N') return false

  return null
}

const getField = (item: JsonRecord, keys: string[]) => {
  for (const key of keys) {
    const value = item[key]

    if (value !== undefined && value !== null) return value
  }

  return undefined
}

const getStringField = (source: unknown, keys: string[]) => {
  if (!isRecord(source)) return ''

  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return ''
}

const toStatusString = (value: unknown): string | null => {
  if (typeof value === 'boolean') return value ? 'A' : 'I'
  if (value === undefined || value === null) return null
  const text = String(value).trim()

  return text ? text : null
}

const toText = (value: unknown): string => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const mapWorkflowStep = (value: unknown): WorkflowStepItem => {
  const item = isRecord(value) ? value : {}

  return {
    step_order: toNumber(getField(item, ['step_order', 'stepOrder']), 0),
    step_code: toText(getField(item, ['step_code', 'stepCode'])),
    service_id: toText(getField(item, ['service_id', 'serviceId'])),
    description: toText(getField(item, ['description'])),
    processing_number: toText(getField(item, ['processing_number', 'processingNumber'])),
    step_timeout: toNullableNumber(getField(item, ['step_timeout', 'stepTimeout'])),
    should_await_step: toBoolean(getField(item, ['should_await_step', 'shouldAwaitStep'])),
    is_reverse: toBoolean(getField(item, ['is_reverse', 'isReverse'])),
    status: toStatusString(getField(item, ['status'])),
    sending_template: toText(getField(item, ['sending_template', 'sendingTemplate'])),
    sub_sending_template: toText(getField(item, ['sub_sending_template', 'subSendingTemplate'])),
    mapping_response: toText(getField(item, ['mapping_response', 'mappingResponse'])),
    sending_condition: toText(getField(item, ['sending_condition', 'sendingCondition'])),
    worker_id_map: toText(getField(item, ['worker_id_map', 'workerIdMap']))
  }
}

const mapWorkflowDefinition = (value: unknown): WorkflowDefinition => {
  const item = isRecord(value) ? value : {}

  return {
    workflow_id: toText(getField(item, ['workflow_id', 'workflowId'])),
    workflow_name: toText(getField(item, ['workflow_name', 'workflowName'])),
    description: toText(getField(item, ['description'])),
    channel_id: toText(getField(item, ['channel_id', 'channelId'])),
    timeout: toNullableNumber(getField(item, ['timeout'])),
    is_reverse: toBoolean(getField(item, ['is_reverse', 'isReverse'])),
    status: toStatusString(getField(item, ['status'])),
    template_response: toText(getField(item, ['template_response', 'templateResponse'])),
    workflow_event: toText(getField(item, ['workflow_event', 'workflowEvent']))
  }
}

const mapWorkflowItem = (value: unknown): WorkflowItem => {
  const item = isRecord(value) ? value : {}
  const defSource = getField(item, ['def', 'definition'])
  const defRaw = isRecord(defSource) ? defSource : item

  return {
    def: mapWorkflowDefinition(defRaw)
  }
}

const getDataRoot = (payload: unknown) => {
  if (!isRecord(payload)) return {}
  const data = isRecord(payload.data) ? payload.data : payload

  return isRecord(data.data) ? data.data : data
}

export const workflowService = {
  getDefaultSearchResponse: (filter?: Partial<WorkflowFilterModel>): WorkflowSearchResponse => ({
    items: [],
    total_count: 0,
    total_pages: 0,
    page_index: filter?.page_index ?? DEFAULT_PAGE_INDEX,
    page_size: filter?.page_size ?? DEFAULT_PAGE_SIZE,
    has_previous_page: false,
    has_next_page: false
  }),

  async searchWorkflows({
    language,
    filter
  }: {
    language: Locale
    filter: WorkflowFilterModel
  }): Promise<WorkflowSearchResponse> {
    const request = toRequestBody(filter)
    const response = await fetch(`/api/system-settings/workflows/search?lang=${language}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(CLIENT_REQUEST_TIMEOUT_MS)
    })

    const json = await response.json().catch(() => ({})) as unknown

    if (!response.ok || (isRecord(json) && json.success === false)) {
      throw new WorkflowApiError(
        getStringField(json, ['error_message', 'description', 'message']) || 'Unable to load workflows.',
        getStringField(json, ['execution_id', 'executionId', 'execute_id']),
        getStringField(json, ['next_action', 'nextAction'])
      )
    }

    const root = getDataRoot(json)
    const itemsSourceRaw = isRecord(root) ? getField(root, ['items', 'workflows']) : undefined
    const itemsSource = Array.isArray(itemsSourceRaw) ? itemsSourceRaw : []
    const pageSize = isRecord(root) ? toNumber(root.page_size, request.page_size) : request.page_size
    const totalCount = isRecord(root) ? toNumber(root.total_count, 0) : 0

    return {
      items: itemsSource.map(mapWorkflowItem),
      total_count: totalCount,
      total_pages: isRecord(root) ? toNumber(root.total_pages, pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0) : 0,
      page_index: isRecord(root) ? toNumber(root.page_index, request.page_index) : request.page_index,
      page_size: pageSize,
      has_previous_page: isRecord(root) ? Boolean(root.has_previous_page) : false,
      has_next_page: isRecord(root) ? Boolean(root.has_next_page) : false
    }
  },

  async exportAllWorkflows({ language }: { language: Locale }): Promise<{ workflows: unknown[] }> {
    const response = await fetch(`/api/system-settings/workflows/export-all?lang=${language}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    })

    const json = await response.json().catch(() => ({})) as unknown

    if (!response.ok || (isRecord(json) && json.success === false)) {
      throw new WorkflowApiError(
        getStringField(json, ['error_message', 'description', 'message']) || 'Unable to export workflows.',
        getStringField(json, ['execution_id', 'executionId', 'execute_id']),
        getStringField(json, ['next_action', 'nextAction'])
      )
    }

    const root = getDataRoot(json)
    const workflows = isRecord(root) && Array.isArray(root.workflows) ? root.workflows : []

    return { workflows }
  },

  async importWorkflows({
    language,
    file
  }: {
    language: Locale
    file: File
  }): Promise<WorkflowImportResult> {
    const formData = new FormData()

    formData.append('File', file)

    const response = await fetch(`/api/system-settings/workflows/import?lang=${language}`, {
      method: 'POST',
      body: formData
    })

    const json = await response.json().catch(() => ({})) as unknown

    if (!response.ok || (isRecord(json) && json.success === false)) {
      throw new WorkflowApiError(
        getStringField(json, ['error_message', 'description', 'message']) || 'Unable to import workflows.',
        getStringField(json, ['execution_id', 'executionId', 'execute_id']),
        getStringField(json, ['next_action', 'nextAction'])
      )
    }

    const data = isRecord(json) && isRecord(json.data) ? json.data : {}

    return {
      def_inserted: toNullableNumber(data.def_inserted) ?? undefined,
      def_updated: toNullableNumber(data.def_updated) ?? undefined,
      step_inserted: toNullableNumber(data.step_inserted) ?? undefined,
      step_updated: toNullableNumber(data.step_updated) ?? undefined
    }
  },

  async getWorkflowSteps({
    language,
    workflowId
  }: {
    language: Locale
    workflowId: string
  }): Promise<WorkflowStepItem[]> {
    const response = await fetch(`/api/system-settings/workflows/get-steps-by-workflow-id?lang=${language}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ workflow_id: workflowId }),
      signal: AbortSignal.timeout(CLIENT_REQUEST_TIMEOUT_MS)
    })

    const json = await response.json().catch(() => ({})) as unknown

    if (!response.ok || (isRecord(json) && json.success === false)) {
      throw new WorkflowApiError(
        getStringField(json, ['error_message', 'description', 'message']) || 'Unable to load workflow steps.',
        getStringField(json, ['execution_id', 'executionId', 'execute_id']),
        getStringField(json, ['next_action', 'nextAction'])
      )
    }

    const root = getDataRoot(json)
    const stepsSource = isRecord(root) && Array.isArray(root.steps) ? root.steps : []

    return stepsSource.map(mapWorkflowStep).sort((a, b) => a.step_order - b.step_order)
  }
}
