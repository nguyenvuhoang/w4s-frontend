import type { FeeDictionary, FeeTypeFilterModel, FeeTypeFormValues, FeeTypeItem, FeeTypeStatus } from '../types'
import { formatCurrencyAmount } from '@/shared/utils/formatCurrencyAmount'

export const emptyFeeTypeFilter: FeeTypeFilterModel = {
  search_text: '',
  page_index: 0,
  page_size: 10
}

export const feeText = (dictionary: FeeDictionary, key: string, fallback: string) => (
  dictionary.feeManagement?.[key] ?? fallback
)

export const commonText = (dictionary: FeeDictionary, key: string, fallback: string) => (
  dictionary.common?.[key] ?? fallback
)

export const getFeeTypeStatusColor = (status: FeeTypeStatus) => {
  if (status === 'A') return 'success'
  if (status === 'I') return 'default'
  if (status === 'B') return 'error'
  if (status === 'D') return 'error'
  if (status === 'DRAFT') return 'warning'

  return 'info'
}

export const getFeeTypeStatusLabel = (dictionary: FeeDictionary, status: FeeTypeStatus) => {
  if (status === 'A') return feeText(dictionary, 'status_active', 'Active')
  if (status === 'I') return feeText(dictionary, 'status_inactive', 'Inactive')
  if (status === 'B') return feeText(dictionary, 'status_blocked', 'Blocked')
  if (status === 'D') return feeText(dictionary, 'status_deleted', 'Deleted')
  if (status === 'DRAFT') return feeText(dictionary, 'status_draft', 'Draft')

  return status || '-'
}

export const getCalculationMethodLabel = (dictionary: FeeDictionary, method: string) => {
  if (method === 'FIXED') return feeText(dictionary, 'calculation_fixed', 'Fixed')
  if (method === 'BY_METER') return feeText(dictionary, 'calculation_by_meter', 'By meter')
  if (method === 'BY_AREA') return feeText(dictionary, 'calculation_by_area', 'By area')

  return method || '-'
}

export const formatFeeAmount = (value: number | null | undefined, locale: string) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-'

  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(Number(value))
}

export const formatFeeAmountWithUnit = (
  value: number | null | undefined,
  locale: string,
  unit?: string | null
) => formatCurrencyAmount({ value, locale, unit })

export const feeTypeStatusOptions = ['A', 'I', 'B'] as const

export const buildFeeTypeFormValues = (detail: FeeTypeItem): FeeTypeFormValues => ({
  fee_type_code: detail.fee_type_code || '',
  name: detail.name || '',
  name_en: detail.name_translations.en || '',
  description: detail.description || '',
  description_en: detail.description_translations.en || '',
  group_type: detail.group_type || '',
  document_code: detail.document_code || '',
  calculation_method: detail.calculation_method || '',
  unit: detail.unit || '',
  default_amount: detail.default_amount === null || detail.default_amount === undefined ? '' : String(detail.default_amount),
  status: detail.status || 'A'
})

export const buildCreateFeeTypeFormValues = (): FeeTypeFormValues => ({
  fee_type_code: '',
  name: '',
  name_en: '',
  description: '',
  description_en: '',
  group_type: '',
  document_code: '',
  calculation_method: '',
  unit: '',
  default_amount: '',
  status: 'A'
})
