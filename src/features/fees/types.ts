import type { Locale } from '@/configs/i18n'
import type { WorkflowErrorDetail } from '@/shared/utils/workflowError'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type FeeDictionary = Awaited<ReturnType<typeof getDictionary>>

export type FeePageProps = {
  dictionary: FeeDictionary
  session: Session | null
  locale: Locale
}

export type FeeWorkflowError = WorkflowErrorDetail

export type FeeTypeStatus = 'A' | 'I' | 'B' | 'D' | 'DRAFT' | string

export type FeeTypeCalculationMethod = 'FIXED' | 'BY_METER' | 'BY_AREA' | string

export type FeeTypeTranslations = { vi: string; en: string }

export type FeeTypeItem = {
  id: number | null
  fee_type_code: string
  name: string
  description: string | null
  group_type: string
  document_code: string | null
  name_translations: FeeTypeTranslations
  description_translations: FeeTypeTranslations
  calculation_method: FeeTypeCalculationMethod
  unit: string | null
  default_amount: number | null
  status: FeeTypeStatus
}

export type FeeTypeFilterModel = {
  search_text: string
  page_index: number
  page_size: number
}

export type FeeTypeSearchRequest = {
  search_text: string
  page_index: number
  page_size: number
}

export type FeeTypeSearchResponse = {
  items: FeeTypeItem[]
  page_index: number
  page_size: number
  total_count: number
  total_pages: number
}

export type FeeTypeDetailRequest = {
  id: number
}

export type CreateFeeTypeRequest = {
  project_id: null
  fee_type_code: string
  name: string
  group_type: string
  document_code: string
  name_translations: string
  description_translations: string
  unit: string
  default_amount: number | string
  calculation_method: string
  description: string
}

export type UpdateFeeTypeRequest = {
  calculation_method: string
  name: string
  group_type: string
  document_code: string
  name_translations: string
  description_translations: string
  default_amount: number | string
  status: string
  id: number
  fee_type_code: string
  description: string
  unit: string
}

export type UpdateFeeTypeResponse = {
  id: number | null
  status: string
}

export type DeleteFeeTypeRequest = {
  id: number
}

export type DeleteFeeTypeResponse = {
  id: number | null
  status: string
}

export type CreateFeeTypeResponse = {
  id: number | null
  status: string
}

export type FeeTypeFormValues = {
  fee_type_code: string
  name: string
  name_en: string
  description: string
  description_en: string
  group_type: string
  document_code: string
  calculation_method: string
  unit: string
  default_amount: string
  status: string
}

export type FeeProjectOption = {
  id: number
  code: string
  name: string
}

export type FeeDetailItem = {
  id: number
  invoice_code: string | null
  project_code: string | null
  apartment_id: number | null
  apartment_code: string | null
  fee_type_code: string | null
  fee_period_id: number | null
  system_status: string | null
  payment_status: string | null
  paid_amount: number | null
  module_name: string | null
  parent_id: number | null
  package_id: number | null
  project_id: number | null
  unit_id: number | null
  fee_pay_status_id: number | null
  full_unit_code: string | null
  customer_name: string | null
  fee_type_id: number | null
  fee_type: FeeTypeItem | null
  total_amount: number | null
  debit_amount: number | null
  bill_number: string | null
  due_date: string | null
  description: string | null
  inform_date: string | null
  from_date: string | null
  to_date: string | null
  is_show_to_resident: boolean | null
  is_active: boolean | null
  creation_time: string | null
  ref_id: number | null
  from_index: number | null
  to_index: number | null
  total_used: number | null
  fee_generate_id: number | null
}

export type FeeDetailDetailRequest = {
  id: number
}

export type FeeDetailFilterModel = {
  search_text: string
  project_id: number | null
  apartment_code: string
  page_index: number
  page_size: number
}

export type FeeInvoiceItem = {
  id: number | null
  project_id: number | null
  invoice_code: string | null
  apartment_code: string | null
  customer_name: string | null
  fee_type_code: string | null
  amount: number | null
  paid_amount: number | null
  remaining_amount: number | null
  /** remaining_amount exactly as returned by the API (no amount - paid fallback); used for the receivable/credit columns. */
  api_remaining_amount: number | null
  notified_on_utc: string | null
  from_date: string | null
  to_date: string | null
  status: string | null
  document_date: string | null
  posting_date: string | null
  fee_period_id: number | null
  fee_period_name: string | null
  apartment_id: number | null
  is_show_to_resident: boolean | null
  is_active: boolean | null
}

export type FeeInvoiceFilterModel = {
  search_text: string
  project_id: number | null
  fee_period_id: number | null
  fee_type_id: number | null
  status: string
  page_index: number
  page_size: number
}

export type FeeInvoiceSearchRequest = {
  page_size: number
  page_index: number
  search_text: string
  project_id: number | null
}

/** Confirmed fields for WF_BO_ADVANCED_SEARCH_FEE_INVOICE. */
export type AdvancedFeeInvoiceSearchRequest = {
  project_id: number | null
  fee_period_id: number | null
  fee_type_id: number | null
  apartment_id: number | null
  status: string | null
  page_index: number
  page_size: number
}

export type FeeInvoiceSearchResponse = {
  items: FeeInvoiceItem[]
  page_index: number
  page_size: number
  total_count: number
  total_pages: number
}

export type FeeApartmentGroup = {
  apartment_id: number | null
  apartment_code: string | null
  customer_name: string | null
  project_id: number | null
  project_code: string | null
  invoice_count: number | null
  total_amount: number | null
  total_paid_amount: number | null
  remaining_amount: number | null
  invoices: FeeInvoiceItem[]
}

export type FeeApartmentGroupSearchResponse = {
  items: FeeApartmentGroup[]
  page_index: number
  page_size: number
  total_count: number
  total_pages: number
  total_amount: number | null
  total_paid_amount: number | null
  remaining_amount: number | null
  total_invoice_count: number | null
}

export type CreateFeeInvoiceRequest = {
  project_id: null
  apartment_id: number
  fee_type_id: number
  amount: number
  description: string
}

export type CreateFeeInvoiceResponse = { id: number | null; invoice_code: string | null }

/** Confirmed request shape for WF_BO_UPDATE_FEE_INVOICE. */
export type UpdateFeeInvoiceRequest = {
  id: number
  apartment_id: number
  fee_type_id: number
  amount: number
  paid_amount: number
  from_date: string
  to_date: string
  description: string
  status: string
}

export type UpdateFeeInvoiceResponse = { id: number | null }

export type FeePeriodOverview = {
  total_amount: number | null
  paid_amount: number | null
  remaining_amount: number | null
  total_surplus_amount: number | null
  paid_apartments: number | null
  total_apartments: number | null
}

export type FeeNotificationTemplateOption = {
  id: number
  name: string
}

export type FeePeriodItem = {
  id: number | null
  period_code: string
  period_name: string
  project_id: number | null
  year: number | null
  month: number | null
  /** UTC timestamp, e.g. 2026-08-31T23:59:59Z */
  due_date: string | null
  /** e.g. OPEN */
  status: string
  from_date: string | null
  to_date: string | null
  description: string | null
}

export type FeePeriodFilterModel = {
  search_text: string
  /** null = all projects (project_id is omitted from the request). */
  project_id: number | null
  /** null / '' = all (the key is omitted from the request). */
  year: number | null
  month: number | null
  status: string
  /** One-based page used by the UI; the service sends page_index - 1 to the workflow. */
  page_index: number
  page_size: number
}

export type FeePeriodSearchRequest = {
  page_size: number
  page_index: number
  search_text: string
  project_id?: number
  year?: number
  month?: number
  status?: string
}

export type FeePeriodSearchResponse = {
  items: FeePeriodItem[]
  page_index: number
  page_size: number
  total_count: number
  total_pages: number
}

/**
 * Writable fee period fields. Mirrors the confirmed Create request
 * ({ year, month, due_date, period_code, project_id }); Update adds id and status.
 */
export type FeePeriodSaveRequest = {
  period_code: string
  project_id: number
  year: number
  month: number
  /** UTC midnight of the selected calendar date, e.g. 2026-06-14T00:00:00Z */
  due_date: string
}

export type FeePeriodUpdateRequest = FeePeriodSaveRequest & {
  id: number
  status: string
}

/** WF_BO_GENERATE_QUICK_YEAR_FEE_PERIODS request; project_id is omitted when apply_all_projects is true. */
export type FeePeriodGeneratePreviewRequest = {
  project_id?: number
  year: number
  apply_all_projects: boolean
  due_day_of_month: number
  from_day_of_month: number
  prefix: string
  preview_only: true
}

/** One period of data.periods (preview, not stored yet). Dates are UTC timestamps, e.g. 2026-01-31T23:59:59Z. */
export type FeePeriodPreviewItem = {
  period_code: string
  period_name: string
  project_id: number | null
  project_code: string | null
  project_name: string | null
  year: number | null
  month: number | null
  from_date: string | null
  to_date: string | null
  due_date: string | null
  status: string
  description: string | null
}

export type FeePeriodGeneratePreviewResult = {
  periods: FeePeriodPreviewItem[]
  executionId: string | null
}

/** One item of WF_BO_BATCH_SAVE_FEE_PERIODS (display-only project_name / project_code are not sent). */
export type FeePeriodBatchSaveItem = {
  period_code: string
  period_name: string
  project_id: number
  year: number
  month: number
  from_date: string
  to_date: string
  due_date: string
  status: string
  description: string
}

export type FeePeriodBatchSaveRequest = {
  periods: FeePeriodBatchSaveItem[]
}

export type FeePeriodBatchSaveResult = {
  savedCount: number | null
  executionId: string | null
}

export type FeePeriodMutationResult = {
  id: number | null
  executionId: string | null
}

