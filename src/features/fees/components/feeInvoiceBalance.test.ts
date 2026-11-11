import { describe, expect, it, vi } from 'vitest'

vi.mock('@/servers/system-service', () => ({ workflowService: {} }))

import { mapFeeApartmentGroupSearchResponse, mapFeeInvoiceSearchResponse } from '../service'
import { formatFeeInvoiceMoney, getFeeInvoiceCreditCellSx, splitFeeInvoiceBalance } from './feeInvoiceHelpers'

const request = { page_index: 1, page_size: 20 }
const mapInvoice = (row: Record<string, unknown>) => mapFeeInvoiceSearchResponse({ data: { items: [row], total_count: 1 } }, request).items[0]

describe('splitFeeInvoiceBalance (shared by fee management and fee import)', () => {
  it('positive balance: receivable = value, customer credit = 0', () => {
    expect(splitFeeInvoiceBalance(200000)).toEqual({ receivable_amount: 200000, customer_credit_amount: 0 })
  })

  it('negative balance: receivable = 0, customer credit = absolute value', () => {
    expect(splitFeeInvoiceBalance(-75000)).toEqual({ receivable_amount: 0, customer_credit_amount: 75000 })
  })

  it('zero balance: both are 0', () => {
    expect(splitFeeInvoiceBalance(0)).toEqual({ receivable_amount: 0, customer_credit_amount: 0 })
  })

  it.each([null, undefined])('%s balance: both stay empty and render as the dash placeholder', balance => {
    const split = splitFeeInvoiceBalance(balance)

    expect(split).toEqual({ receivable_amount: null, customer_credit_amount: null })
    expect(formatFeeInvoiceMoney(split.receivable_amount, 'vi')).toBe('—')
    expect(formatFeeInvoiceMoney(split.customer_credit_amount, 'vi')).toBe('—')
  })

  it('highlights only a customer credit greater than 0', () => {
    expect(getFeeInvoiceCreditCellSx(75000)).toMatchObject({ color: 'success.main' })
    expect(getFeeInvoiceCreditCellSx(0)).toEqual({})
    expect(getFeeInvoiceCreditCellSx(null)).toEqual({})
  })
})

describe('fee management invoice remaining_amount mapping', () => {
  it.each([
    [350000, { receivable_amount: 350000, customer_credit_amount: 0 }],
    [-50000, { receivable_amount: 0, customer_credit_amount: 50000 }],
    [0, { receivable_amount: 0, customer_credit_amount: 0 }]
  ])('maps remaining_amount %s from the API into the receivable/credit columns', (remaining_amount, expected) => {
    const row = mapInvoice({ id: 1, amount: 350000, paid_amount: 0, remaining_amount })

    expect(row.amount).toBe(350000)
    expect(row.api_remaining_amount).toBe(remaining_amount)
    expect(splitFeeInvoiceBalance(row.api_remaining_amount)).toEqual(expected)
  })

  it.each([
    ['null', { id: 1, amount: 350000, paid_amount: 100000, remaining_amount: null }],
    ['undefined', { id: 1, amount: 350000, paid_amount: 100000 }]
  ])('does not derive the display balance from amount - paid_amount when remaining_amount is %s', (_, source) => {
    const row = mapInvoice(source)

    expect(row.api_remaining_amount).toBeNull()
    expect(splitFeeInvoiceBalance(row.api_remaining_amount)).toEqual({ receivable_amount: null, customer_credit_amount: null })
  })

  it('keeps the existing remaining_amount fallback used by settlement unchanged', () => {
    expect(mapInvoice({ id: 1, amount: 350000, paid_amount: 100000 }).remaining_amount).toBe(250000)
  })

  it('maps nested apartment-view invoices with the same API remaining_amount', () => {
    const result = mapFeeApartmentGroupSearchResponse({ data: { items: [{ apartment_id: 9, invoices: [{ id: 1, amount: 100000, remaining_amount: -20000 }, { id: 2, amount: 100000 }] }] } }, request)
    const [credit, missing] = result.items[0].invoices

    expect(splitFeeInvoiceBalance(credit.api_remaining_amount)).toEqual({ receivable_amount: 0, customer_credit_amount: 20000 })
    expect(missing.api_remaining_amount).toBeNull()
  })
})
