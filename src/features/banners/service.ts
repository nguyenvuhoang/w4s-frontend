import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { WorkflowError } from '@/shared/utils/workflowError'

import type {
  BannerFilterModel,
  BannerDetailRequest,
  BannerDeleteRequest,
  BannerDeleteResponse,
  BannerUpdateRequest,
  BannerUpdateResponse,
  BannerCreateRequest,
  BannerCreateResponse,
  BannerItem,
  BannerSearchRequest,
  BannerSearchResponse
} from './types'

export const BANNERS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_BANNERS'
export const BANNER_DETAIL_WORKFLOW_ID = 'WF_BO_GET_BANNER_BY_ID'
export const BANNER_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_BANNER'
export const BANNER_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_BANNER'
export const BANNER_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_BANNER'

const emptyBannerResponse: BannerSearchResponse = {
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

const mapBanner = (item: any): BannerItem => ({
  id: toNullableId(getField(item, ['id', 'banner_id', 'bannerId'])),
  image_url: String(getField(item, ['image_url', 'imageUrl', 'banner_image', 'bannerImage', 'thumbnail_url', 'thumbnailUrl', 'url']) ?? ''),
  title: String(getField(item, ['title', 'banner_title', 'bannerTitle', 'name', 'banner_name', 'bannerName']) ?? ''),
  project_code: String(getField(item, ['project_code', 'projectCode', 'projectcode']) ?? ''),
  project_name: String(getField(item, ['project_name', 'projectName', 'projectname']) ?? ''),
  project_id: toNullableNumber(getField(item, ['project_id', 'projectId'])),
  banner_type: String(getField(item, ['banner_type', 'bannerType', 'type']) ?? ''),
  action_type: String(getField(item, ['action_type', 'actionType', 'banner_action_type', 'bannerActionType', 'action']) ?? ''),
  link_url: toNullableString(getField(item, ['link_url', 'linkUrl', 'target_url', 'targetUrl', 'url_link', 'urlLink', 'href'])),
  effective_from: toNullableString(getField(item, ['effective_from', 'effectiveFrom', 'valid_from', 'validFrom', 'start_date', 'startDate', 'from_date', 'fromDate', 'start_time', 'startTime'])),
  effective_to: toNullableString(getField(item, ['effective_to', 'effectiveTo', 'valid_to', 'validTo', 'end_date', 'endDate', 'to_date', 'toDate', 'end_time', 'endTime'])),
  display_order: toNullableNumber(getField(item, ['display_order', 'displayOrder', 'order', 'sort_order', 'sortOrder', 'priority'])),
  status: String(getField(item, ['status']) ?? '')
})

export const mapBannerSearchResponse = (
  response: any,
  request: BannerSearchRequest
): BannerSearchResponse => {
  const root = pickDataRoot(response?.payload ?? response)
  const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
  const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
  const total_pages = toNumber(
    getField(root, ['total_pages', 'totalPages']),
    page_size > 0 ? Math.ceil(total_count / page_size) : 0
  )

  return {
    items: pickItems(root).map(mapBanner),
    total_count,
    total_pages,
    page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
    page_size,
    has_previous_page: Boolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
    has_next_page: Boolean(getField(root, ['has_next_page', 'hasNextPage']))
  }
}

export const mapBannerDetailResponse = (response: any): BannerItem | null => {
  const root = pickDataRoot(response?.payload ?? response)
  const item = Array.isArray(root) ? root[0] : Array.isArray(root?.items) ? root.items[0] : root

  if (!item || typeof item !== 'object') return null

  return mapBanner(item)
}

export const mapBannerDeleteResponse = (response: any): BannerDeleteResponse => {
  const root = pickDataRoot(response?.payload ?? response)

  return {
    id: toNullableNumber(getField(root, ['id'])),
    status: String(getField(root, ['status']) ?? '')
  }
}

export const mapBannerUpdateResponse = (response: any): BannerUpdateResponse => {
  const root = pickDataRoot(response?.payload ?? response)

  return {
    id: toNullableNumber(getField(root, ['id'])),
    status: String(getField(root, ['status']) ?? '')
  }
}

export const mapBannerCreateResponse = (response: any): BannerCreateResponse => {
  const root = pickDataRoot(response?.payload ?? response)

  return {
    id: toNullableNumber(getField(root, ['id'])),
    status: String(getField(root, ['status']) ?? '')
  }
}

export const bannerService = {
  getDefaultBannerResponse: (filter?: Partial<BannerFilterModel>): BannerSearchResponse => ({
    ...emptyBannerResponse,
    page_index: filter?.page_index ?? emptyBannerResponse.page_index,
    page_size: filter?.page_size ?? emptyBannerResponse.page_size
  }),

  simpleSearchBanners: async ({
    sessiontoken,
    language,
    filter
  }: {
    sessiontoken?: string
    language?: Locale
    filter: BannerFilterModel
  }): Promise<BannerSearchResponse> => {
    if (!sessiontoken) return bannerService.getDefaultBannerResponse(filter)

    const request: BannerSearchRequest = {
      page_size: filter.page_size,
      page_index: Math.max(filter.page_index - 1, 0),
      search_text: filter.search_text.trim(),
      project_id: filter.project_id
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: BANNERS_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load banners.')

    return mapBannerSearchResponse(response, request)
  },

  getBannerById: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<BannerItem | null> => {
    if (!sessiontoken || !Number.isInteger(id) || id <= 0) return null

    const request: BannerDetailRequest = { id }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: BANNER_DETAIL_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load banner detail.')

    return mapBannerDetailResponse(response)
  },

  deleteBanner: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<BannerDeleteResponse> => {
    if (!sessiontoken || !Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid banner ID.')
    }

    const request: BannerDeleteRequest = { id }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: BANNER_DELETE_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to delete banner.')

    return mapBannerDeleteResponse(response)
  },

  updateBanner: async ({
    sessiontoken,
    language,
    data
  }: {
    sessiontoken?: string
    language?: Locale
    data: BannerUpdateRequest
  }): Promise<BannerUpdateResponse> => {
    if (!sessiontoken || !Number.isInteger(data.id) || data.id <= 0) {
      throw new Error('Invalid banner ID.')
    }

    const request: BannerUpdateRequest = {
      id: data.id,
      title: String(data.title ?? ''),
      image_url: String(data.image_url ?? ''),
      link_url: data.link_url ? String(data.link_url) : '',
      banner_type: String(data.banner_type ?? ''),
      valid_from: String(data.valid_from ?? ''),
      valid_to: String(data.valid_to ?? ''),
      display_order: data.display_order ? Number(data.display_order) : null,
      status: String(data.status ?? 'A')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: BANNER_UPDATE_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to update banner.')

    return mapBannerUpdateResponse(response)
  },

  createBanner: async ({
    sessiontoken,
    language,
    data
  }: {
    sessiontoken?: string
    language?: Locale
    data: BannerCreateRequest
  }): Promise<BannerCreateResponse> => {
    if (!sessiontoken || !Number.isInteger(data.project_id) || data.project_id <= 0) {
      throw new Error('Invalid project ID.')
    }

    const request: BannerCreateRequest = {
      project_id: data.project_id,
      title: String(data.title ?? ''),
      image_url: String(data.image_url ?? ''),
      link_url: data.link_url ? String(data.link_url) : null,
      banner_type: String(data.banner_type ?? ''),
      valid_from: String(data.valid_from ?? ''),
      valid_to: String(data.valid_to ?? ''),
      display_order: data.display_order ? Number(data.display_order) : null
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: BANNER_CREATE_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to create banner.')

    return mapBannerCreateResponse(response)
  }
}
