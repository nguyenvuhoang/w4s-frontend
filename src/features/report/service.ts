import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { createWorkflowError } from '@/shared/utils/workflowError'

import type {
  ReportFilterModel,
  ReportItem,
  ReportSearchRequest,
  ReportSearchResponse
} from './types'

export const SEARCH_REPORT_CONFIG_WORKFLOW_ID = 'WF_BO_SEARCH_REPORT_CONFIG'

const emptyReportResponse: ReportSearchResponse = {
  items: [],
  page_index: 0,
  page_size: 10,
  total_count: 0,
  total_pages: 0,
  has_previous_page: false,
  has_next_page: false
}

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

const getField = (item: any, keys: string[]) => {
  if (!item || typeof item !== 'object') return undefined

  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key]
  }

  const normalizedMap = Object.keys(item).reduce<Record<string, any>>((acc, key) => {
    acc[normalizeKey(key)] = item[key]

    return acc
  }, {})

  for (const key of keys) {
    const value = normalizedMap[normalizeKey(key)]

    if (value !== undefined && value !== null) return value
  }

  return undefined
}

const pickDataRoot = (payload: any) => {
  const dataresponse = payload?.dataresponse ?? payload?.payload?.dataresponse
  const data = dataresponse?.data ?? payload?.data ?? payload

  return data?.data ?? data?.input ?? data
}

const pickItems = (root: any): any[] => {
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.items)) return root.items
  if (Array.isArray(root?.data)) return root.data
  if (Array.isArray(root?.input?.items)) return root.input.items
  if (Array.isArray(root?.input?.data)) return root.input.data

  return []
}

const toNumber = (value: any, fallback: number) => {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : fallback
}

const toNullableNumber = (value: any) => {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

const toBoolean = (value: any) => (
  value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

const normalizeResponsePageIndex = (value: any, requestPageIndex: number) => {
  const pageIndex = toNumber(value, requestPageIndex)

  return Math.max(pageIndex, 0)
}

const assertWorkflowSuccess = (response: any, fallback: string, workflowId?: string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const failed = response?.success === false
    || dataresponse?.success === false
    || data?.success === false
    || dataresponse?.code === 'failed'
    || data?.code === 'failed'

  if ((Array.isArray(errors) && errors.length > 0) || failed) {
    throw createWorkflowError(response, { fallback, workflowId })
  }
}

const mapReportItem = (item: any): ReportItem => ({
  id: toNullableNumber(getField(item, ['id', 'report_id', 'reportId'])),
  code: String(getField(item, ['code', 'report_code', 'reportCode']) ?? ''),
  name: String(getField(item, ['name', 'report_name', 'reportName']) ?? ''),
  description: getField(item, ['description', 'report_description', 'reportDescription']) ?? null
})

export const mapReportSearchResponse = (
  response: any,
  request: ReportSearchRequest
): ReportSearchResponse => {
  const root = pickDataRoot(response?.payload ?? response)
  const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
  const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
  const total_pages = toNumber(
    getField(root, ['total_pages', 'totalPages']),
    page_size > 0 ? Math.ceil(total_count / page_size) : 0
  )

  return {
    items: pickItems(root).map(mapReportItem),
    page_index: normalizeResponsePageIndex(getField(root, ['page_index', 'pageIndex']), request.page_index),
    page_size,
    total_count,
    total_pages,
    has_previous_page: toBoolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
    has_next_page: toBoolean(getField(root, ['has_next_page', 'hasNextPage']))
  }
}

export const reportService = {
  getDefaultSearchResponse: (filter?: Partial<ReportFilterModel>): ReportSearchResponse => ({
    ...emptyReportResponse,
    page_index: filter?.page_index ?? emptyReportResponse.page_index,
    page_size: filter?.page_size ?? emptyReportResponse.page_size
  }),

  searchReports: async ({
    sessiontoken,
    language,
    filter
  }: {
    sessiontoken?: string
    language?: Locale
    filter: ReportFilterModel
  }): Promise<ReportSearchResponse> => {
    if (!sessiontoken) return reportService.getDefaultSearchResponse(filter)

    const request: ReportSearchRequest = {
      page_size: filter.page_size,
      page_index: Math.max(filter.page_index, 0),
      search_text: filter.search_text.trim()
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: SEARCH_REPORT_CONFIG_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load reports.', SEARCH_REPORT_CONFIG_WORKFLOW_ID)

    return mapReportSearchResponse(response, request)
  }
}
