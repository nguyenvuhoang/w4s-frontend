import type { Locale } from '@/configs/i18n'
const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10

import type { SystemCodeCreateRequest, SystemCodeDeleteRequest, SystemCodeFilterModel, SystemCodeSearchRequest, SystemCodeSearchResponse, SystemCodeUpdateRequest } from '../types'
import { SystemCodeApiError } from '../types'

type JsonRecord = Record<string, unknown>

const isRecord = (value: unknown): value is JsonRecord => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const toRequestBody = (filter: SystemCodeFilterModel): SystemCodeSearchRequest => ({
  search_text: filter.search_text.trim(),
  page_index: Math.max(filter.page_index, 0),
  page_size: filter.page_size
})

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
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

const mapSystemCodeItem = (value: unknown) => {
  const item = isRecord(value) ? value : {}
  const indexValue = getField(item, ['code_index', 'codeIndex'])

  return {
    id: toNumber(getField(item, ['id']), 0),
    code_id: String(getField(item, ['code_id', 'codeId']) ?? ''),
    code_name: String(getField(item, ['code_name', 'codeName']) ?? ''),
    caption: String(getField(item, ['caption']) ?? ''),
    m_caption: String(getField(item, ['m_caption', 'mCaption']) ?? ''),
    code_group: String(getField(item, ['code_group', 'codeGroup']) ?? ''),
    code_index: indexValue === undefined || indexValue === '' ? null : toNumber(indexValue, 0),
    code_value: String(getField(item, ['code_value', 'codeValue']) ?? ''),
    ftag: String(getField(item, ['ftag']) ?? ''),
    visible: toBoolean(getField(item, ['visible'])),
    app: String(getField(item, ['app']) ?? 'IPS')
  }
}

const getDataRoot = (payload: unknown) => {
  if (!isRecord(payload)) return {}
  const data = isRecord(payload.data) ? payload.data : payload

  return isRecord(data.data) ? data.data : data
}

const getStringField = (source: unknown, keys: string[]) => {
  if (!isRecord(source)) return ''

  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return ''
}

export const systemCodeService = {
  getDefaultSearchResponse: (filter?: Partial<SystemCodeFilterModel>): SystemCodeSearchResponse => ({
    items: [],
    total_count: 0,
    total_pages: 0,
    page_index: filter?.page_index ?? DEFAULT_PAGE_INDEX,
    page_size: filter?.page_size ?? DEFAULT_PAGE_SIZE,
    has_previous_page: false,
    has_next_page: false
  }),

  async searchSystemCodes({
    language,
    filter
  }: {
    language: Locale
    filter: SystemCodeFilterModel
  }): Promise<SystemCodeSearchResponse> {
    const request = toRequestBody(filter)
    const response = await fetch(`/api/system-settings/code-lists/simple-search?lang=${language}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request)
    })

    const json = await response.json().catch(() => ({})) as unknown

    if (!response.ok || (isRecord(json) && json.success === false)) {
      throw new SystemCodeApiError(
        getStringField(json, ['error_message', 'description', 'message']) || 'Unable to load system codes.',
        getStringField(json, ['execution_id', 'executionId', 'execute_id']),
        getStringField(json, ['next_action', 'nextAction'])
      )
    }

    const root = getDataRoot(json)
    const itemsSource = isRecord(root) && Array.isArray(root.items) ? root.items : []
    const pageSize = isRecord(root) ? toNumber(root.page_size, request.page_size) : request.page_size
    const totalCount = isRecord(root) ? toNumber(root.total_count, 0) : 0

    return {
      items: itemsSource.map(mapSystemCodeItem),
      total_count: totalCount,
      total_pages: isRecord(root) ? toNumber(root.total_pages, pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0) : 0,
      page_index: isRecord(root) ? toNumber(root.page_index, request.page_index) : request.page_index,
      page_size: pageSize,
      has_previous_page: isRecord(root) ? Boolean(root.has_previous_page) : false,
      has_next_page: isRecord(root) ? Boolean(root.has_next_page) : false
    }
  },

  async updateSystemCode({
    language,
    fields
  }: {
    language: Locale
    fields: SystemCodeUpdateRequest
  }): Promise<void> {
    const response = await fetch(`/api/system-settings/code-lists/update?lang=${language}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fields)
    })

    const json = await response.json().catch(() => ({})) as unknown

    if (!response.ok || (isRecord(json) && json.success === false)) {
      throw new SystemCodeApiError(
        getStringField(json, ['error_message', 'description', 'message']) || 'Unable to update system code.',
        getStringField(json, ['execution_id', 'executionId', 'execute_id']),
        getStringField(json, ['next_action', 'nextAction'])
      )
    }
  },

  async createSystemCode({
    language,
    fields
  }: {
    language: Locale
    fields: SystemCodeCreateRequest
  }): Promise<void> {
    const response = await fetch(`/api/system-settings/code-lists/create?lang=${language}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fields)
    })
    const json = await response.json().catch(() => ({})) as unknown

    if (!response.ok || (isRecord(json) && json.success === false)) {
      throw new SystemCodeApiError(
        getStringField(json, ['error_message', 'description', 'message']) || 'Unable to create system code.',
        getStringField(json, ['execution_id', 'executionId', 'execute_id']),
        getStringField(json, ['next_action', 'nextAction'])
      )
    }
  },

  async deleteSystemCode({ language, id }: { language: Locale; id: number }): Promise<void> {
    const fields: SystemCodeDeleteRequest = { id }
    const response = await fetch(`/api/system-settings/code-lists/delete?lang=${language}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fields)
    })
    const json = await response.json().catch(() => ({})) as unknown

    if (!response.ok || (isRecord(json) && json.success === false)) {
      throw new SystemCodeApiError(
        getStringField(json, ['error_message', 'description', 'message']) || 'Unable to delete system code.',
        getStringField(json, ['execution_id', 'executionId', 'execute_id']),
        getStringField(json, ['next_action', 'nextAction'])
      )
    }
  }
}
