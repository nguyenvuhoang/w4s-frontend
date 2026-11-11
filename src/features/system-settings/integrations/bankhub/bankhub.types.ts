/**
 * `fields` of WF_BO_CREATE_BANKHUB_LINK. runFODynamic forwards fields to the backend unchanged,
 * so names must be the backend's snake_case. `provider`/`company_xid` always come from the company
 * being viewed; the backend owns the Bank Hub access token, the frontend never sees it.
 */
export type CreateBankHubLinkRequest = {
  provider: string
  company_xid: string
  purpose: 'LINK_BANK_ACCOUNT'
  bank_account_xid: string | null
  completion_redirect_uri: string
  is_mobile_app: 0 | 1
  language: string
}

/** `data` of the WF_BO_CREATE_BANKHUB_LINK response (snake_case from backend). */
export interface BankHubLinkTokenData {
  xid: string
  hosted_link_url: string
  link_token: string
  expires_at: string
}

/** `fields` of WF_BO_SIMPLE_SEARCH_BANK_HUB_COMPANY. `page_index` is 0-based on the backend. */
export type BankHubCompanySearchRequest = {
  page_index: number
  page_size: number
  search_text: string
}

/** One item of the WF_BO_SIMPLE_SEARCH_BANK_HUB_COMPANY response. */
export interface BankHubCompany {
  provider: string
  xid: string
  full_name: string
  status: string
  is_active: boolean
  /** Optional: only rendered on the detail page when the backend returns it. */
  created_at?: string | null
  configuration?: BankHubCompanyConfiguration | null
}

/** Optional company configuration (SePay Bank Hub company `configuration` naming). */
export interface BankHubCompanyConfiguration {
  payment_code?: string | null
  payment_code_prefix?: string | null
  payment_code_suffix_from?: number | string | null
  payment_code_suffix_to?: number | string | null
  payment_code_suffix_character_type?: string | null
  data_storage_time?: string | null
  transaction_amount?: number | string | null
}

/** `data` of the WF_BO_SIMPLE_SEARCH_BANK_HUB_COMPANY response. */
export interface BankHubCompanySearchResult {
  total_count: number
  total_pages: number
  has_previous_page: boolean
  has_next_page: boolean
  items: BankHubCompany[]
  page_index: number
  page_size: number
}

/** UI filter: `page` is 1-based (Pagination control), mapped to `page_index = page - 1` in the service. */
export type BankHubCompanyFilter = {
  search_text: string
  page: number
  page_size: number
}

/** Serializable error state (server page -> client component) for the company list. */
export type BankHubCompanySearchError = {
  message: string
  executionId?: string
  workflowId?: string
}

/** `fields` of WF_BO_GET_BANKHUB_ACCOUNTS. `page_index` is 0-based; the workflow maps it to SePay's 1-based page. */
export type BankHubAccountSearchRequest = {
  page_index: number
  page_size: number
  search_text: string
  company_xid: string
  bank_id: string
  provider: string
}

/**
 * One item of `data.data` in the WF_BO_GET_BANKHUB_ACCOUNTS response (SePay naming, flags are "0"/"1" strings).
 * `xid` is the bank account XID used as `bank_account_xid` in later transaction requests.
 */
export interface BankHubAccount {
  xid: string
  company_xid: string
  brand_name: string
  bank_bin?: string | null
  bank_code?: string | null
  account_holder_name: string
  account_number: string
  accumulated: string
  account_type: string
  bank_api_connected: string
  active: string
  last_transaction?: string | null
  created_at?: string | null
  updated_at?: string | null
}

/** `data.meta` of the WF_BO_GET_BANKHUB_ACCOUNTS response (`current_page` is SePay's 1-based page). */
export interface BankHubAccountSearchMeta {
  per_page: number
  total: number
  has_more: boolean
  current_page: number
  page_count: number
}

/** Normalised account page: `items` from `data.data`, paging from `data.meta`. */
export interface BankHubAccountSearchResult {
  items: BankHubAccount[]
  total_count: number
  total_pages: number
  has_next_page: boolean
  page_size: number
}

/** UI paging: `page` is 1-based (Pagination control), mapped to `page_index = page - 1` in the service. */
export type BankHubAccountFilter = {
  page: number
  page_size: number
}

/** UI value of the webhook filter: '' = all, '1' = success, '0' = not yet successful (sent as null / 1 / 0). */
export type BankHubTransactionWebhookFilter = '' | '0' | '1'

/** `transfer_type` filter: '' = all. */
export type BankHubTransferTypeFilter = '' | 'credit' | 'debit'

/** `fields` of WF_BO_GET_BANK_HUB_TRANSACTIONS. `page_index` is 0-based on the backend. */
export type BankHubTransactionSearchRequest = {
  page_index: number
  page_size: number
  search_text: string
  company_xid: string
  bank_account_xid: string
  brand_name: string
  transaction_date: string | null
  start_transaction_date: string | null
  end_transaction_date: string | null
  transfer_type: BankHubTransferTypeFilter
  webhook_success: 0 | 1 | null
  provider: string
}

/** One item of `data.data` in the WF_BO_GET_BANK_HUB_TRANSACTIONS response. */
export interface BankHubTransaction {
  transaction_id: string
  transaction_date: string
  bank_account_xid: string
  company_xid: string
  brand_name: string
  account_number: string
  va?: string | null
  va_xid?: string | null
  reference_number: string
  transfer_type: string
  amount: number
  transaction_content?: string | null
  payment_code?: string | null
  webhook_success?: number | null
}

/** `data.meta` of the WF_BO_GET_BANK_HUB_TRANSACTIONS response (`current_page` is 1-based). */
export interface BankHubTransactionMeta {
  per_page: number
  total: number
  has_more: boolean
  current_page: number
  page_count: number
}

/** Normalised transaction page: `items` from `data.data`, paging from `data.meta`. */
export interface BankHubTransactionSearchResult {
  items: BankHubTransaction[]
  total_count: number
  total_pages: number
  has_next_page: boolean
  page_size: number
}

/** UI filter: `page` is 1-based, dates are `YYYY-MM-DD` from the date inputs ('' = no filter). */
export type BankHubTransactionFilter = {
  page: number
  page_size: number
  search_text: string
  bank_account_xid: string
  brand_name: string
  start_transaction_date: string
  end_transaction_date: string
  transfer_type: BankHubTransferTypeFilter
  webhook_success: BankHubTransactionWebhookFilter
}
