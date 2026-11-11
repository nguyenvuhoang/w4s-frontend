import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { createWorkflowError, getWorkflowErrorPresentation } from '@/shared/utils/workflowError'

import {
  BANKHUB_ACCOUNT_DEFAULT_PAGE_SIZE,
  BANKHUB_ACCOUNT_SEARCH_WORKFLOW_ID,
  BANKHUB_COMPANY_DEFAULT_PAGE_SIZE,
  BANKHUB_COMPANY_SEARCH_WORKFLOW_ID,
  BANKHUB_CREATE_LINK_WORKFLOW_ID,
  BANKHUB_DEFAULT_PROVIDER,
  BANKHUB_TRANSACTION_DEFAULT_PAGE_SIZE,
  BANKHUB_TRANSACTION_SEARCH_WORKFLOW_ID
} from './bankhub.constants'
import type {
  BankHubAccount,
  BankHubAccountFilter,
  BankHubAccountSearchRequest,
  BankHubAccountSearchResult,
  BankHubCompany,
  BankHubCompanyConfiguration,
  BankHubCompanyFilter,
  BankHubCompanySearchError,
  BankHubCompanySearchRequest,
  BankHubCompanySearchResult,
  BankHubLinkTokenData,
  BankHubTransaction,
  BankHubTransactionFilter,
  BankHubTransactionSearchRequest,
  BankHubTransactionSearchResult,
  CreateBankHubLinkRequest
} from './bankhub.types'

const toText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

/*
 * Response shape from runFODynamic (http.ts -> /api/system-service -> callSystemServiceBackend):
 *   { status, payload: { dataresponse: <backend body> } }
 * so the backend `data.hosted_link_url` lives at `payload.dataresponse.data.hosted_link_url`.
 * For 400/403/404/500/503/504 http.ts returns (does not throw) `{ status, payload: { code, success: false,
 * message, dataresponse } }`, where `dataresponse` is the backend body or `{ error: [...] }`.
 */
const getDataResponse = (response: any) => response?.payload?.dataresponse

const assertWorkflowSuccess = (response: any, fallback: string, workflowId = BANKHUB_CREATE_LINK_WORKFLOW_ID) => {
  const dataresponse = getDataResponse(response)
  const errors = [
    ...(Array.isArray(dataresponse?.errors) ? dataresponse.errors : []),
    ...(Array.isArray(dataresponse?.error) ? dataresponse.error : [])
  ]
  const failed = (typeof response?.status === 'number' && response.status >= 400)
    || response?.payload?.success === false
    || dataresponse?.success === false
    || dataresponse?.code === 'failed'

  if (errors.length > 0 || failed) {
    const payloadMessage = response?.payload?.message
    const message = toText(dataresponse?.message)
      || (Array.isArray(payloadMessage) ? payloadMessage.filter(Boolean).join('\n') : toText(payloadMessage))

    // Normalised so createWorkflowError sees both `errors` and legacy `error` items plus the real backend message.
    throw createWorkflowError(
      { ...dataresponse, errors, message: message || undefined },
      { fallback, workflowId }
    )
  }
}

const mapLinkTokenData = (response: any): BankHubLinkTokenData => {
  const data = getDataResponse(response)?.data
  const hostedLinkUrl = toText(data?.hosted_link_url)

  if (!hostedLinkUrl) {
    // Keeps execution_id from the (successful) response so the error can be traced on backend.
    throw createWorkflowError(response, {
      fallback: 'BankHub hosted_link_url is missing',
      workflowId: BANKHUB_CREATE_LINK_WORKFLOW_ID
    })
  }

  return {
    xid: toText(data?.xid),
    hosted_link_url: hostedLinkUrl,
    link_token: toText(data?.link_token),
    expires_at: toText(data?.expires_at)
  }
}

const toNumber = (value: unknown, fallback: number) => {
  const numberValue = Number(value)

  return value !== null && value !== '' && Number.isFinite(numberValue) ? numberValue : fallback
}

const toBoolean = (value: unknown) => (
  value === true || value === 1 || value === '1' || value === 'true' || value === 'Y'
)

const toOptional = <T,>(value: T | undefined): T | null => (value === undefined || value === '' ? null : value)

const mapCompanyConfiguration = (value: any): BankHubCompanyConfiguration | null => {
  if (!value || typeof value !== 'object') return null

  return {
    payment_code: toOptional(value.payment_code),
    payment_code_prefix: toOptional(value.payment_code_prefix),
    payment_code_suffix_from: toOptional(value.payment_code_suffix_from),
    payment_code_suffix_to: toOptional(value.payment_code_suffix_to),
    payment_code_suffix_character_type: toOptional(value.payment_code_suffix_character_type),
    data_storage_time: toOptional(value.data_storage_time),
    transaction_amount: toOptional(value.transaction_amount)
  }
}

const mapCompany = (item: any): BankHubCompany => ({
  provider: toText(item?.provider),
  xid: toText(item?.xid),
  full_name: toText(item?.full_name),
  status: toText(item?.status),
  is_active: toBoolean(item?.is_active),
  created_at: toText(item?.created_at) || null,
  configuration: mapCompanyConfiguration(item?.configuration)
})

const toCompanySearchRequest = (filter: BankHubCompanyFilter): BankHubCompanySearchRequest => ({
  page_index: Math.max(filter.page - 1, 0),
  page_size: filter.page_size > 0 ? filter.page_size : BANKHUB_COMPANY_DEFAULT_PAGE_SIZE,
  search_text: filter.search_text.trim()
})

const mapCompanySearchResult = (response: any, request: BankHubCompanySearchRequest): BankHubCompanySearchResult => {
  const data = getDataResponse(response)?.data
  const pageSize = toNumber(data?.page_size, request.page_size)
  const totalCount = toNumber(data?.total_count, 0)

  return {
    total_count: totalCount,
    total_pages: toNumber(data?.total_pages, pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0),
    has_previous_page: toBoolean(data?.has_previous_page),
    has_next_page: toBoolean(data?.has_next_page),
    items: Array.isArray(data?.items) ? data.items.map(mapCompany) : [],
    page_index: toNumber(data?.page_index, request.page_index),
    page_size: pageSize
  }
}

export const getEmptyBankHubCompanySearchResult = (filter: BankHubCompanyFilter): BankHubCompanySearchResult => {
  const request = toCompanySearchRequest(filter)

  return {
    total_count: 0,
    total_pages: 0,
    has_previous_page: false,
    has_next_page: false,
    items: [],
    page_index: request.page_index,
    page_size: request.page_size
  }
}

/** Friendly message + execution_id only; never the raw backend payload. */
export const toBankHubCompanySearchError = (error: unknown, fallback: string): BankHubCompanySearchError => {
  const presentation = getWorkflowErrorPresentation(error, fallback)

  return {
    message: presentation.message,
    executionId: presentation.executionId,
    workflowId: presentation.workflowStep ?? BANKHUB_COMPANY_SEARCH_WORKFLOW_ID
  }
}

const toOptionalText = (value: unknown) => {
  if (value === null || value === undefined) return null

  const text = String(value).trim()

  return text || null
}

const toFlag = (value: unknown) => (value === null || value === undefined ? '' : String(value).trim())

const mapAccount = (item: any): BankHubAccount => ({
  xid: toText(item?.xid),
  company_xid: toText(item?.company_xid),
  brand_name: toText(item?.brand_name),
  bank_bin: toOptionalText(item?.bank_bin),
  bank_code: toOptionalText(item?.bank_code),
  account_holder_name: toText(item?.account_holder_name),
  account_number: toOptionalText(item?.account_number) ?? '',
  accumulated: toOptionalText(item?.accumulated) ?? '',
  account_type: toText(item?.account_type),
  bank_api_connected: toFlag(item?.bank_api_connected),
  active: toFlag(item?.active),
  last_transaction: toOptionalText(item?.last_transaction),
  created_at: toOptionalText(item?.created_at),
  updated_at: toOptionalText(item?.updated_at)
})

const toAccountSearchRequest = (
  companyXid: string,
  provider: string | null | undefined,
  filter: BankHubAccountFilter
): BankHubAccountSearchRequest => ({
  page_index: Math.max(filter.page - 1, 0),
  page_size: filter.page_size > 0 ? filter.page_size : BANKHUB_ACCOUNT_DEFAULT_PAGE_SIZE,
  search_text: '',
  company_xid: companyXid.trim(),
  bank_id: '',
  provider: provider?.trim() || BANKHUB_DEFAULT_PROVIDER
})

/** Backend body is `{ data: { data: BankHubAccount[], meta } }`: the list is `data.data`, never `data` itself. */
export const mapAccountSearchResult = (response: any, request: BankHubAccountSearchRequest): BankHubAccountSearchResult => {
  const data = getDataResponse(response)?.data
  const meta = data?.meta
  const pageSize = toNumber(meta?.per_page, request.page_size)
  const totalCount = toNumber(meta?.total, 0)

  return {
    items: Array.isArray(data?.data) ? data.data.map(mapAccount) : [],
    total_count: totalCount,
    total_pages: toNumber(meta?.page_count, pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0),
    has_next_page: toBoolean(meta?.has_more),
    page_size: pageSize
  }
}

export const getEmptyBankHubAccountSearchResult = (pageSize = BANKHUB_ACCOUNT_DEFAULT_PAGE_SIZE): BankHubAccountSearchResult => ({
  items: [],
  total_count: 0,
  total_pages: 0,
  has_next_page: false,
  page_size: pageSize
})

export const toBankHubAccountSearchError = (error: unknown, fallback: string): BankHubCompanySearchError => {
  const presentation = getWorkflowErrorPresentation(error, fallback)

  return {
    message: presentation.message,
    executionId: presentation.executionId,
    workflowId: presentation.workflowStep ?? BANKHUB_ACCOUNT_SEARCH_WORKFLOW_ID
  }
}

const toTransferType = (value: string): BankHubTransactionSearchRequest['transfer_type'] => (
  value === 'credit' || value === 'debit' ? value : ''
)

const toWebhookSuccess = (value: unknown): 0 | 1 | null => {
  if (value === null || value === undefined || value === '') return null

  return Number(value) === 1 ? 1 : 0
}

export const getDefaultBankHubTransactionFilter = (
  pageSize = BANKHUB_TRANSACTION_DEFAULT_PAGE_SIZE
): BankHubTransactionFilter => ({
  page: 1,
  page_size: pageSize,
  search_text: '',
  bank_account_xid: '',
  brand_name: '',
  start_transaction_date: '',
  end_transaction_date: '',
  transfer_type: '',
  webhook_success: ''
})

export const toTransactionSearchRequest = (
  companyXid: string,
  provider: string | null | undefined,
  filter: BankHubTransactionFilter
): BankHubTransactionSearchRequest => ({
  page_index: Math.max(filter.page - 1, 0),
  page_size: filter.page_size > 0 ? filter.page_size : BANKHUB_TRANSACTION_DEFAULT_PAGE_SIZE,
  search_text: filter.search_text.trim(),
  company_xid: companyXid.trim(),
  bank_account_xid: filter.bank_account_xid.trim(),
  brand_name: filter.brand_name.trim(),
  transaction_date: null,
  start_transaction_date: filter.start_transaction_date.trim() || null,
  end_transaction_date: filter.end_transaction_date.trim() || null,
  transfer_type: toTransferType(filter.transfer_type),
  webhook_success: toWebhookSuccess(filter.webhook_success),
  provider: provider?.trim() || BANKHUB_DEFAULT_PROVIDER
})

const mapTransaction = (item: any): BankHubTransaction => ({
  transaction_id: toText(item?.transaction_id),
  transaction_date: toText(item?.transaction_date),
  bank_account_xid: toText(item?.bank_account_xid),
  company_xid: toText(item?.company_xid),
  brand_name: toText(item?.brand_name),
  account_number: toOptionalText(item?.account_number) ?? '',
  va: toOptionalText(item?.va),
  va_xid: toOptionalText(item?.va_xid),
  reference_number: toOptionalText(item?.reference_number) ?? '',
  transfer_type: toText(item?.transfer_type).toLowerCase(),
  amount: toNumber(item?.amount, 0),
  transaction_content: toOptionalText(item?.transaction_content),
  payment_code: toOptionalText(item?.payment_code),
  webhook_success: toWebhookSuccess(item?.webhook_success)
})

/** Backend body is `{ data: { data: BankHubTransaction[], meta } }`: the list is `data.data`. */
export const mapTransactionSearchResult = (
  response: any,
  request: BankHubTransactionSearchRequest
): BankHubTransactionSearchResult => {
  const data = getDataResponse(response)?.data
  const meta = data?.meta
  const pageSize = toNumber(meta?.per_page, request.page_size)
  const totalCount = toNumber(meta?.total, 0)

  return {
    items: Array.isArray(data?.data) ? data.data.map(mapTransaction) : [],
    total_count: totalCount,
    total_pages: toNumber(meta?.page_count, pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0),
    has_next_page: toBoolean(meta?.has_more),
    page_size: pageSize
  }
}

export const getEmptyBankHubTransactionSearchResult = (
  pageSize = BANKHUB_TRANSACTION_DEFAULT_PAGE_SIZE
): BankHubTransactionSearchResult => ({
  items: [],
  total_count: 0,
  total_pages: 0,
  has_next_page: false,
  page_size: pageSize
})

export const toBankHubTransactionSearchError = (error: unknown, fallback: string): BankHubCompanySearchError => {
  const presentation = getWorkflowErrorPresentation(error, fallback)

  return {
    message: presentation.message,
    executionId: presentation.executionId,
    workflowId: presentation.workflowStep ?? BANKHUB_TRANSACTION_SEARCH_WORKFLOW_ID
  }
}

export const bankHubService = {
  /** `filter.page` is the 1-based UI page; the request sends the backend's 0-based `page_index`. */
  searchCompanies: async ({
    sessiontoken,
    language,
    filter,
    fallbackMessage
  }: {
    sessiontoken?: string
    language?: Locale
    filter: BankHubCompanyFilter
    fallbackMessage: string
  }): Promise<BankHubCompanySearchResult> => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const request = toCompanySearchRequest(filter)

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: BANKHUB_COMPANY_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, fallbackMessage, BANKHUB_COMPANY_SEARCH_WORKFLOW_ID)

    return mapCompanySearchResult(response, request)
  },

  /**
   * No dedicated detail workflow exists yet: looks the company up through the provided search
   * workflow (`search_text = xid`) and keeps only the exact XID match. Returns null when not found.
   */
  getCompanyByXid: async ({
    sessiontoken,
    language,
    xid,
    fallbackMessage
  }: {
    sessiontoken?: string
    language?: Locale
    xid: string
    fallbackMessage: string
  }): Promise<BankHubCompany | null> => {
    const normalizedXid = xid.trim()

    if (!normalizedXid) return null

    const result = await bankHubService.searchCompanies({
      sessiontoken,
      language,
      filter: { search_text: normalizedXid, page: 1, page_size: BANKHUB_COMPANY_DEFAULT_PAGE_SIZE },
      fallbackMessage
    })

    return result.items.find(item => item.xid.toLowerCase() === normalizedXid.toLowerCase()) ?? null
  },

  /** Bank accounts of one company. `filter.page` is the 1-based UI page; the request sends 0-based `page_index`. */
  searchAccounts: async ({
    sessiontoken,
    language,
    companyXid,
    provider,
    filter,
    fallbackMessage
  }: {
    sessiontoken?: string
    language?: Locale
    companyXid: string
    provider?: string | null
    filter: BankHubAccountFilter
    fallbackMessage: string
  }): Promise<BankHubAccountSearchResult> => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const request = toAccountSearchRequest(companyXid, provider, filter)

    if (!request.company_xid) return getEmptyBankHubAccountSearchResult(request.page_size)

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: BANKHUB_ACCOUNT_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, fallbackMessage, BANKHUB_ACCOUNT_SEARCH_WORKFLOW_ID)

    return mapAccountSearchResult(response, request)
  },

  /** Transactions of one company. `filter.page` is the 1-based UI page; the request sends 0-based `page_index`. */
  searchTransactions: async ({
    sessiontoken,
    language,
    companyXid,
    provider,
    filter,
    fallbackMessage
  }: {
    sessiontoken?: string
    language?: Locale
    companyXid: string
    provider?: string | null
    filter: BankHubTransactionFilter
    fallbackMessage: string
  }): Promise<BankHubTransactionSearchResult> => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const request = toTransactionSearchRequest(companyXid, provider, filter)

    if (!request.company_xid) return getEmptyBankHubTransactionSearchResult(request.page_size)

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: BANKHUB_TRANSACTION_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, fallbackMessage, BANKHUB_TRANSACTION_SEARCH_WORKFLOW_ID)

    return mapTransactionSearchResult(response, request)
  },

  /** Creates a single-use link token. Never cache or reuse the result. */
  createLink: async ({
    sessiontoken,
    language,
    fields,
    fallbackMessage
  }: {
    sessiontoken?: string
    language?: Locale
    fields: CreateBankHubLinkRequest
    fallbackMessage: string
  }): Promise<BankHubLinkTokenData> => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: BANKHUB_CREATE_LINK_WORKFLOW_ID,
      input: fields,
      language
    })

    assertWorkflowSuccess(response, fallbackMessage)

    return mapLinkTokenData(response)
  }
}
