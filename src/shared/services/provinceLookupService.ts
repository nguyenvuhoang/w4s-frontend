import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'

export const PROVINCES_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_PROVINCES'

/** Province master item (only the fields the lookups use; the rest of the response is ignored). */
export type ProvinceLookupItem = {
  id: number
  province_code: string
  province_name: string
  m_province_name: string
  short_name: string
  administrative_type: string
  region: string
  sort_order: number | null
}

export type ProvinceLookupFilter = {
  search_text: string
  page_index: number
  page_size: number
}

export type ProvinceLookupResult = {
  items: ProvinceLookupItem[]
  total_count: number
  has_next_page: boolean
}

/** WF_BO_SIMPLE_SEARCH_PROVINCES input: active Vietnamese provinces only (explicit mapping, no spread). */
export type ProvinceSearchRequest = {
  country_id: string
  effective_status: string
  administrative_type: string
  region: string
  search_text: string
  page_index: number
  page_size: number
  status: string
  exclude_deleted: boolean
}

export const buildProvinceSearchRequest = (filter: ProvinceLookupFilter): ProvinceSearchRequest => ({
  country_id: 'VN',
  effective_status: 'ACTIVE',
  administrative_type: '',
  region: '',
  search_text: filter.search_text.trim(),
  page_index: Math.max(filter.page_index, 0),
  page_size: filter.page_size,
  status: 'A',
  exclude_deleted: true
})

const pickDataRoot = (payload: any) => {
  const dataresponse = payload?.dataresponse ?? payload?.payload?.dataresponse
  const data = dataresponse?.data ?? payload?.data ?? payload

  return data?.data ?? data?.input ?? data
}

const pickItems = (root: any): any[] => {
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.items)) return root.items
  if (Array.isArray(root?.data)) return root.data

  return []
}

const text = (value: unknown) => (value === null || value === undefined ? '' : String(value).trim())

const toNumberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

const getExecutionId = (response: any) => text(
  response?.payload?.dataresponse?.execution_id ?? response?.dataresponse?.execution_id ?? response?.execution_id ?? response?.payload?.execution_id
)

const assertWorkflowSuccess = (response: any, fallback: string, language?: Locale | string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse ?? response
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const failed = response?.success === false || dataresponse?.success === false || dataresponse?.code === 'failed'

  if ((Array.isArray(errors) && errors.length > 0) || failed) {
    const message = text(Array.isArray(errors) && errors.length > 0 ? errors[0]?.info ?? errors[0]?.message : dataresponse?.message) || fallback
    const executionId = getExecutionId(response)

    throw new Error(executionId ? `${message} ${language === 'vi' ? 'Mã tra cứu lỗi' : 'Error Reference'}: ${executionId}` : message)
  }
}

const mapProvince = (item: any): ProvinceLookupItem | null => {
  const province_code = text(item?.province_code)

  if (!province_code) return null

  return {
    id: toNumberOrNull(item?.id) ?? 0,
    province_code,
    province_name: text(item?.province_name),
    m_province_name: text(item?.m_province_name),
    short_name: text(item?.short_name),
    administrative_type: text(item?.administrative_type),
    region: text(item?.region),
    sort_order: toNumberOrNull(item?.sort_order)
  }
}

/** Display name: English name on /en when present, otherwise the Vietnamese province_name (never the id). */
export const formatProvinceLabel = (province: Pick<ProvinceLookupItem, 'province_code' | 'province_name' | 'm_province_name'>, locale?: string) => (
  (locale === 'en' && province.m_province_name) || province.province_name || province.province_code
)

export const provinceLookupService = {
  /** One page of the Province master (server-side search / paging; callers load more pages as needed). */
  async searchProvinces({
    sessiontoken,
    language,
    filter
  }: {
    sessiontoken?: string
    language?: Locale | string
    filter: ProvinceLookupFilter
  }): Promise<ProvinceLookupResult> {
    if (!sessiontoken) return { items: [], total_count: 0, has_next_page: false }

    const request = buildProvinceSearchRequest(filter)
    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROVINCES_SEARCH_WORKFLOW_ID,
      input: request,
      language: language as Locale
    })

    assertWorkflowSuccess(response, 'Unable to load provinces.', language)

    const root = pickDataRoot(response)
    const items = pickItems(root).map(mapProvince).filter((item): item is ProvinceLookupItem => item !== null)
    const totalCount = Number(root?.total_count)

    return {
      items,
      total_count: Number.isFinite(totalCount) ? totalCount : items.length,
      has_next_page: root?.has_next_page === true
    }
  }
}
