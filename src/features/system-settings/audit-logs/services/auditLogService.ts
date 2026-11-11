import type { Locale } from '@/configs/i18n'
import { learnAPIService } from '@/servers/system-service/services/learnapi.service'

import type {
  AuditLogDetailRequest,
  AuditLogDetailResponse,
  AuditLogItem,
  AuditLogSearchRequest,
  AuditLogSearchResponse
} from '../types'
import { AuditLogWorkflowError } from '../types'

type ServiceOptions = {
  sessiontoken?: string
  language?: Locale
}

const toNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : fallback
}

const toBoolean = (value: unknown) => (
  value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

const normalizeSearchPageIndex = (value: unknown, requestPageIndex: number) => {
  const responsePage = toNumber(value, requestPageIndex)

  return Math.max(responsePage, 0)
}

const getResponseRoot = (response: any) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data ?? {}

  return data?.data ?? data?.input?.data ?? data?.input ?? data
}

const getErrors = (response: any) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse

  return dataresponse?.errors ?? dataresponse?.error ?? response?.payload?.errors ?? response?.errors
}

const assertWorkflowSuccess = (response: any, fallback: string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const root = getResponseRoot(response)
  const errors = getErrors(response)
  const failed = response?.success === false
    || response?.payload?.success === false
    || dataresponse?.success === false
    || root?.success === false
    || dataresponse?.code === 'failed'
    || root?.code === 'failed'

  if ((Array.isArray(errors) && errors.length > 0) || failed) {
    const error = Array.isArray(errors) ? errors[0] ?? {} : {}
    const message = error.info ?? error.message ?? error.description ?? dataresponse?.message ?? fallback

    throw new AuditLogWorkflowError(message, error.next_action ?? dataresponse?.next_action)
  }
}

const mapAuditLogItem = (item: any): AuditLogItem => ({
  execution_id: String(item?.execution_id ?? ''),
  workflow_id: String(item?.workflow_id ?? ''),
  status: item?.status ?? null,
  error: item?.error === undefined || item?.error === null ? null : String(item.error),
  created_on: item?.created_on === undefined || item?.created_on === null ? null : toNumber(item.created_on),
  finish_on: item?.finish_on === undefined || item?.finish_on === null ? null : toNumber(item.finish_on),
  is_success: item?.is_success === undefined || item?.is_success === null ? null : toBoolean(item.is_success),
  workflow_type: item?.workflow_type === undefined || item?.workflow_type === null ? null : String(item.workflow_type),
  reversed_execution_id: item?.reversed_execution_id === undefined || item?.reversed_execution_id === null ? null : String(item.reversed_execution_id),
  reversed_by_execution_id: item?.reversed_by_execution_id === undefined || item?.reversed_by_execution_id === null ? null : String(item.reversed_by_execution_id)
})

export const auditLogService = {
  getDefaultSearchResponse: (filter?: Partial<AuditLogSearchRequest>): AuditLogSearchResponse => ({
    items: [],
    total_count: 0,
    total_pages: 0,
    has_previous_page: false,
    has_next_page: false,
    page_index: filter ? Math.max(filter.pageindex ?? 0, 0) : 0,
    page_size: filter?.pagesize ?? 10,
    total_success: 0,
    total_failed: 0
  }),

  mapSearchResponse(response: any, request: AuditLogSearchRequest): AuditLogSearchResponse {
    const root = getResponseRoot(response)
    const items = Array.isArray(root?.items) ? root.items : []
    const total_count = toNumber(root?.total_count)
    const page_size = toNumber(root?.page_size, request.pagesize)
    const total_pages = toNumber(root?.total_pages, page_size > 0 ? Math.ceil(total_count / page_size) : 0)

    return {
      items: items.map(mapAuditLogItem),
      total_count,
      total_pages,
      has_previous_page: toBoolean(root?.has_previous_page),
      has_next_page: toBoolean(root?.has_next_page),
      page_index: normalizeSearchPageIndex(root?.page_index, request.pageindex),
      page_size,
      total_success: toNumber(root?.total_success),
      total_failed: toNumber(root?.total_failed)
    }
  },

  getDefaultDetailResponse: (): AuditLogDetailResponse => ({
    workflow_info: null,
    workflow_step_info_list: []
  }),

  mapDetailResponse(response: any): AuditLogDetailResponse {
    const root = getResponseRoot(response)

    return {
      workflow_info: root?.workflow_info ?? null,
      workflow_step_info_list: Array.isArray(root?.workflow_step_info_list) ? root.workflow_step_info_list : []
    }
  },

  async searchAuditLogs({
    sessiontoken,
    language,
    filter
  }: ServiceOptions & { filter: AuditLogSearchRequest }): Promise<AuditLogSearchResponse> {
    if (!sessiontoken || !language) return this.getDefaultSearchResponse(filter)

    const response = await learnAPIService.searchWorkflowLog({
      sessiontoken,
      language,
      pageindex: filter.pageindex,
      pagesize: filter.pagesize,
      workflowid: filter.workflowid,
      execution_id: filter.execution_id,
      status: filter.status,
      from_date: filter.from_date,
      to_date: filter.to_date
    })

    assertWorkflowSuccess(response, 'Unable to load audit logs.')

    return this.mapSearchResponse(response, filter)
  },

  async getAuditLogDetail({
    sessiontoken,
    language,
    request
  }: ServiceOptions & { request: AuditLogDetailRequest }): Promise<AuditLogDetailResponse> {
    if (!sessiontoken || !language || !request.execution_id) return this.getDefaultDetailResponse()

    const response = await learnAPIService.getWorkflowLogByExecutionId({
      sessiontoken,
      language,
      execution_id: request.execution_id,
      pageindex: request.pageindex,
      pagesize: request.pagesize
    })

    assertWorkflowSuccess(response, 'Unable to load audit log detail.')

    return this.mapDetailResponse(response)
  }
}
