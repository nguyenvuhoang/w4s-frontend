/**
 * Workflow wrapping CreateBankHubLinkTokenCommand on the PMT backend. The backend owns the SePay
 * access token and calls SePay `POST /v1/link-token/create`; the frontend never talks to SePay APIs.
 */
export const BANKHUB_CREATE_LINK_WORKFLOW_ID = 'WF_BO_CREATE_BANKHUB_LINK'

export const BANKHUB_PURPOSE_LINK_BANK_ACCOUNT = 'LINK_BANK_ACCOUNT'

export const BANKHUB_COMPANIES_SEGMENT = 'system-settings/integrations/bank-hub-companies'

export const buildBankHubCompaniesPath = (locale: string) => `/${locale}/${BANKHUB_COMPANIES_SEGMENT}`

export const buildBankHubCompanyDetailPath = (locale: string, xid: string) => (
  `${buildBankHubCompaniesPath(locale)}/${encodeURIComponent(xid)}`
)

/** Paged search of companies registered/linked on Bank Hub. */
export const BANKHUB_COMPANY_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_BANK_HUB_COMPANY'

export const BANKHUB_COMPANY_DEFAULT_PAGE_SIZE = 10

/** Paged list of bank accounts linked to a Bank Hub company. `page_index` is 0-based on the backend. */
export const BANKHUB_ACCOUNT_SEARCH_WORKFLOW_ID = 'WF_BO_GET_BANKHUB_ACCOUNTS'

export const BANKHUB_ACCOUNT_DEFAULT_PAGE_SIZE = 10

/** Used when the company being viewed has no provider value. */
export const BANKHUB_DEFAULT_PROVIDER = 'SEPAY'

/** Paged list of Bank Hub transactions of a company. `page_index` is 0-based on the backend. */
export const BANKHUB_TRANSACTION_SEARCH_WORKFLOW_ID = 'WF_BO_GET_BANK_HUB_TRANSACTIONS'

export const BANKHUB_TRANSACTION_DEFAULT_PAGE_SIZE = 10

export const BANKHUB_TRANSACTION_SEARCH_DEBOUNCE_MS = 400
