import { describe, expect, it } from 'vitest'

import { mapFeeExcelValidation } from './feeImport.mapper'
import { formatFeeExcelPreviewValue, getFeeExcelPreviewValue } from './feeImportPreview'

describe('mapFeeExcelValidation', () => {
  it('uses parsed items for accounting values and rows for per-row validation metadata', () => {
    const result = mapFeeExcelValidation({ data: {
      total_rows: 6,
      valid_rows: 1,
      error_rows: 5,
      items: [
        { customer_name: 'IT Test1', apartment_code: 'AG-01-01', bill_payment_number: 'BP-01', opening_remaining_amount: 0, amount: 350000, paid_amount: 0, remaining_amount: 350000 },
        { customer_name: 'IT TEST', apartment_code: 'AG-01-02', amount: 125000 },
        { customer_name: 'Quách Phương Thanh', apartment_code: 'AG-01-03', amount: 420000, paid_amount: 100000, remaining_amount: 320000 },
        { customer_name: 'Hoàng Nhật Tân', apartment_code: 'AG-01-04', amount: 120000 },
        { customer_name: 'Nguyễn Thanh Vy', apartment_code: 'AG-02-01', amount: 90000, paid_amount: 90000, remaining_amount: 0 },
        { customer_name: 'Lê Thị Hoàng Hoa', apartment_code: 'AG-03-06', remaining_amount: -200000 }
      ],
      rows: [
        { row_number: 2, status: 'INVALID', errors: ['Không tìm thấy loại phí với mã PT-'] },
        { row_number: 3, status: 'INVALID', errors: ['Không tìm thấy loại phí với mã PT-'] },
        { row_number: 4, status: 'INVALID', errors: ['Không tìm thấy loại phí với mã PT-'] },
        { row_number: 5, status: 'INVALID', errors: ['Không tìm thấy loại phí với mã PT-'] },
        { row_number: 6, status: 'INVALID', errors: ['Không tìm thấy loại phí với mã PT-'] },
        { row_number: 7, status: 'VALID', errors: [] }
      ]
    } })

    expect(result.rows).toHaveLength(6)
    expect(result.rows[0]).toMatchObject({ rowNumber: 2, valid: false, validationStatus: 'INVALID', errors: ['Không tìm thấy loại phí với mã PT-'] })
    expect(result.rows[4]).toMatchObject({ rowNumber: 6, valid: false, validationStatus: 'INVALID', errors: ['Không tìm thấy loại phí với mã PT-'] })
    expect(result.rows[5]).toMatchObject({ rowNumber: 7, valid: true, validationStatus: 'VALID', errors: [] })
    expect(getFeeExcelPreviewValue(result.rows[0].values, 'invoiceValue')).toBe(350000)
    expect(getFeeExcelPreviewValue(result.rows[0].values, 'documentNumber')).toBe('BP-01')
    expect(getFeeExcelPreviewValue(result.rows[0].values, 'openingReceivable')).toBe(0)
    expect(getFeeExcelPreviewValue(result.rows[0].values, 'customerCode')).toBe('AG-01-01')
    expect(getFeeExcelPreviewValue(result.rows[1].values, 'customerCode')).toBe('AG-01-02')
    expect(getFeeExcelPreviewValue(result.rows[2].values, 'customerCode')).toBe('AG-01-03')
    expect(getFeeExcelPreviewValue(result.rows[0].values, 'customerName')).toBe('IT Test1')
    expect(getFeeExcelPreviewValue(result.rows[5].values, 'customerName')).toBe('Lê Thị Hoàng Hoa')
    expect(getFeeExcelPreviewValue(result.rows[0].values, 'collectedAmount')).toBe(0)
    expect(getFeeExcelPreviewValue(result.rows[2].values, 'remainingReceivable')).toBe(320000)
    expect(getFeeExcelPreviewValue(result.rows[4].values, 'remainingReceivable')).toBe(0)
    expect(getFeeExcelPreviewValue(result.rows[5].values, 'remainingReceivable')).toBe(-200000)
    expect(formatFeeExcelPreviewValue(350000, true, 'vi')).toBe('350.000đ')
    expect(formatFeeExcelPreviewValue(0, true, 'vi')).toBe('0đ')
    expect(formatFeeExcelPreviewValue(-200000, true, 'vi')).toBe('-200.000đ')
    expect(formatFeeExcelPreviewValue(null, true, 'vi')).toBe('-')
  })

  it('does not assign validation errors by position when Excel row numbers are not sequential', () => {
    const result = mapFeeExcelValidation({ data: {
      items: [{ customer_name: 'First' }, { customer_name: 'Second' }],
      rows: [
        { row_number: 2, status: 'INVALID', errors: ['First error'] },
        { row_number: 4, status: 'INVALID', errors: ['Second error'] }
      ]
    } })

    expect(result.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ values: { customer_name: 'First' }, errors: [], valid: null }),
      expect.objectContaining({ values: { customer_name: 'Second' }, errors: [], valid: null })
    ]))
  })
})
