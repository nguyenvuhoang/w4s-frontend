import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { WorkflowError } from '@/shared/utils/workflowError'

import type {
  PromotionFilterModel,
  PromotionCreateRequest,
  PromotionCreateResponse,
  PromotionDeleteRequest,
  PromotionItem,
  PromotionSearchRequest,
  PromotionSearchResponse,
  PromotionUpdateRequest
} from './types'

export const PROMOTIONS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_PROMOTIONS'
export const PROMOTION_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_PROMOTION'
export const PROMOTION_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_PROMOTION'
export const PROMOTION_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_PROMOTION'

/**
 * There is no WF_BO_GET_PROMOTION_BY_ID workflow yet, so the detail lookup below reuses the
 * search workflow instead of inventing a new workflow id.
 */
const PROMOTION_DETAIL_LOOKUP_PAGE_SIZE = 200

const emptyPromotionResponse: PromotionSearchResponse = {
  items: [],
  total_count: 0,
  total_pages: 0,
  page_index: 0,
  page_size: 10,
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

const pickDataResponse = (response: any) => response?.payload?.dataresponse ?? response?.dataresponse ?? response

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

const toNullableId = (value: any) => {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : String(value)
}

const toNullableBoolean = (value: any) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value

  const text = String(value).trim().toLowerCase()

  if (['true', '1', 'y', 'yes'].includes(text)) return true
  if (['false', '0', 'n', 'no'].includes(text)) return false

  return null
}

const toPromotionId = (value: number | string | null | undefined) => {
  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid promotion ID.')

  return id
}

const toNullableString = (value: any) => (
  value === null || value === undefined || value === '' ? null : String(value)
)

const normalizeResponsePage = (value: any, requestPageIndex: number) => {
  const pageIndex = toNumber(value, requestPageIndex)

  return Math.max(pageIndex, 0) + 1
}

const getWorkflowExecutionId = (response: any) => {
  const dataresponse = pickDataResponse(response)
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const firstError = Array.isArray(errors) ? errors[0] : null

  return String(
    firstError?.execution_id
      ?? firstError?.executionId
      ?? firstError?.execute_id
      ?? dataresponse?.execution_id
      ?? dataresponse?.executionId
      ?? data?.execution_id
      ?? data?.executionId
      ?? response?.payload?.execution_id
      ?? response?.execution_id
      ?? ''
  ).trim()
}

const getWorkflowErrorMessage = (response: any, fallback: string) => {
  const dataresponse = pickDataResponse(response)
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const firstError = Array.isArray(errors) ? errors[0] : null

  return firstError?.info
    ?? firstError?.message
    ?? firstError?.description
    ?? dataresponse?.message
    ?? data?.message
    ?? response?.payload?.message
    ?? response?.message
    ?? fallback
}

const assertWorkflowSuccess = (response: any, fallback: string) => {
  const dataresponse = pickDataResponse(response)
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const failed = response?.success === false
    || dataresponse?.success === false
    || data?.success === false
    || dataresponse?.code === 'failed'
    || data?.code === 'failed'

  if ((Array.isArray(errors) && errors.length > 0) || failed) {
    throw new WorkflowError(getWorkflowErrorMessage(response, fallback), getWorkflowExecutionId(response), errors)
  }
}

const mapPromotion = (item: any): PromotionItem => ({
  id: toNullableId(getField(item, ['id'])),
  promotion_code: String(getField(item, ['promotion_code', 'promotionCode']) ?? ''),
  project_id: toNullableNumber(getField(item, ['project_id', 'projectId'])),
  building_id: toNullableNumber(getField(item, ['building_id', 'buildingId'])),
  title: String(getField(item, ['title']) ?? ''),
  summary: String(getField(item, ['summary']) ?? ''),
  content: String(getField(item, ['content']) ?? ''),
  image_url: String(getField(item, ['image_url', 'imageUrl']) ?? ''),
  partner_name: String(getField(item, ['partner_name', 'partnerName']) ?? ''),
  voucher_code: toNullableString(getField(item, ['voucher_code', 'voucherCode'])),
  qr_code_url: toNullableString(getField(item, ['qr_code_url', 'qrCodeUrl'])),
  external_link: toNullableString(getField(item, ['external_link', 'externalLink'])),
  valid_from: toNullableString(getField(item, ['valid_from', 'validFrom'])),
  valid_to: toNullableString(getField(item, ['valid_to', 'validTo'])),
  terms: String(getField(item, ['terms']) ?? ''),
  display_order: toNullableNumber(getField(item, ['display_order', 'displayOrder'])),
  voucher_quantity: toNullableNumber(getField(item, ['voucher_quantity', 'voucherQuantity'])),
  is_web_view: toNullableBoolean(getField(item, ['is_web_view', 'isWebView'])),
  status: String(getField(item, ['status']) ?? '')
})

const mapPromotionCreateResponse = (response: any): PromotionCreateResponse => {
  const root = pickDataRoot(response?.payload ?? response)

  return { id: toNullableId(getField(root, ['id', 'promotion_id', 'promotionId'])) }
}

export const mapPromotionSearchResponse = (
  response: any,
  request: PromotionSearchRequest
): PromotionSearchResponse => {
  const root = pickDataRoot(response?.payload ?? response)
  const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
  const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
  const total_pages = toNumber(
    getField(root, ['total_pages', 'totalPages']),
    page_size > 0 ? Math.ceil(total_count / page_size) : 0
  )

  return {
    items: pickItems(root).map(mapPromotion),
    total_count,
    total_pages,
    page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
    page_size,
    has_previous_page: Boolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
    has_next_page: Boolean(getField(root, ['has_next_page', 'hasNextPage']))
  }
}

export const promotionService = {
  getDefaultPromotionResponse: (filter?: Partial<PromotionFilterModel>): PromotionSearchResponse => ({
    ...emptyPromotionResponse,
    page_index: filter?.page_index ?? emptyPromotionResponse.page_index,
    page_size: filter?.page_size ?? emptyPromotionResponse.page_size
  }),

  simpleSearchPromotions: async ({
    sessiontoken,
    language,
    filter
  }: {
    sessiontoken?: string
    language?: Locale
    filter: PromotionFilterModel
  }): Promise<PromotionSearchResponse> => {
    if (!sessiontoken) return promotionService.getDefaultPromotionResponse(filter)

    const request: PromotionSearchRequest = {
      page_size: filter.page_size,
      page_index: Math.max(filter.page_index - 1, 0),
      search_text: filter.search_text.trim(),
      project_id: filter.project_id
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROMOTIONS_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load promotions.')

    return mapPromotionSearchResponse(response, request)
  },

  createPromotion: async ({
    sessiontoken,
    language,
    data
  }: {
    sessiontoken?: string
    language?: Locale
    data: PromotionCreateRequest
  }): Promise<PromotionCreateResponse> => {
    if (!sessiontoken || !Number.isInteger(data.project_id) || data.project_id <= 0) {
      throw new Error('Invalid project ID.')
    }

    const request: PromotionCreateRequest = {
      display_order: Number(data.display_order),
      project_id: data.project_id,
      terms: String(data.terms ?? '').trim(),
      partner_name: String(data.partner_name ?? '').trim(),
      valid_from: String(data.valid_from ?? ''),
      valid_to: String(data.valid_to ?? ''),
      external_link: String(data.external_link ?? '').trim(),
      image_url: String(data.image_url ?? '').trim(),
      summary: String(data.summary ?? '').trim(),
      title: String(data.title ?? '').trim(),
      promotion_code: String(data.promotion_code ?? '').trim(),
      qr_code_url: String(data.qr_code_url ?? '').trim(),
      voucher_code: String(data.voucher_code ?? '').trim(),
      content: String(data.content ?? '').trim()
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROMOTION_CREATE_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to create promotion.')

    return mapPromotionCreateResponse(response)
  },

  updatePromotion: async ({
    sessiontoken,
    language,
    data
  }: {
    sessiontoken?: string
    language?: Locale
    data: PromotionUpdateRequest
  }): Promise<void> => {
    if (!sessiontoken) throw new Error('Invalid session.')

    const request: PromotionUpdateRequest = {
      id: toPromotionId(data.id),
      title: String(data.title ?? '').trim(),
      summary: String(data.summary ?? '').trim(),
      content: String(data.content ?? '').trim(),
      display_order: Number(data.display_order),
      terms: String(data.terms ?? '').trim(),
      partner_name: String(data.partner_name ?? '').trim(),
      valid_from: String(data.valid_from ?? ''),
      valid_to: String(data.valid_to ?? ''),
      status: String(data.status ?? ''),
      external_link: String(data.external_link ?? '').trim(),
      voucher_quantity: data.voucher_quantity === '' ? '' : Number(data.voucher_quantity),
      is_web_view: data.is_web_view === '' ? '' : Boolean(data.is_web_view),
      image_url: String(data.image_url ?? '').trim(),
      qr_code_url: String(data.qr_code_url ?? '').trim(),
      voucher_code: String(data.voucher_code ?? '').trim()
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROMOTION_UPDATE_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to update promotion.')
  },

  deletePromotion: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number | string | null
  }): Promise<void> => {
    if (!sessiontoken) throw new Error('Invalid session.')

    const request: PromotionDeleteRequest = { id: toPromotionId(id) }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROMOTION_DELETE_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to delete promotion.')
  },

  /**
   * No WF_BO_GET_PROMOTION_BY_ID workflow exists yet. This reuses WF_BO_SIMPLE_SEARCH_PROMOTIONS
   * (scoped to the given project, fetching a large page) and picks the matching row out of the
   * response, since the search response already carries every field the detail screen needs.
   * Once a real detail workflow is provided this should be swapped to call it directly.
   */
  getPromotionById: async ({
    sessiontoken,
    language,
    projectId,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    projectId?: number | null
    id: number | string
  }): Promise<PromotionItem | null> => {
    if (!sessiontoken || !projectId || projectId <= 0) return null

    const request: PromotionSearchRequest = {
      page_size: PROMOTION_DETAIL_LOOKUP_PAGE_SIZE,
      page_index: 0,
      search_text: '',
      project_id: projectId
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROMOTIONS_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load promotion detail.')

    const mapped = mapPromotionSearchResponse(response, request)

    return mapped.items.find(item => String(item.id) === String(id)) ?? null
  }
}
