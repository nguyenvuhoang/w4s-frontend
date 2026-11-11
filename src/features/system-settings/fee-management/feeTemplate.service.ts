import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { createWorkflowError } from '@/shared/utils/workflowError'

import { FEE_TEMPLATE_GROUP, NOTIFICATION_TEMPLATE_ALL_CHANNEL, parseFeeTemplateTranslations, type FeeTemplateLanguage } from './feeTemplate.constants'

export const FEE_TEMPLATE_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_NOTIFICATION_TEMPLATES'
export const FEE_TEMPLATE_DETAIL_WORKFLOW_ID = 'WF_BO_GET_NOTIFICATION_TEMPLATE_BY_ID'
export const FEE_TEMPLATE_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_NOTIFICATION_TEMPLATE'
export const FEE_TEMPLATE_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_NOTIFICATION_TEMPLATE'
export const FEE_TEMPLATE_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_NOTIFICATION_TEMPLATE'

/**
 * Contract status (2026-10-15): the 5 workflows exist on the backend (an unknown id answers
 * "Workflow … not found"), but search and detail answer `system.error` for every input, so their
 * response shape could not be observed. Requests follow the documented samples; responses are
 * mapped tolerantly (snake_case / camelCase aliases) until the real payload can be checked.
 */

export type FeeTemplateItem = {
  id: number | null
  template_code: string
  template_name: string
  template_group: string
  channel: string
  /** Default-language subject / body as stored by the backend. */
  subject: string
  body_html: string
  subject_translations: Record<FeeTemplateLanguage, string>
  body_translations: Record<FeeTemplateLanguage, string>
  is_default: boolean
  /** Returned only if the backend provides them (not part of the documented create request). */
  status: string
  language: string
}

export type FeeTemplateFilter = {
  search_text: string
  /** '' = all channels (key omitted from the request). */
  channel: string
  /** One-based page used by the UI; the request sends page_index - 1. */
  page_index: number
  page_size: number
}

export type FeeTemplateSearchResult = {
  items: FeeTemplateItem[]
  total_count: number
  page_index: number
  page_size: number
}

/** Documented create request; update adds id. template_group is always FEE in Fee Management. */
export type FeeTemplateSaveRequest = {
  template_code: string
  template_name: string
  template_group: string
  channel: string
  subject: string
  subject_translations: string
  body_html: string
  body_translations: string
  is_default: boolean
}

export const emptyFeeTemplateFilter: FeeTemplateFilter = { search_text: '', channel: '', page_index: 1, page_size: 10 }

const pick = (item: any, keys: string[]) => {
  if (!item || typeof item !== 'object') return undefined

  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key]
  }

  return undefined
}

const toNumberOrNull = (value: unknown) => {
  const parsed = Number(value)

  return value === null || value === undefined || value === '' || !Number.isFinite(parsed) ? null : parsed
}

const toBool = (value: unknown) => value === true || value === 1 || value === '1' || value === 'Y' || value === 'true'

const dataOf = (response: any) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const data = dataresponse?.data ?? response?.data

  return data?.input ?? data
}

const assertSuccess = (response: any, fallback: string, workflowId: string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const errors = dataresponse?.errors ?? []

  if ((Array.isArray(errors) && errors.length > 0) || dataresponse?.success === false || dataresponse?.code === 'failed') {
    throw createWorkflowError(response, { fallback, workflowId })
  }
}

export const mapFeeTemplate = (item: any): FeeTemplateItem => {
  const subject = String(pick(item, ['subject', 'title']) ?? '')
  const body = String(pick(item, ['body_html', 'bodyHtml', 'body', 'content']) ?? '')
  const subjectTranslations = parseFeeTemplateTranslations(pick(item, ['subject_translations', 'subjectTranslations']))
  const bodyTranslations = parseFeeTemplateTranslations(pick(item, ['body_translations', 'bodyTranslations']))

  return {
    id: toNumberOrNull(pick(item, ['id', 'template_id', 'templateId'])),
    template_code: String(pick(item, ['template_code', 'templateCode', 'code']) ?? ''),
    template_name: String(pick(item, ['template_name', 'templateName', 'name']) ?? ''),
    template_group: String(pick(item, ['template_group', 'templateGroup']) ?? ''),
    channel: String(pick(item, ['channel']) ?? ''),
    subject,
    body_html: body,
    // The default-language fields fill an empty Vietnamese translation so nothing is lost on edit.
    subject_translations: { vi: subjectTranslations.vi || subject, en: subjectTranslations.en },
    body_translations: { vi: bodyTranslations.vi || body, en: bodyTranslations.en },
    is_default: toBool(pick(item, ['is_default', 'isDefault'])),
    status: String(pick(item, ['status']) ?? ''),
    language: String(pick(item, ['language', 'lang']) ?? '')
  }
}

const run = async (sessiontoken: string | undefined, language: Locale | undefined, workflowid: string, input: Record<string, unknown>, fallback: string) => {
  if (!sessiontoken) throw new Error('Session is required.')

  const response = await workflowService.runFODynamic({ sessiontoken, workflowid, input, language })

  assertSuccess(response, fallback, workflowid)

  return response
}

export const feeTemplateService = {
  search: async ({ sessiontoken, language, filter }: { sessiontoken?: string; language?: Locale; filter: FeeTemplateFilter }): Promise<FeeTemplateSearchResult> => {
    const channel = filter.channel === NOTIFICATION_TEMPLATE_ALL_CHANNEL ? '' : filter.channel
    const request = {
      page_index: Math.max(filter.page_index - 1, 0),
      page_size: filter.page_size,
      search_text: filter.search_text.trim(),
      template_group: FEE_TEMPLATE_GROUP,
      // `ALL` is a CodeList option for the UI filter. It is never sent to the backend; absence
      // of the field requests all channels according to the documented search convention.
      ...(channel ? { channel } : {})
    }
    const response = await run(sessiontoken, language, FEE_TEMPLATE_SEARCH_WORKFLOW_ID, request, 'Unable to load notification templates.')
    const root = dataOf(response)
    const items: any[] = Array.isArray(root?.items) ? root.items : Array.isArray(root) ? root : []
    const responsePage = toNumberOrNull(pick(root, ['page_index', 'pageIndex']))

    return {
      items: items.map(mapFeeTemplate),
      total_count: toNumberOrNull(pick(root, ['total_count', 'totalCount'])) ?? items.length,
      page_index: responsePage === null ? filter.page_index : responsePage + 1,
      page_size: toNumberOrNull(pick(root, ['page_size', 'pageSize'])) ?? filter.page_size
    }
  },

  getById: async ({ sessiontoken, language, id }: { sessiontoken?: string; language?: Locale; id: number }): Promise<FeeTemplateItem | null> => {
    const response = await run(sessiontoken, language, FEE_TEMPLATE_DETAIL_WORKFLOW_ID, { id }, 'Unable to load the notification template.')
    const root = dataOf(response)
    const item = Array.isArray(root?.items) ? root.items[0] : root
    const template = item && typeof item === 'object' ? mapFeeTemplate(item) : null

    return template?.id ? template : null
  },

  create: async ({ sessiontoken, language, fields }: { sessiontoken?: string; language?: Locale; fields: FeeTemplateSaveRequest }) => {
    const response = await run(sessiontoken, language, FEE_TEMPLATE_CREATE_WORKFLOW_ID, fields, 'Unable to create the notification template.')

    return { id: toNumberOrNull(pick(dataOf(response), ['id', 'template_id'])) }
  },

  update: async ({ sessiontoken, language, fields }: { sessiontoken?: string; language?: Locale; fields: FeeTemplateSaveRequest & { id: number } }) => {
    await run(sessiontoken, language, FEE_TEMPLATE_UPDATE_WORKFLOW_ID, fields, 'Unable to update the notification template.')
  },

  remove: async ({ sessiontoken, language, id }: { sessiontoken?: string; language?: Locale; id: number }) => {
    await run(sessiontoken, language, FEE_TEMPLATE_DELETE_WORKFLOW_ID, { id }, 'Unable to delete the notification template.')
  }
}
