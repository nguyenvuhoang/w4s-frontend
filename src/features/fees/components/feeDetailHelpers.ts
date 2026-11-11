import { formatDateShort } from '@/shared/utils/formatDateShort'
import { formatDateTime } from '@/shared/utils/formatDateTime'

import type { FeeDetailFilterModel, FeeDictionary, FeeTypeItem } from '../types'
import { feeText, commonText } from './feeTypeHelpers'

export { feeText, commonText }

export const emptyFeeDetailFilter: FeeDetailFilterModel = {
  search_text: '',
  project_id: null,
  apartment_code: '',
  page_index: 0,
  page_size: 10
}

export const FEE_DETAIL_EMPTY_VALUE = '—'

export const formatFeeDetailMoney = (value: number | null | undefined, locale: string) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return FEE_DETAIL_EMPTY_VALUE

  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(Number(value))
}

export const formatFeeDetailDate = (value: string | null | undefined) => {
  if (!value) return FEE_DETAIL_EMPTY_VALUE

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return FEE_DETAIL_EMPTY_VALUE

  return formatDateShort(value)
}

export const formatFeeDetailDateTime = (value: string | null | undefined) => {
  if (!value) return FEE_DETAIL_EMPTY_VALUE

  const formatted = formatDateTime(value)

  return formatted || FEE_DETAIL_EMPTY_VALUE
}

export const getBooleanLabel = (value: boolean | null, locale: string, dictionary?: FeeDictionary) => {
  if (value === null) return FEE_DETAIL_EMPTY_VALUE
  if (dictionary) return feeText(dictionary, value ? 'boolean_yes' : 'boolean_no', value ? 'Yes' : 'No')

  return locale === 'vi' ? (value ? 'Có' : 'Không') : (value ? 'Yes' : 'No')
}

export const getFeeDetailActiveColor = (value: boolean | null) => (value ? 'success' : 'default')

export const getFeeDetailShowToResidentColor = (value: boolean | null) => (value ? 'info' : 'default')

export type FeeTypeDisplay = {
  label: string
  code: string | null
}

/**
 * Fee type display priority: name, then code, then the shared empty-value marker.
 * When both name and a distinct code are available, the code is returned separately
 * so callers can render it as a smaller/muted suffix, e.g. "Phí quản lý căn hộ (PQL)".
 */
export const formatFeeTypeDisplay = (feeType: FeeTypeItem | null | undefined): FeeTypeDisplay => {
  const name = feeType?.name?.trim() || null
  const code = feeType?.fee_type_code?.trim() || null

  if (name) return { label: name, code: code && code !== name ? code : null }
  if (code) return { label: code, code: null }

  return { label: FEE_DETAIL_EMPTY_VALUE, code: null }
}

export const truncateFeeDetailText = (value: string | null | undefined, maxLength = 60) => {
  if (!value) return FEE_DETAIL_EMPTY_VALUE

  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value
}
