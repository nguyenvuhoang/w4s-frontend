import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { createWorkflowError, normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'

import type { PartnerCreateRequest, PartnerDeleteRequest, PartnerDetailRequest, PartnerFilterModel, PartnerItem, PartnerSearchRequest, PartnerSearchResponse, PartnerUpdateRequest } from './types'

export const PARTNERS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_PARTNERS'
export const PARTNER_DETAIL_WORKFLOW_ID = 'WF_BO_GET_PARTNER_BY_ID'
export const PARTNER_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_PARTNER'
export const PARTNER_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_PARTNER'
export const PARTNER_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_PARTNER'

type UnknownRecord = Record<string, unknown>

const emptyPartnerResponse: PartnerSearchResponse = {
  items: [],
  total_count: 0,
  total_pages: 0,
  page_index: 1,
  page_size: 10
}

const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value)

const getField = (value: unknown, key: string): unknown => isRecord(value) ? value[key] : undefined

const toNumber = (value: unknown, fallback: number) => {
  const result = Number(value)

  return Number.isFinite(result) ? result : fallback
}

const toNullableId = (value: unknown): number | string | null => {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : String(value)
}

const getDataRoot = (response: unknown): unknown => {
  const payload = getField(response, 'payload')
  const dataResponse = getField(payload, 'dataresponse') ?? getField(response, 'dataresponse')
  const data = getField(dataResponse, 'data') ?? getField(payload, 'data') ?? getField(response, 'data')

  return getField(data, 'data') ?? data ?? response
}

const mapPartner = (value: unknown): PartnerItem => ({
  id: toNullableId(getField(value, 'id')),
  partner_code: String(getField(value, 'partner_code') ?? ''),
  partner_name: String(getField(value, 'partner_name') ?? ''),
  contact_name: String(getField(value, 'contact_name') ?? ''),
  phone: String(getField(value, 'phone') ?? ''),
  email: String(getField(value, 'email') ?? ''),
  address: String(getField(value, 'address') ?? ''),
  status: String(getField(value, 'status') ?? '')
})

export const mapPartnerSearchResponse = (response: unknown, request: PartnerSearchRequest): PartnerSearchResponse => {
  const root = getDataRoot(response)
  const items = getField(root, 'items')
  const totalCount = toNumber(getField(root, 'total_count'), 0)
  const totalPages = toNumber(getField(root, 'total_pages'), Math.ceil(totalCount / request.page_size))
  const apiPageIndex = Math.max(toNumber(getField(root, 'page_index'), request.page_index), 0)

  return {
    items: Array.isArray(items) ? items.map(mapPartner) : [],
    total_count: totalCount,
    total_pages: totalPages,
    page_index: apiPageIndex + 1,
    // The workflow has returned inconsistent page_size values; retain the requested UI page size.
    page_size: request.page_size
  }
}

export const partnerService = {
  getDefaultPartnerResponse: (filter?: Partial<PartnerFilterModel>): PartnerSearchResponse => ({
    ...emptyPartnerResponse,
    page_index: filter?.page_index ?? emptyPartnerResponse.page_index,
    page_size: filter?.page_size ?? emptyPartnerResponse.page_size
  }),

  simpleSearchPartners: async ({
    sessiontoken,
    language,
    filter
  }: {
    sessiontoken?: string
    language?: Locale
    filter: PartnerFilterModel
  }): Promise<PartnerSearchResponse> => {
    if (!sessiontoken) return partnerService.getDefaultPartnerResponse(filter)

    const request: PartnerSearchRequest = {
      page_size: filter.page_size,
      page_index: Math.max(filter.page_index - 1, 0),
      search_text: filter.search_text.trim()
    }

    const response: unknown = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PARTNERS_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })
    const error = normalizeWorkflowErrorDetail(response, { fallback: 'Unable to load partners.' })

    if (error.errors?.length || getField(response, 'success') === false) {
      throw createWorkflowError(response, { fallback: 'Unable to load partners.', workflowId: PARTNERS_SEARCH_WORKFLOW_ID })
    }

    return mapPartnerSearchResponse(response, request)
  },

  getPartnerById: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<PartnerItem | null> => {
    if (!sessiontoken || !Number.isInteger(id) || id <= 0) return null

    const request: PartnerDetailRequest = { id }
    const response: unknown = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PARTNER_DETAIL_WORKFLOW_ID,
      input: request,
      language
    })
    const error = normalizeWorkflowErrorDetail(response, { fallback: 'Unable to load partner detail.' })

    if (error.errors?.length || getField(response, 'success') === false) {
      throw createWorkflowError(response, { fallback: 'Unable to load partner detail.', workflowId: PARTNER_DETAIL_WORKFLOW_ID })
    }

    const root = getDataRoot(response)

    return isRecord(root) ? mapPartner(root) : null
  },

  updatePartner: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: PartnerUpdateRequest
  }): Promise<void> => {
    if (!sessiontoken || !Number.isInteger(fields.id) || fields.id <= 0) {
      throw new Error('Invalid partner update request.')
    }

    const response: unknown = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PARTNER_UPDATE_WORKFLOW_ID,
      input: fields,
      language
    })
    const error = normalizeWorkflowErrorDetail(response, { fallback: 'Unable to update partner.' })

    if (error.errors?.length || getField(response, 'success') === false) {
      throw createWorkflowError(response, { fallback: 'Unable to update partner.', workflowId: PARTNER_UPDATE_WORKFLOW_ID })
    }
  },

  createPartner: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: PartnerCreateRequest
  }): Promise<{ id: number | string | null }> => {
    if (!sessiontoken) throw new Error('Invalid partner create request.')

    const request: PartnerCreateRequest = {
      partner_code: fields.partner_code.trim(),
      partner_name: fields.partner_name.trim(),
      contact_name: fields.contact_name.trim(),
      phone: fields.phone.trim(),
      email: fields.email.trim(),
      address: fields.address.trim()
    }
    const response: unknown = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PARTNER_CREATE_WORKFLOW_ID,
      input: request,
      language
    })
    const error = normalizeWorkflowErrorDetail(response, { fallback: 'Unable to create partner.' })

    if (error.errors?.length || getField(response, 'success') === false) {
      throw createWorkflowError(response, { fallback: 'Unable to create partner.', workflowId: PARTNER_CREATE_WORKFLOW_ID })
    }

    return { id: toNullableId(getField(getDataRoot(response), 'id')) }
  },

  /**
   * Sends only { id }. Whether the backend hard- or soft-deletes, and whether it rejects partners
   * still linked to promotions, is decided server-side; the frontend never cascades.
   */
  deletePartner: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<void> => {
    if (!sessiontoken || !Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid partner delete request.')
    }

    const request: PartnerDeleteRequest = { id }
    const response: unknown = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PARTNER_DELETE_WORKFLOW_ID,
      input: request,
      language
    })
    const error = normalizeWorkflowErrorDetail(response, { fallback: 'Unable to delete partner.' })

    if (error.errors?.length || getField(response, 'success') === false) {
      throw createWorkflowError(response, { fallback: 'Unable to delete partner.', workflowId: PARTNER_DELETE_WORKFLOW_ID })
    }
  }
}
