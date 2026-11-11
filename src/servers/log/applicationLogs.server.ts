import 'server-only'

import logger from '@lib/logger'
import { i18n } from '@/configs/i18n'
import type { Locale } from '@/configs/i18n'

import { getField, mapApplicationLogItem, toNumber } from './applicationLogs.mapper'
import type { ApplicationLogItemDTO } from './applicationLogs.mapper'

export type { ApplicationLogItemDTO }

// Backend REST endpoint (not the shared {workflowid, fields} gateway) — confirmed available on backend.
const APPLICATION_LOGS_ADVANCED_SEARCH_PATH = '/log/api/application-logs/advanced-search'

const getBaseUrl = () => (
  process.env.CMS_API_URL
  || process.env.CMS_HOST
  || ''
).replace(/\/$/, '')

export class ApplicationLogsGatewayError extends Error {
  status: number
  next_action?: string

  constructor(message: string, status: number, next_action?: string) {
    super(message)
    this.name = 'ApplicationLogsGatewayError'
    this.status = status
    this.next_action = next_action
  }
}

export type ApplicationLogsAdvancedSearchRequest = {
  page_index: number
  page_size: number
  search_text: string
  from_date: string | null
  to_date: string | null
  log_level: string
  service_name: string
  correlation_id: string
  log_type: string
  direction: string
  action_name: string
}

export type ApplicationLogsAdvancedSearchResponseDTO = {
  items: ApplicationLogItemDTO[]
  page_index: number
  page_size: number
  total_count: number
  total_pages: number
  total_success?: number
  total_failed?: number
}

const pickDataRoot = (payload: any) => {
  const data = payload?.data ?? payload
  const nested = data?.data ?? data

  return nested
}

const pickItems = (root: any): any[] => {
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.items)) return root.items
  if (Array.isArray(root?.data)) return root.data

  return []
}

/**
 * Calls the backend log service directly (not the shared workflow gateway). Server-only —
 * must never be imported from client components.
 */
export const searchApplicationLogsAdvanced = async (
  request: ApplicationLogsAdvancedSearchRequest,
  { uid, language }: { uid: string; language?: Locale }
): Promise<ApplicationLogsAdvancedSearchResponseDTO> => {
  const baseUrl = getBaseUrl()

  if (!baseUrl) {
    logger.error('❌ Application logs gateway: CMS_API_URL/CMS_HOST is not configured.')
    throw new ApplicationLogsGatewayError('Backend endpoint is not configured.', 500)
  }

  const endpoint = `${baseUrl}${APPLICATION_LOGS_ADVANCED_SEARCH_PATH}`

  let response: Response

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        lang: language || i18n.defaultLocale,
        app: process.env.NEXT_PUBLIC_APPLICATION_CODE || 'BO',
        uid
      },
      body: JSON.stringify(request),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000)
    })
  } catch (error: any) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new ApplicationLogsGatewayError('Backend timeout while loading application logs.', 504)
    }

    // Log the failure shape only — never the request/response payload (may carry tokens/uid).
    logger.error('❌ Application logs gateway request failed:', error?.name ?? error)
    throw new ApplicationLogsGatewayError('Bad gateway: unable to reach backend log service.', 502)
  }

  if (response.status === 401) {
    throw new ApplicationLogsGatewayError('Session expired or unauthorized. Please login again.', 401, 'logout')
  }

  if (!response.ok) {
    logger.error(`❌ Application logs gateway responded with HTTP ${response.status}`)
    throw new ApplicationLogsGatewayError('Bad gateway: backend log service returned an error.', 502)
  }

  const payload = await response.json().catch(() => null)

  if (payload?.errors?.[0]?.next_action === 'logout') {
    throw new ApplicationLogsGatewayError('Session expired or unauthorized. Please login again.', 401, 'logout')
  }

  if (payload?.success === false) {
    throw new ApplicationLogsGatewayError(payload?.message ?? 'Unable to load application logs.', 502)
  }

  const root = pickDataRoot(payload)
  const items = pickItems(root).map(mapApplicationLogItem)

  const pageSize = (toNumber(getField(root, ['page_size']), request.page_size) ?? request.page_size) as number
  const totalCount = (toNumber(getField(root, ['total_count']), items.length) ?? items.length) as number
  const totalSuccessRaw = getField(root, ['total_success'])
  const totalFailedRaw = getField(root, ['total_failed'])

  return {
    items,
    page_index: (toNumber(getField(root, ['page_index']), request.page_index) ?? request.page_index) as number,
    page_size: pageSize,
    total_count: totalCount,
    total_pages: (toNumber(
      getField(root, ['total_pages']),
      pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0
    ) ?? 0) as number,
    total_success: totalSuccessRaw !== undefined ? (toNumber(totalSuccessRaw) as number) : undefined,
    total_failed: totalFailedRaw !== undefined ? (toNumber(totalFailedRaw) as number) : undefined
  }
}
