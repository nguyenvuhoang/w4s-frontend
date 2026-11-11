import { describe, expect, it } from 'vitest'

import { FEE_EXCEL_PREVIEW_COLUMNS, getFeeExcelPreviewValue } from './feeImportPreview'

describe('getFeeExcelPreviewValue', () => {
  it('maps apartment_code to the customer code column from the original Excel', () => {
    expect(getFeeExcelPreviewValue({ customer_code: 'KH-01', apartment_code: 'AG-01-01' }, 'customerCode')).toBe('AG-01-01')
    expect(getFeeExcelPreviewValue({ apartment_code: 'AG-01-02' }, 'customerCode')).toBe('AG-01-02')
  })

  it('keeps exactly the 12 original Excel columns in order', () => {
    expect(FEE_EXCEL_PREVIEW_COLUMNS.map(column => column.key)).toEqual([
      'customerName', 'customerCode', 'postingDate', 'documentDate', 'documentNumber', 'invoiceDate',
      'invoiceNumber', 'description', 'openingReceivable', 'invoiceValue', 'collectedAmount', 'remainingReceivable'
    ])
  })
})
