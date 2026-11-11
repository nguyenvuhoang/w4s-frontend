import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { createWorkflowError } from '@/shared/utils/workflowError'

import type {
  CreateFeeTypeRequest,
  CreateFeeTypeResponse,
  CreateFeeInvoiceRequest,
  CreateFeeInvoiceResponse,
  DeleteFeeTypeRequest,
  DeleteFeeTypeResponse,
  FeeDetailDetailRequest,
  FeeDetailItem,
  FeeInvoiceFilterModel,
  FeeInvoiceItem,
  FeeInvoiceSearchRequest,
  AdvancedFeeInvoiceSearchRequest,
  FeeInvoiceSearchResponse,
  FeeApartmentGroup,
  FeeApartmentGroupSearchResponse,
  FeePeriodOverview,
  FeeNotificationTemplateOption,
  FeePeriodFilterModel,
  FeePeriodBatchSaveRequest,
  FeePeriodBatchSaveResult,
  FeePeriodGeneratePreviewRequest,
  FeePeriodGeneratePreviewResult,
  FeePeriodPreviewItem,
  FeePeriodMutationResult,
  FeePeriodSaveRequest,
  FeePeriodUpdateRequest,
  FeePeriodItem,
  FeePeriodSearchRequest,
  FeePeriodSearchResponse,
  FeeProjectOption,
  FeeTypeDetailRequest,
  FeeTypeFilterModel,
  UpdateFeeTypeRequest,
  UpdateFeeTypeResponse,
  UpdateFeeInvoiceRequest,
  UpdateFeeInvoiceResponse,
  FeeTypeItem,
  FeeTypeSearchRequest,
  FeeTypeSearchResponse
} from './types'

export const FEE_TYPES_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_FEE_TYPES'
export const FEE_TYPE_DETAIL_WORKFLOW_ID = 'WF_BO_GET_FEE_TYPE_BY_ID'
export const FEE_TYPE_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_FEE_TYPE'
export const FEE_TYPE_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_FEE_TYPE'
export const FEE_TYPE_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_FEE_TYPE'
export const FEE_DETAIL_GET_BY_ID_WORKFLOW_ID = 'WF_BO_GET_FEE_INVOICE'
export const FEE_INVOICES_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_FEE_INVOICES'
export const FEE_INVOICES_ADVANCED_SEARCH_WORKFLOW_ID = 'WF_BO_ADVANCED_SEARCH_FEE_INVOICE'
export const FEE_INVOICES_BY_APARTMENT_SEARCH_WORKFLOW_ID = 'WF_BO_SEARCH_FEE_INVOICES_BY_APARTMENT'
export const FEE_INVOICE_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_FEE_INVOICE'
export const FEE_INVOICE_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_FEE_INVOICE'
export const FEE_INVOICE_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_FEE_INVOICE'
export const FEE_TOGGLE_VISIBILITY_WORKFLOW_ID = 'WF_BO_TOGGLE_FEE_VISIBILITY'
export const FEE_TOGGLE_ACTIVE_STATUS_WORKFLOW_ID = 'WF_BO_TOGGLE_FEE_ACTIVE_STATUS'
export const FEE_SEND_PERIOD_NOTIFICATIONS_WORKFLOW_ID = 'WF_BO_SEND_FEE_PERIOD_NOTIFICATIONS'
export const FEE_COUNTER_SETTLE_WORKFLOW_ID = 'WF_BO_COUNTER_SETTLE_FEE'
export const FEE_NOTIFICATION_TEMPLATES_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_NOTIFICATION_TEMPLATES'
export const FEE_PROJECTS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_PROJECTS'
/** Advanced period search is retained for the System Settings period-management screen. */
export const FEE_PERIODS_SEARCH_WORKFLOW_ID = 'WF_BO_ADVANCED_SEARCH_FEE_PERIOD'
/** Invoice Management uses the contract supplied for this screen. */
export const FEE_INVOICE_PERIODS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_FEE_PERIODS'
export const FEE_PERIOD_DETAIL_WORKFLOW_ID = 'WF_BO_GET_FEE_PERIOD_BY_ID'
export const FEE_PERIOD_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_FEE_PERIOD'
export const FEE_PERIOD_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_FEE_PERIOD'
export const FEE_PERIOD_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_FEE_PERIOD'
export const FEE_PERIOD_GENERATE_YEAR_WORKFLOW_ID = 'WF_BO_GENERATE_QUICK_YEAR_FEE_PERIODS'
export const FEE_PERIOD_BATCH_SAVE_WORKFLOW_ID = 'WF_BO_BATCH_SAVE_FEE_PERIODS'

const emptyFeeTypeResponse: FeeTypeSearchResponse = {
  items: [],
  page_index: 0,
  page_size: 10,
  total_count: 0,
  total_pages: 0
}

const emptyFeeInvoiceResponse: FeeInvoiceSearchResponse = {
  items: [],
  page_index: 0,
  page_size: 10,
  total_count: 0,
  total_pages: 0
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

const toBoolean = (value: any) => (
  value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

const normalizeResponsePage = (value: any, requestPageIndex: number) => {
  const pageIndex = toNumber(value, requestPageIndex + 1)

  return pageIndex <= 0 ? pageIndex + 1 : pageIndex
}

const assertWorkflowSuccess = (response: any, fallback: string, workflowId?: string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const failed = response?.success === false
    || dataresponse?.success === false
    || data?.success === false
    || dataresponse?.code === 'failed'
    || data?.code === 'failed'

  if ((Array.isArray(errors) && errors.length > 0) || failed) {
    throw createWorkflowError(response, { fallback, workflowId })
  }
}

const parseTranslations = (value: unknown) => {
  const source = typeof value === 'string' ? (() => { try { return JSON.parse(value) } catch { return {} } })() : value
  const record = source && typeof source === 'object' ? source as Record<string, unknown> : {}
  return { vi: typeof record.vi === 'string' ? record.vi : '', en: typeof record.en === 'string' ? record.en : '' }
}

const isActiveNotificationTemplate = (item: any) => {
  const isActive = getField(item, ['is_active', 'isActive'])
  if (isActive !== undefined) return toBoolean(isActive)

  const status = String(getField(item, ['status', 'template_status', 'templateStatus']) ?? '').trim().toUpperCase()
  return !status || ['A', 'ACTIVE', '1'].includes(status)
}

const getNotificationTemplateName = (item: any, language?: Locale) => {
  const translations = parseTranslations(getField(item, ['name_translations', 'nameTranslations', 'template_name_translations', 'templateNameTranslations']))
  const localizedName = language === 'vi' ? translations.vi : translations.en

  return localizedName || String(getField(item, ['template_name', 'name', 'template_code']) ?? '')
}

const mapFeeType = (item: any): FeeTypeItem => ({
  id: toNullableNumber(getField(item, ['id', 'fee_type_id', 'feeTypeId'])),
  fee_type_code: String(getField(item, ['fee_type_code', 'feeTypeCode', 'code']) ?? ''),
  name: String(getField(item, ['name', 'fee_type_name', 'feeTypeName']) ?? ''),
  description: getField(item, ['description']) ?? null,
  group_type: String(getField(item, ['group_type', 'groupType']) ?? ''),
  document_code: toNullableText(getField(item, ['document_code', 'documentCode'])),
  name_translations: parseTranslations(getField(item, ['name_translations', 'nameTranslations'])),
  description_translations: parseTranslations(getField(item, ['description_translations', 'descriptionTranslations'])),
  calculation_method: String(getField(item, ['calculation_method', 'calculationMethod']) ?? ''),
  unit: getField(item, ['unit']) ? String(getField(item, ['unit'])) : null,
  default_amount: toNullableNumber(getField(item, ['default_amount', 'defaultAmount'])),
  status: String(getField(item, ['status']) ?? '')
})

export const mapFeeTypesSearchResponse = (
  response: any,
  request: FeeTypeSearchRequest
): FeeTypeSearchResponse => {
  const root = pickDataRoot(response?.payload ?? response)
  const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
  // The workflow has historically echoed MAX_INT even when the caller asked for a normal page.
  // Pagination state must remain the requested UI size; accepting that echo causes MUI's select
  // to receive an out-of-range value and would invite an accidental unbounded follow-up request.
  const page_size = request.page_size
  const total_pages = toNumber(
    getField(root, ['total_pages', 'totalPages']),
    page_size > 0 ? Math.ceil(total_count / page_size) : 0
  )

  return {
    items: pickItems(root).map(mapFeeType),
    page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
    page_size,
    total_count,
    total_pages
  }
}

const toNullableText = (value: any) => (
  value === null || value === undefined || value === '' ? null : String(value)
)

const mapFeePeriod = (item: any): FeePeriodItem => ({
  id: toNullableNumber(getField(item, ['id', 'fee_period_id', 'period_id'])),
  period_code: String(getField(item, ['period_code', 'code', 'fee_period_code']) ?? ''),
  period_name: String(getField(item, ['period_name', 'name', 'fee_period_name']) ?? ''),
  project_id: toNullableNumber(getField(item, ['project_id'])),
  year: toNullableNumber(getField(item, ['year'])),
  month: toNullableNumber(getField(item, ['month'])),
  due_date: toNullableText(getField(item, ['due_date'])),
  status: String(getField(item, ['status']) ?? ''),
  // Returned empty/null by the search and detail workflows today (period_name "", from_date, to_date,
  // description null); mapped but not displayed — the period name is built from month/year.
  from_date: toNullableText(getField(item, ['from_date', 'start_date'])),
  to_date: toNullableText(getField(item, ['to_date', 'end_date'])),
  description: toNullableText(getField(item, ['description']))
})

export const mapFeePeriodDetailResponse = (response: any): FeePeriodItem | null => {
  const root = pickDataRoot(response?.payload ?? response)
  const item = Array.isArray(root?.items) ? root.items[0] : root

  if (!item || typeof item !== 'object') return null

  const period = mapFeePeriod(item)

  return period.id ? period : null
}

const getExecutionId = (response: any): string | null => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse

  return dataresponse?.execution_id ? String(dataresponse.execution_id) : null
}

const mapFeePeriodMutationResponse = (response: any): FeePeriodMutationResult => {
  const root = pickDataRoot(response?.payload ?? response)

  return {
    id: toNullableNumber(getField(root, ['id', 'fee_period_id'])),
    executionId: getExecutionId(response)
  }
}

const mapFeePeriodPreviewItem = (item: any): FeePeriodPreviewItem => ({
  period_code: String(getField(item, ['period_code']) ?? ''),
  period_name: String(getField(item, ['period_name']) ?? ''),
  project_id: toNullableNumber(getField(item, ['project_id'])),
  project_code: toNullableText(getField(item, ['project_code'])),
  project_name: toNullableText(getField(item, ['project_name'])),
  year: toNullableNumber(getField(item, ['year'])),
  month: toNullableNumber(getField(item, ['month'])),
  from_date: toNullableText(getField(item, ['from_date'])),
  to_date: toNullableText(getField(item, ['to_date'])),
  due_date: toNullableText(getField(item, ['due_date'])),
  status: String(getField(item, ['status']) ?? ''),
  description: toNullableText(getField(item, ['description']))
})

/** Preview periods are read from data.periods; nothing is generated on the client. */
export const mapFeePeriodGeneratePreviewResponse = (response: any): FeePeriodGeneratePreviewResult => {
  const root = pickDataRoot(response?.payload ?? response)
  const periods = getField(root, ['periods'])

  return {
    periods: Array.isArray(periods) ? periods.map(mapFeePeriodPreviewItem) : [],
    executionId: getExecutionId(response)
  }
}

export const mapFeePeriodBatchSaveResponse = (response: any): FeePeriodBatchSaveResult => {
  const root = pickDataRoot(response?.payload ?? response)

  return {
    savedCount: toNullableNumber(getField(root, ['saved_count'])),
    executionId: getExecutionId(response)
  }
}

export type FeePeriodGeneratePreviewSetup = {
  applyAllProjects: boolean
  projectId: number | null
  year: number
  fromDayOfMonth: number
  dueDayOfMonth: number
  prefix: string
}

/** Always preview_only: true; project_id only when a single project is targeted. */
export const buildFeePeriodGeneratePreviewInput = (setup: FeePeriodGeneratePreviewSetup): FeePeriodGeneratePreviewRequest => ({
  ...(setup.applyAllProjects || !setup.projectId ? {} : { project_id: setup.projectId }),
  year: setup.year,
  apply_all_projects: setup.applyAllProjects,
  due_day_of_month: setup.dueDayOfMonth,
  from_day_of_month: setup.fromDayOfMonth,
  prefix: setup.prefix.trim(),
  preview_only: true
})

export const mapFeePeriodsSearchResponse = (
  response: any,
  request: FeePeriodSearchRequest
): FeePeriodSearchResponse => {
  const root = pickDataRoot(response?.payload ?? response)
  const total_count = toNumber(getField(root, ['total_count', 'totalCount']), 0)
  const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
  const total_pages = toNumber(
    getField(root, ['total_pages', 'totalPages']),
    page_size > 0 ? Math.ceil(total_count / page_size) : 0
  )

  return {
    items: pickItems(root).map(mapFeePeriod),
    page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
    page_size,
    total_count,
    total_pages
  }
}

const mapNestedFeeType = (value: any): FeeTypeItem | null => {
  if (!value || typeof value !== 'object') return null

  return mapFeeType(value)
}

const mapFeeDetail = (item: any): FeeDetailItem => ({
  id: toNumber(getField(item, ['id']), 0),
  invoice_code: toNullableText(getField(item, ['invoice_code', 'invoiceCode'])),
  project_code: toNullableText(getField(item, ['project_code', 'projectCode'])),
  apartment_id: toNullableNumber(getField(item, ['apartment_id', 'apartmentId', 'unit_id', 'unitId'])),
  apartment_code: toNullableText(getField(item, ['apartment_code', 'apartmentCode', 'full_unit_code', 'fullUnitCode'])),
  fee_type_code: toNullableText(getField(item, ['fee_type_code', 'feeTypeCode'])),
  fee_period_id: toNullableNumber(getField(item, ['fee_period_id', 'feePeriodId'])),
  system_status: toNullableText(getField(item, ['system_status', 'systemStatus'])),
  payment_status: toNullableText(getField(item, ['status', 'payment_status', 'paymentStatus'])),
  paid_amount: toNullableNumber(getField(item, ['paid_amount', 'paidAmount'])),
  module_name: getField(item, ['module_name', 'moduleName']) ? String(getField(item, ['module_name', 'moduleName'])) : null,
  parent_id: toNullableNumber(getField(item, ['parent_id', 'parentId'])),
  package_id: toNullableNumber(getField(item, ['package_id', 'packageId'])),
  project_id: toNullableNumber(getField(item, ['project_id', 'projectId'])),
  unit_id: toNullableNumber(getField(item, ['unit_id', 'unitId'])),
  fee_pay_status_id: toNullableNumber(getField(item, ['fee_pay_status_id', 'feePayStatusId'])),
  full_unit_code: toNullableText(getField(item, ['full_unit_code', 'fullUnitCode', 'apartment_code', 'apartmentCode'])),
  customer_name: getField(item, ['customer_name', 'customerName']) ? String(getField(item, ['customer_name', 'customerName'])) : null,
  fee_type_id: toNullableNumber(getField(item, ['fee_type_id', 'feeTypeId'])),
  fee_type: mapNestedFeeType(getField(item, ['fee_type', 'feeType'])),
  total_amount: toNullableNumber(getField(item, ['total_amount', 'totalAmount', 'amount'])),
  debit_amount: toNullableNumber(getField(item, ['debit_amount', 'debitAmount', 'remaining_amount', 'remainingAmount', 'outstanding_amount', 'outstandingAmount'])) ?? (() => { const amount = toNullableNumber(getField(item, ['amount', 'total_amount', 'totalAmount'])); const paid = toNullableNumber(getField(item, ['paid_amount', 'paidAmount'])); return amount === null ? null : amount - (paid ?? 0) })(),
  bill_number: toNullableText(getField(item, ['invoice_code', 'invoiceCode'])),
  due_date: getField(item, ['due_date', 'dueDate']) ? String(getField(item, ['due_date', 'dueDate'])) : null,
  description: getField(item, ['description']) ? String(getField(item, ['description'])) : null,
  inform_date: getField(item, ['inform_date', 'informDate']) ? String(getField(item, ['inform_date', 'informDate'])) : null,
  from_date: getField(item, ['from_date', 'fromDate']) ? String(getField(item, ['from_date', 'fromDate'])) : null,
  to_date: getField(item, ['to_date', 'toDate']) ? String(getField(item, ['to_date', 'toDate'])) : null,
  is_show_to_resident: getField(item, ['is_show_to_resident', 'isShowToResident']) === undefined ? null : toBoolean(getField(item, ['is_show_to_resident', 'isShowToResident'])),
  is_active: getField(item, ['is_active', 'isActive']) === undefined ? null : toBoolean(getField(item, ['is_active', 'isActive'])),
  creation_time: getField(item, ['creation_time', 'creationTime']) ? String(getField(item, ['creation_time', 'creationTime'])) : null,
  ref_id: toNullableNumber(getField(item, ['ref_id', 'refId'])),
  from_index: toNullableNumber(getField(item, ['from_index', 'fromIndex'])),
  to_index: toNullableNumber(getField(item, ['to_index', 'toIndex'])),
  total_used: toNullableNumber(getField(item, ['total_used', 'totalUsed'])),
  fee_generate_id: toNullableNumber(getField(item, ['fee_generate_id', 'feeGenerateId']))
})

export const mapFeeDetailDetailResponse = (response: any): FeeDetailItem | null => {
  const root = pickDataRoot(response?.payload ?? response)
  const invoice = root && typeof root === 'object' ? getField(root, ['invoice']) : null
  const source = invoice && typeof invoice === 'object' ? invoice : root

  if (!source || typeof source !== 'object') return null
  return mapFeeDetail(source)
}

const mapFeeInvoice = (item: any): FeeInvoiceItem => {
  const amount = toNullableNumber(getField(item, ['amount']))
  const paid_amount = toNullableNumber(getField(item, ['paid_amount', 'paidAmount']))
  const remaining_amount = toNullableNumber(getField(item, ['remaining_amount', 'remainingAmount', 'outstanding_amount', 'outstandingAmount', 'debit_amount', 'debitAmount']))
  const api_remaining_amount = toNullableNumber(getField(item, ['remaining_amount', 'remainingAmount']))

  return {
    id: toNullableNumber(getField(item, ['id'])),
    project_id: toNullableNumber(getField(item, ['project_id', 'projectId'])),
    invoice_code: toNullableText(getField(item, ['invoice_code', 'invoiceCode'])),
    apartment_code: getField(item, ['apartment_code', 'apartmentCode']) ? String(getField(item, ['apartment_code', 'apartmentCode'])) : null,
    customer_name: getField(item, ['customer_name', 'customerName']) ? String(getField(item, ['customer_name', 'customerName'])) : null,
    fee_type_code: getField(item, ['fee_type_code', 'feeTypeCode']) ? String(getField(item, ['fee_type_code', 'feeTypeCode'])) : null,
    amount,
    paid_amount,
    remaining_amount: remaining_amount ?? (amount !== null ? amount - (paid_amount ?? 0) : null),
    api_remaining_amount,
    notified_on_utc: getField(item, ['notified_on_utc', 'notifiedOnUtc']) ? String(getField(item, ['notified_on_utc', 'notifiedOnUtc'])) : null,
    from_date: getField(item, ['from_date', 'fromDate']) ? String(getField(item, ['from_date', 'fromDate'])) : null,
    to_date: getField(item, ['to_date', 'toDate']) ? String(getField(item, ['to_date', 'toDate'])) : null,
    status: getField(item, ['status']) ? String(getField(item, ['status'])) : null,
    document_date: getField(item, ['document_date', 'documentDate']) ? String(getField(item, ['document_date', 'documentDate'])) : null,
    posting_date: getField(item, ['posting_date', 'postingDate']) ? String(getField(item, ['posting_date', 'postingDate'])) : null,
    fee_period_id: toNullableNumber(getField(item, ['fee_period_id', 'feePeriodId', 'period_id'])),
    fee_period_name: toNullableText(getField(item, ['fee_period_name', 'feePeriodName', 'period_name'])),
    apartment_id: toNullableNumber(getField(item, ['apartment_id', 'apartmentId', 'unit_id'])),
    is_show_to_resident: getField(item, ['is_show_to_resident', 'isShowToResident']) === undefined ? null : toBoolean(getField(item, ['is_show_to_resident', 'isShowToResident'])),
    is_active: getField(item, ['is_active', 'isActive']) === undefined ? null : toBoolean(getField(item, ['is_active', 'isActive']))
  }
}

const mapOverview = (payload: any): FeePeriodOverview => {
  const root = pickDataRoot(payload)
  return {
    total_amount: toNullableNumber(getField(root, ['total_amount', 'totalAmount'])),
    paid_amount: toNullableNumber(getField(root, ['paid_amount', 'paidAmount'])),
    remaining_amount: toNullableNumber(getField(root, ['remaining_amount', 'remainingAmount'])),
    total_surplus_amount: toNullableNumber(getField(root, ['total_surplus_amount', 'totalSurplusAmount'])),
    paid_apartments: toNullableNumber(getField(root, ['paid_apartments', 'paidApartments'])),
    total_apartments: toNullableNumber(getField(root, ['total_apartments', 'totalApartments']))
  }
}

const getOverviewBaseUrl = () => (process.env.NEXT_PUBLIC_REST_API_ENDPOINT ?? '').replace(/\/?api\/v1\/gateway\/?$/i, '')

export const mapFeeInvoiceSearchResponse = (
  response: any,
  request: Pick<FeeInvoiceSearchRequest, 'page_index' | 'page_size'>
): FeeInvoiceSearchResponse => {
  const root = pickDataRoot(response?.payload ?? response)
  const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
  const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)

  // Backend currently returns total_pages: 0 regardless of total_count, so it can't be trusted —
  // always derive it from total_count/page_size instead.
  const total_pages = page_size > 0 ? Math.ceil(total_count / page_size) : 0

  return {
    items: pickItems(root).map(mapFeeInvoice),
    page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
    page_size,
    total_count,
    total_pages
  }
}

const mapFeeApartmentGroup = (item: any): FeeApartmentGroup => {
  const invoicesValue = getField(item, ['invoices'])
  const detailsValue = getField(item, ['details'])
  const children = Array.isArray(invoicesValue) ? invoicesValue : Array.isArray(detailsValue) ? detailsValue : []
  const apartmentId = toNullableNumber(getField(item, ['apartment_id', 'apartmentId']))
  const projectId = toNullableNumber(getField(item, ['project_id', 'projectId']))
  const invoices = children.map(mapFeeInvoice).map(invoice => ({ ...invoice, apartment_id: invoice.apartment_id ?? apartmentId, project_id: invoice.project_id ?? projectId }))

  return {
    apartment_id: apartmentId,
    apartment_code: toNullableText(getField(item, ['apartment_code', 'apartmentCode'])),
    customer_name: toNullableText(getField(item, ['customer_name', 'customerName'])) ?? invoices.find(invoice => invoice.customer_name)?.customer_name ?? null,
    project_id: projectId,
    project_code: toNullableText(getField(item, ['project_code', 'projectCode'])),
    invoice_count: toNullableNumber(getField(item, ['invoice_count', 'invoiceCount'])),
    total_amount: toNullableNumber(getField(item, ['total_amount', 'totalAmount'])),
    total_paid_amount: toNullableNumber(getField(item, ['total_paid_amount', 'totalPaidAmount', 'paid_amount', 'paidAmount'])),
    remaining_amount: toNullableNumber(getField(item, ['remaining_amount', 'remainingAmount', 'outstanding_amount', 'outstandingAmount'])),
    invoices
  }
}

export const mapFeeApartmentGroupSearchResponse = (response: any, request: Pick<FeeInvoiceFilterModel, 'page_index' | 'page_size'>): FeeApartmentGroupSearchResponse => {
  const root = pickDataRoot(response?.payload ?? response)
  const total_count = toNumber(getField(root, ['total_count', 'totalCount']), 0)
  const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
  const returnedTotalPages = toNumber(getField(root, ['total_pages', 'totalPages']), 0)

  return {
    items: pickItems(root).map(mapFeeApartmentGroup),
    page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), Math.max(request.page_index - 1, 0)),
    page_size,
    total_count,
    total_pages: returnedTotalPages > 0 ? returnedTotalPages : page_size > 0 ? Math.ceil(total_count / page_size) : 0,
    total_amount: toNullableNumber(getField(root, ['total_amount', 'totalAmount'])),
    total_paid_amount: toNullableNumber(getField(root, ['total_paid_amount', 'totalPaidAmount', 'paid_amount', 'paidAmount'])),
    remaining_amount: toNullableNumber(getField(root, ['remaining_amount', 'remainingAmount', 'outstanding_amount', 'outstandingAmount'])),
    total_invoice_count: toNullableNumber(getField(root, ['total_invoice_count', 'totalInvoiceCount']))
  }
}

const mapFeeProjectOption = (item: any): FeeProjectOption | null => {
  const id = toNullableNumber(getField(item, ['id', 'project_id', 'projectId', 'projectid']))

  if (id === null) return null

  const code = String(getField(item, ['project_code', 'projectCode', 'projectcode', 'code']) ?? '').trim()
  const name = String(getField(item, ['project_name', 'projectName', 'projectname', 'name', 'caption']) ?? (code || id)).trim()

  return { id, code, name }
}

export const mapFeeProjectOptions = (response: any): FeeProjectOption[] => {
  const root = pickDataRoot(response?.payload ?? response)
  const byId = new Map<number, FeeProjectOption>()

  pickItems(root).forEach(item => {
    const option = mapFeeProjectOption(item)

    if (option) byId.set(option.id, option)
  })

  return Array.from(byId.values())
}

export const mapFeeTypeDetailResponse = (response: any): FeeTypeItem | null => {
  const root = pickDataRoot(response?.payload ?? response)

  if (!root || typeof root !== 'object') return null

  return mapFeeType(root)
}

export const mapUpdateFeeTypeResponse = (response: any): UpdateFeeTypeResponse => {
  const root = pickDataRoot(response?.payload ?? response)

  return {
    id: toNullableNumber(getField(root, ['id'])),
    status: String(getField(root, ['status']) ?? '')
  }
}

export const mapDeleteFeeTypeResponse = (response: any): DeleteFeeTypeResponse => {
  const root = pickDataRoot(response?.payload ?? response)

  return {
    id: toNullableNumber(getField(root, ['id'])),
    status: String(getField(root, ['status']) ?? '')
  }
}

export const mapCreateFeeTypeResponse = (response: any): CreateFeeTypeResponse => {
  const root = pickDataRoot(response?.payload ?? response)

  return {
    id: toNullableNumber(getField(root, ['id'])),
    status: String(getField(root, ['status']) ?? '')
  }
}

export const feeService = {
  getDefaultFeeTypeResponse: (filter?: Partial<FeeTypeFilterModel>): FeeTypeSearchResponse => ({
    ...emptyFeeTypeResponse,
    page_index: filter?.page_index ?? emptyFeeTypeResponse.page_index,
    page_size: filter?.page_size ?? emptyFeeTypeResponse.page_size
  }),

  getDefaultFeeInvoiceResponse: (filter?: Partial<FeeInvoiceFilterModel>): FeeInvoiceSearchResponse => ({
    ...emptyFeeInvoiceResponse,
    page_index: filter?.page_index ?? emptyFeeInvoiceResponse.page_index,
    page_size: filter?.page_size ?? emptyFeeInvoiceResponse.page_size
  }),

  simpleSearchFeeInvoices: async ({
    sessiontoken,
    language,
    filter,
    scope
  }: {
    sessiontoken?: string
    language?: Locale
    filter: FeeInvoiceFilterModel
    scope?: string
  }): Promise<FeeInvoiceSearchResponse> => {
    if (!sessiontoken) return feeService.getDefaultFeeInvoiceResponse(filter)

    const request: FeeInvoiceSearchRequest = {
      page_size: filter.page_size,
      page_index: Math.max(filter.page_index - 1, 0),
      search_text: filter.search_text.trim(),
      project_id: filter.project_id
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_INVOICES_SEARCH_WORKFLOW_ID,
      input: request,
      language,
      scope
    })

    assertWorkflowSuccess(response, 'Unable to load fee invoices.', FEE_INVOICES_SEARCH_WORKFLOW_ID)

    return mapFeeInvoiceSearchResponse(response, request)
  },

  advancedSearchFeeInvoices: async ({
    sessiontoken,
    language,
    filter,
    scope
  }: {
    sessiontoken?: string
    language?: Locale
    filter: FeeInvoiceFilterModel
    scope?: string
  }): Promise<FeeInvoiceSearchResponse> => {
    if (!sessiontoken) return feeService.getDefaultFeeInvoiceResponse(filter)

    const request: AdvancedFeeInvoiceSearchRequest = {
      project_id: filter.project_id,
      fee_period_id: filter.fee_period_id,
      fee_type_id: filter.fee_type_id,
      apartment_id: null,
      status: filter.status.trim() || null,
      page_index: Math.max(filter.page_index - 1, 0),
      page_size: filter.page_size
    }
    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_INVOICES_ADVANCED_SEARCH_WORKFLOW_ID,
      input: request,
      language,
      scope
    })

    assertWorkflowSuccess(response, 'Unable to load fee invoices.', FEE_INVOICES_ADVANCED_SEARCH_WORKFLOW_ID)
    return mapFeeInvoiceSearchResponse(response, request)
  },

  searchFeeInvoicesByApartment: async ({ sessiontoken, language, filter, scope }: { sessiontoken?: string; language?: Locale; filter: FeeInvoiceFilterModel; scope?: string }): Promise<FeeApartmentGroupSearchResponse> => {
    if (!sessiontoken) return { items: [], page_index: filter.page_index, page_size: filter.page_size, total_count: 0, total_pages: 0, total_amount: null, total_paid_amount: null, remaining_amount: null, total_invoice_count: null }
    if (!scope) throw new Error('Project scope is required.')
    const request = {
      project_id: filter.project_id,
      fee_period_id: filter.fee_period_id,
      fee_type_id: filter.fee_type_id,
      fee_import_id: null,
      apartment_code: null,
      status: filter.status.trim() || null,
      system_status: null,
      search_text: filter.search_text.trim() || null,
      page_index: Math.max(filter.page_index - 1, 0),
      page_size: filter.page_size
    }
    const response = await workflowService.runFODynamic({ sessiontoken, workflowid: FEE_INVOICES_BY_APARTMENT_SEARCH_WORKFLOW_ID, input: request, language, scope })
    assertWorkflowSuccess(response, 'Unable to load fee invoices by apartment.', FEE_INVOICES_BY_APARTMENT_SEARCH_WORKFLOW_ID)
    return mapFeeApartmentGroupSearchResponse(response, filter)
  },

  createFeeInvoice: async ({ sessiontoken, language, scope, fields }: { sessiontoken?: string; language?: Locale; scope?: string; fields: CreateFeeInvoiceRequest }): Promise<CreateFeeInvoiceResponse> => {
    if (!sessiontoken) throw new Error('Session is required.')
    const response = await workflowService.runFODynamic({ sessiontoken, workflowid: FEE_INVOICE_CREATE_WORKFLOW_ID, input: fields, language, scope })
    assertWorkflowSuccess(response, 'Unable to create fee invoice.', FEE_INVOICE_CREATE_WORKFLOW_ID)
    const root = pickDataRoot(response?.payload ?? response)
    return { id: toNullableNumber(getField(root, ['id', 'fee_invoice_id', 'feeInvoiceId'])), invoice_code: toNullableText(getField(root, ['invoice_code', 'invoiceCode'])) }
  },

  updateFeeInvoice: async ({ sessiontoken, language, scope, fields }: { sessiontoken?: string; language?: Locale; scope: string; fields: UpdateFeeInvoiceRequest }): Promise<UpdateFeeInvoiceResponse> => {
    if (!sessiontoken) throw new Error('Session is required.')
    if (!scope) throw new Error('Project scope is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_INVOICE_UPDATE_WORKFLOW_ID,
      input: fields,
      language,
      scope
    })

    assertWorkflowSuccess(response, 'Unable to update fee invoice.', FEE_INVOICE_UPDATE_WORKFLOW_ID)
    const root = pickDataRoot(response?.payload ?? response)
    return { id: toNullableNumber(getField(root, ['id', 'fee_invoice_id', 'feeInvoiceId'])) }
  },

  deleteFeeInvoice: async ({ sessiontoken, language, scope, id }: { sessiontoken?: string; language?: Locale; scope: string; id: number }) => {
    if (!sessiontoken) throw new Error('Session is required.')
    if (!scope) throw new Error('Project scope is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_INVOICE_DELETE_WORKFLOW_ID,
      input: { id },
      language,
      scope
    })

    assertWorkflowSuccess(response, 'Unable to delete fee invoice.', FEE_INVOICE_DELETE_WORKFLOW_ID)
  },

  getFeePeriodOverview: async ({ projectId, periodId, language }: { projectId: number; periodId: number; language?: Locale }): Promise<FeePeriodOverview> => {
    const response = await fetch('/api/fees/period-overview', {
      method: 'POST',
      headers: { 'content-type': 'application/json', lang: language ?? 'vi' },
      body: JSON.stringify({ project_id: projectId, period_id: periodId })
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || payload?.success === false || payload?.status === 'ERROR') {
      throw createWorkflowError(payload ?? { message: 'Unable to load fee period overview.' }, { fallback: 'Unable to load fee period overview.' })
    }
    return mapOverview(payload)
  },

  getFeePeriodOverviewServer: async ({ sessiontoken, projectId, periodId, language }: { sessiontoken: string; projectId: number; periodId: number; language?: Locale }): Promise<FeePeriodOverview> => {
    const response = await fetch(`${getOverviewBaseUrl()}/ips/api/fee-invoices/period-overview`, { method: 'POST', headers: { 'content-type': 'application/json', uid: sessiontoken, lang: language ?? 'vi', app: process.env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO', 'X-TimeZone': 'Asia/Ho_Chi_Minh' }, body: JSON.stringify({ project_id: projectId, period_id: periodId }), cache: 'no-store' })
    const payload = await response.json().catch(() => null)
    if (!response.ok || payload?.success === false || payload?.status === 'ERROR') throw createWorkflowError(payload ?? { message: 'Unable to load fee period overview.' }, { fallback: 'Unable to load fee period overview.' })
    return mapOverview(payload)
  },

  toggleFeeVisibility: async ({ sessiontoken, language, scope, invoiceIds, feePeriodId, isShowToResident }: { sessiontoken?: string; language?: Locale; scope?: string; invoiceIds: number[]; feePeriodId: number; isShowToResident: boolean }) => {
    if (!sessiontoken) throw new Error('Session is required.')
    if (!scope) throw new Error('Project scope is required.')
    const response = await workflowService.runFODynamic({ sessiontoken, workflowid: FEE_TOGGLE_VISIBILITY_WORKFLOW_ID, input: { invoice_ids: invoiceIds, fee_period_id: feePeriodId, is_show_to_resident: isShowToResident }, language, scope })
    assertWorkflowSuccess(response, 'Unable to update fee visibility.', FEE_TOGGLE_VISIBILITY_WORKFLOW_ID)
  },

  toggleFeeActiveStatus: async ({ sessiontoken, language, scope, invoiceIds, isActive }: { sessiontoken?: string; language?: Locale; scope?: string; invoiceIds: number[]; isActive: boolean }) => {
    if (!sessiontoken) throw new Error('Session is required.')
    if (!scope) throw new Error('Project scope is required.')
    const response = await workflowService.runFODynamic({ sessiontoken, workflowid: FEE_TOGGLE_ACTIVE_STATUS_WORKFLOW_ID, input: { invoice_ids: invoiceIds, is_active: isActive }, language, scope })
    assertWorkflowSuccess(response, 'Unable to update fee active status.', FEE_TOGGLE_ACTIVE_STATUS_WORKFLOW_ID)
  },

  sendFeePeriodNotifications: async ({ sessiontoken, language, scope, fields }: { sessiontoken?: string; language?: Locale; scope?: string; fields: { project_id: number; fee_period_id: number; building_id: number | null; title: string; notification_template_id: number; exclude_zero_amount: boolean; exclude_paid: boolean; set_show_to_resident: boolean } }) => {
    if (!sessiontoken) throw new Error('Session is required.')
    if (!scope) throw new Error('Project scope is required.')
    const response = await workflowService.runFODynamic({ sessiontoken, workflowid: FEE_SEND_PERIOD_NOTIFICATIONS_WORKFLOW_ID, input: { ...fields, apartment_ids: null }, language, scope })
    assertWorkflowSuccess(response, 'Unable to send fee notifications.', FEE_SEND_PERIOD_NOTIFICATIONS_WORKFLOW_ID)
  },

  counterSettleFee: async ({ sessiontoken, language, fields }: { sessiontoken?: string; language?: Locale; fields: { project_id: number; apartment_id: number; fee_period_id: number; invoice_ids: number[]; paid_amount: number; payment_method: string; transaction_ref: string; notes: string } }) => {
    if (!sessiontoken) throw new Error('Session is required.')
    const response = await workflowService.runFODynamic({ sessiontoken, workflowid: FEE_COUNTER_SETTLE_WORKFLOW_ID, input: fields, language })
    assertWorkflowSuccess(response, 'Unable to settle fee invoices.', FEE_COUNTER_SETTLE_WORKFLOW_ID)
  },

  searchFeeNotificationTemplates: async ({ sessiontoken, language, scope }: { sessiontoken?: string; language?: Locale; scope?: string }): Promise<FeeNotificationTemplateOption[]> => {
    if (!sessiontoken) throw new Error('Session is required.')
    if (!scope) throw new Error('Project scope is required.')
    const response = await workflowService.runFODynamic({ sessiontoken, workflowid: FEE_NOTIFICATION_TEMPLATES_SEARCH_WORKFLOW_ID, input: { page_index: 0, page_size: 100, search_text: '', template_group: 'FEE' }, language, scope })
    assertWorkflowSuccess(response, 'Unable to load notification templates.', FEE_NOTIFICATION_TEMPLATES_SEARCH_WORKFLOW_ID)
    return pickItems(pickDataRoot(response?.payload ?? response))
      .filter(isActiveNotificationTemplate)
      .map(item => ({ id: toNullableNumber(getField(item, ['id', 'template_id'])) ?? 0, name: getNotificationTemplateName(item, language) }))
      .filter(item => item.id > 0 && item.name.trim().length > 0)
  },

  getFeeDetailById: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<FeeDetailItem | null> => {
    if (!sessiontoken || !Number.isInteger(id) || id <= 0) return null

    const request: FeeDetailDetailRequest = { id }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_DETAIL_GET_BY_ID_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load fee detail.', FEE_DETAIL_GET_BY_ID_WORKFLOW_ID)

    const mapped = mapFeeDetailDetailResponse(response)

    if (!mapped) return null

    return mapped.id ? mapped : { ...mapped, id }
  },

  getDefaultFeePeriodResponse: (filter?: Partial<FeePeriodFilterModel>): FeePeriodSearchResponse => ({
    items: [],
    page_index: filter?.page_index ?? 1,
    page_size: filter?.page_size ?? 10,
    total_count: 0,
    total_pages: 0
  }),

  /** Fee period list (FEE_PERIODS_SEARCH_WORKFLOW_ID). UI page_index is one-based; the workflow expects zero-based. */
  searchFeePeriods: async ({
    sessiontoken,
    language,
    filter,
    scope,
    workflowId = FEE_PERIODS_SEARCH_WORKFLOW_ID
  }: {
    sessiontoken?: string
    language?: Locale
    filter: FeePeriodFilterModel
    scope?: string
    workflowId?: string
  }): Promise<FeePeriodSearchResponse> => {
    if (!sessiontoken) return feeService.getDefaultFeePeriodResponse(filter)

    // Optional filters are omitted (not sent as 0/null/'') when they mean "all".
    const request: FeePeriodSearchRequest = {
      page_size: filter.page_size,
      page_index: Math.max(filter.page_index - 1, 0),
      search_text: filter.search_text.trim(),
      ...(filter.project_id ? { project_id: filter.project_id } : {}),
      ...(filter.year ? { year: filter.year } : {}),
      ...(filter.month ? { month: filter.month } : {}),
      ...(filter.status ? { status: filter.status } : {})
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: workflowId,
      input: request,
      language,
      scope
    })

    assertWorkflowSuccess(response, 'Unable to load fee periods.', workflowId)

    return mapFeePeriodsSearchResponse(response, request)
  },

  getFeePeriodById: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<FeePeriodItem | null> => {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_PERIOD_DETAIL_WORKFLOW_ID,
      input: { id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load fee period.', FEE_PERIOD_DETAIL_WORKFLOW_ID)

    return mapFeePeriodDetailResponse(response)
  },

  createFeePeriod: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: FeePeriodSaveRequest
  }): Promise<FeePeriodMutationResult> => {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_PERIOD_CREATE_WORKFLOW_ID,
      input: fields,
      language
    })

    assertWorkflowSuccess(response, 'Unable to create fee period.', FEE_PERIOD_CREATE_WORKFLOW_ID)

    return mapFeePeriodMutationResponse(response)
  },

  updateFeePeriod: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: FeePeriodUpdateRequest
  }): Promise<FeePeriodMutationResult> => {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_PERIOD_UPDATE_WORKFLOW_ID,
      input: fields,
      language
    })

    assertWorkflowSuccess(response, 'Unable to update fee period.', FEE_PERIOD_UPDATE_WORKFLOW_ID)

    return mapFeePeriodMutationResponse(response)
  },

  deleteFeePeriod: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<FeePeriodMutationResult> => {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_PERIOD_DELETE_WORKFLOW_ID,
      input: { id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to delete fee period.', FEE_PERIOD_DELETE_WORKFLOW_ID)

    return mapFeePeriodMutationResponse(response)
  },

  /** Preview of the 12 periods of a year (preview_only: true, nothing is written). */
  generateFeePeriodPreview: async ({
    sessiontoken,
    language,
    setup
  }: {
    sessiontoken?: string
    language?: Locale
    setup: FeePeriodGeneratePreviewSetup
  }): Promise<FeePeriodGeneratePreviewResult> => {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_PERIOD_GENERATE_YEAR_WORKFLOW_ID,
      input: buildFeePeriodGeneratePreviewInput(setup),
      language
    })

    assertWorkflowSuccess(response, 'Unable to generate fee periods.', FEE_PERIOD_GENERATE_YEAR_WORKFLOW_ID)

    return mapFeePeriodGeneratePreviewResponse(response)
  },

  /** Upsert of the edited preview periods in one call. */
  batchSaveFeePeriods: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: FeePeriodBatchSaveRequest
  }): Promise<FeePeriodBatchSaveResult> => {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_PERIOD_BATCH_SAVE_WORKFLOW_ID,
      input: fields,
      language
    })

    assertWorkflowSuccess(response, 'Unable to save fee periods.', FEE_PERIOD_BATCH_SAVE_WORKFLOW_ID)

    return mapFeePeriodBatchSaveResponse(response)
  },

  simpleSearchProjects: async ({
    sessiontoken,
    language,
    search_text = '',
    page_size = 100
  }: {
    sessiontoken?: string
    language?: Locale
    search_text?: string
    page_size?: number
  }): Promise<FeeProjectOption[]> => {
    if (!sessiontoken) return []

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_PROJECTS_SEARCH_WORKFLOW_ID,
      input: {
        search_text,
        page_index: 0,
        page_size
      },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load projects.', FEE_PROJECTS_SEARCH_WORKFLOW_ID)

    return mapFeeProjectOptions(response)
  },

  simpleSearchFeeTypes: async ({
    sessiontoken,
    language,
    filter
  }: {
    sessiontoken?: string
    language?: Locale
    filter: FeeTypeFilterModel
  }): Promise<FeeTypeSearchResponse> => {
    if (!sessiontoken) return feeService.getDefaultFeeTypeResponse(filter)

    const request: FeeTypeSearchRequest = {
      page_size: filter.page_size,
      page_index: Math.max(filter.page_index - 1, 0),
      search_text: filter.search_text.trim()
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_TYPES_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load fee types.', FEE_TYPES_SEARCH_WORKFLOW_ID)

    return mapFeeTypesSearchResponse(response, request)
  },

  getFeeTypeById: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<FeeTypeItem | null> => {
    if (!sessiontoken || !Number.isInteger(id) || id <= 0) return null

    const request: FeeTypeDetailRequest = { id }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_TYPE_DETAIL_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load fee type detail.', FEE_TYPE_DETAIL_WORKFLOW_ID)

    return mapFeeTypeDetailResponse(response)
  },

  updateFeeType: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: UpdateFeeTypeRequest
  }): Promise<UpdateFeeTypeResponse> => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_TYPE_UPDATE_WORKFLOW_ID,
      input: fields,
      language
    })

    assertWorkflowSuccess(response, 'Unable to update fee type.', FEE_TYPE_UPDATE_WORKFLOW_ID)

    return mapUpdateFeeTypeResponse(response)
  },

  createFeeType: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: CreateFeeTypeRequest
  }): Promise<CreateFeeTypeResponse> => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_TYPE_CREATE_WORKFLOW_ID,
      input: fields,
      language
    })

    assertWorkflowSuccess(response, 'Unable to create fee type.', FEE_TYPE_CREATE_WORKFLOW_ID)

    return mapCreateFeeTypeResponse(response)
  },

  deleteFeeType: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: DeleteFeeTypeRequest
  }): Promise<DeleteFeeTypeResponse> => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FEE_TYPE_DELETE_WORKFLOW_ID,
      input: fields,
      language
    })

    assertWorkflowSuccess(response, 'Unable to delete fee type.', FEE_TYPE_DELETE_WORKFLOW_ID)

    return mapDeleteFeeTypeResponse(response)
  }
}
