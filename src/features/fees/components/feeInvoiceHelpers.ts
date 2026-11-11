import { formatDateShort } from '@/shared/utils/formatDateShort'

import type { FeeInvoiceFilterModel, FeeDictionary } from '../types'
import { feeText, commonText } from './feeTypeHelpers'

export { feeText, commonText }

export const emptyFeeInvoiceFilter: FeeInvoiceFilterModel = {
  search_text: '',
  project_id: null,
  fee_period_id: null,
  fee_type_id: null,
  status: '',
  page_index: 0,
  page_size: 10
}

export const FEE_INVOICE_EMPTY_VALUE = '—'

export const formatFeeInvoiceMoney = (value: number | null | undefined, locale: string) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return FEE_INVOICE_EMPTY_VALUE

  if (locale === 'vi') return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(value))} đ`

  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value))
}

export const formatFeeInvoiceDate = (value: string | null | undefined) => {
  if (!value) return FEE_INVOICE_EMPTY_VALUE

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return FEE_INVOICE_EMPTY_VALUE

  return formatDateShort(value)
}

export const getFeeInvoiceStatusColor = (status: string | null): 'success' | 'warning' | 'error' | 'default' => {
  const normalized = (status ?? '').toUpperCase()

  if (!normalized) return 'default'
  if (normalized.includes('OVERDUE') || normalized.includes('CANCEL') || normalized.includes('FAIL')) return 'error'
  if (normalized.includes('UNPAID') || normalized.includes('PARTIAL') || normalized.includes('PENDING')) return 'warning'
  if (normalized.includes('PAID') || normalized.includes('DONE') || normalized.includes('SUCCESS')) return 'success'

  return 'default'
}

export const getFeeInvoiceStatusLabel = (
  dictionary: FeeDictionary,
  status: string | null,
  captions: ReadonlyMap<string, string>
) => {
  const raw = status?.trim() ?? ''
  if (!raw) return FEE_INVOICE_EMPTY_VALUE

  const caption = captions.get(raw.toUpperCase())
  if (caption) return caption

  if (raw === 'UNPAID') return feeText(dictionary, 'fee_invoice_status_unpaid', 'Unpaid')
  if (raw === 'PAID') return feeText(dictionary, 'fee_invoice_status_paid', 'Paid')
  if (raw === 'OVERDUE') return feeText(dictionary, 'fee_invoice_status_overdue', 'Overdue')

  return raw
}

export const getFeeInvoiceDocumentDate = (row: { document_date: string | null; posting_date: string | null }) => (
  row.document_date ?? row.posting_date
)

export type FeeInvoiceBalanceSplit = { receivable_amount: number | null; customer_credit_amount: number | null }

// Splits a per-invoice signed balance (fee-import: outstanding_amount, fee-management: remaining_amount).
// > 0: customer still owes; < 0: customer has credit on this invoice; null/undefined: unknown, never defaulted to 0.
export const splitFeeInvoiceBalance = (balance: number | null | undefined): FeeInvoiceBalanceSplit => {
  if (balance === null || balance === undefined || !Number.isFinite(balance)) return { receivable_amount: null, customer_credit_amount: null }

  return balance > 0 ? { receivable_amount: balance, customer_credit_amount: 0 } : { receivable_amount: 0, customer_credit_amount: Math.abs(balance) }
}

export const getFeeInvoiceCreditCellSx = (creditAmount: number | null) => creditAmount ? { color: 'success.main', bgcolor: 'success.lighterOpacity' } : {}
