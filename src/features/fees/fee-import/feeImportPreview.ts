export type FeeExcelPreviewColumnKey =
  | 'customerName' | 'customerCode' | 'postingDate' | 'documentDate' | 'documentNumber' | 'invoiceDate'
  | 'invoiceNumber' | 'description' | 'openingReceivable' | 'invoiceValue' | 'collectedAmount' | 'remainingReceivable'

export const FEE_EXCEL_PREVIEW_COLUMNS: ReadonlyArray<{ key: FeeExcelPreviewColumnKey; labelKey: string; amount?: boolean }> = [
  { key: 'customerName', labelKey: 'fee_excel_preview_customer_name' },
  { key: 'customerCode', labelKey: 'fee_excel_preview_customer_code' },
  { key: 'postingDate', labelKey: 'fee_excel_preview_posting_date' },
  { key: 'documentDate', labelKey: 'fee_excel_preview_document_date' },
  { key: 'documentNumber', labelKey: 'fee_excel_preview_document_number' },
  { key: 'invoiceDate', labelKey: 'fee_excel_preview_invoice_date' },
  { key: 'invoiceNumber', labelKey: 'fee_excel_preview_invoice_number' },
  { key: 'description', labelKey: 'fee_excel_preview_description' },
  { key: 'openingReceivable', labelKey: 'fee_excel_preview_opening_receivable', amount: true },
  { key: 'invoiceValue', labelKey: 'fee_excel_preview_invoice_value', amount: true },
  { key: 'collectedAmount', labelKey: 'fee_excel_preview_collected_amount', amount: true },
  { key: 'remainingReceivable', labelKey: 'fee_excel_preview_remaining_receivable', amount: true }
]

const FIELD_ALIASES: Record<FeeExcelPreviewColumnKey, readonly string[]> = {
  customerName: ['customer_name', 'customerName', 'Tên khách hàng'],
  customerCode: ['apartment_code', 'apartmentCode', 'Mã khách hàng'],
  postingDate: ['posting_date', 'postingDate', 'Ngày hạch toán'],
  documentDate: ['document_date', 'documentDate', 'Ngày chứng từ'],
  documentNumber: ['bill_payment_number', 'billPaymentNumber', 'document_number', 'documentNumber', 'voucher_number', 'voucherNumber', 'Số chứng từ'],
  invoiceDate: ['invoice_date', 'invoiceDate', 'Ngày hóa đơn'],
  invoiceNumber: ['invoice_number', 'invoiceNumber', 'Số hóa đơn'],
  description: ['description', 'Diễn giải'],
  openingReceivable: ['opening_remaining_amount', 'openingRemainingAmount', 'opening_receivable', 'openingReceivable', 'opening_balance', 'openingBalance', 'Số còn phải thu ĐK'],
  invoiceValue: ['amount', 'invoice_value', 'invoiceValue', 'invoice_amount', 'invoiceAmount', 'Giá trị hóa đơn'],
  collectedAmount: ['collected_amount', 'collectedAmount', 'paid_amount', 'paidAmount', 'Số đã thu'],
  remainingReceivable: ['remaining_receivable', 'remainingReceivable', 'remaining_amount', 'remainingAmount', 'Số còn phải thu']
}

export const getFeeExcelPreviewValue = (values: Record<string, unknown>, key: FeeExcelPreviewColumnKey): unknown | null => {
  for (const field of FIELD_ALIASES[key]) {
    const value = values[field]
    if (value !== null && value !== undefined && value !== '') return value
  }
  return null
}

export const formatFeeExcelPreviewValue = (value: unknown, amount: boolean, locale: string): string => {
  if (value === null || value === undefined || value === '') return '-'
  if (amount && Number.isFinite(Number(value))) {
    return `${new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(Number(value))}đ`
  }
  return typeof value === 'object' ? '-' : String(value)
}
