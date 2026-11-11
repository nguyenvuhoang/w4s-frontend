import { describe, expect, it } from 'vitest'

import { mapFeeImportDetail, mapFeeImportDetailRows, mapFeeImportSearch, splitOutstandingAmount } from './feeImportWorkflow.mapper'

describe('mapFeeImportSearch', () => {
  it('maps the staging import response and preserves zero-based page indexes', () => {
    const result = mapFeeImportSearch({ data: { items: [{ fee_import_id: 8, import_code: 'IMP-01', total_rows: 0 }], total_count: 1, page_index: 0, page_size: 20 } }, { project_id: 4, search_text: '', status: '', page_index: 0, page_size: 20 })

    expect(result.page_index).toBe(0)
    expect(result.items[0]).toMatchObject({ id: 8, import_code: 'IMP-01', total_rows: 0 })
  })

  it('unwraps import metadata from the get-by-id response', () => {
    const result = mapFeeImportDetail({ data: { import: {
      id: 3, import_code: 'IMP-AGR-20261017063147', project_id: 1, file_name: 'mau-tao-phi-test.xlsx', notes: null,
      total_rows: 1, imported_count: 1, skipped_count: 0, updated_count: 0, error_count: 0,
      imported_on_utc: '2026-10-17T06:31:47.995641Z', status: 'A'
    } } })

    expect(result).toMatchObject({
      id: 3, import_code: 'IMP-AGR-20261017063147', file_name: 'mau-tao-phi-test.xlsx', notes: null,
      total_rows: 1, imported_count: 1, skipped_count: 0, updated_count: 0, error_count: 0,
      import_date: '2026-10-17T06:31:47.995641Z', status: 'A'
    })
  })

  it('preserves saved batch notes for the detail page', () => {
    expect(mapFeeImportDetail({ data: { import: { id: 3, notes: 'Ghi chú đợt import' } } }).notes).toBe('Ghi chú đợt import')
  })

  it.each([null, undefined, ''])('maps empty batch notes %s to null for the dash formatter', notes => {
    expect(mapFeeImportDetail({ data: { import: { id: 3, notes } } }).notes).toBeNull()
  })
})

describe('fee import period metadata', () => {
  const filter = { project_id: 1, search_text: '', status: '', page_index: 0, page_size: 20 }

  it('maps period_name from batch metadata into the existing display field', () => {
    expect(mapFeeImportDetail({ data: { import: { id: 3, period_name: '2026-10' } } }).fee_period_name).toBe('2026-10')
  })

  it.each([null, undefined, ''])('keeps missing period_name %s empty for the existing dash formatter', period_name => {
    expect(mapFeeImportDetail({ data: { id: 3, period_name } }).fee_period_name).toBeNull()
    expect(mapFeeImportDetailRows({ data: { items: [], period_name } }, filter).period_name).toBeNull()
  })

  it('preserves period_name from the detail search metadata without modifying rows or pagination', () => {
    const result = mapFeeImportDetailRows({ data: {
      period_name: '2026-10', items: [{ id: 12, period_name: '2026-09', amount: 0 }],
      total_count: 24, total_pages: 2, page_index: 0, page_size: 20
    } }, filter)

    expect(result.period_name).toBe('2026-10')
    expect(result.items[0]).toMatchObject({ id: 12, amount: 0 })
    expect(result).toMatchObject({ total_count: 24, total_pages: 2, page_index: 0, page_size: 20 })
  })

  it('does not infer batch metadata from a single detail row', () => {
    expect(mapFeeImportDetailRows({ data: {
      items: [{ period_name: '2026-10' }], total_count: 30, total_pages: 2
    } }, filter).period_name).toBeNull()
  })
})

describe('fee import outstanding_amount columns', () => {
  const filter = { project_id: 1, search_text: '', status: '', page_index: 0, page_size: 20 }
  const mapRow = (row: Record<string, unknown>) => mapFeeImportDetailRows({ data: { items: [row] } }, filter).items[0]

  it('keeps amount as invoice value and maps outstanding_amount separately', () => {
    expect(mapRow({ id: 1, amount: 350000, outstanding_amount: 120000 })).toMatchObject({ amount: 350000, outstanding_amount: 120000 })
  })

  it('does not derive outstanding_amount from amount when it is missing', () => {
    expect(mapRow({ id: 1, amount: 350000 }).outstanding_amount).toBeNull()
    expect(mapRow({ id: 1, amount: 350000, outstanding_amount: null }).outstanding_amount).toBeNull()
  })

  it('positive outstanding: receivable = value, customer credit = 0', () => {
    expect(splitOutstandingAmount(mapRow({ outstanding_amount: 150000 }).outstanding_amount)).toEqual({ receivable_amount: 150000, customer_credit_amount: 0 })
  })

  it('negative outstanding: receivable = 0, customer credit = absolute value', () => {
    expect(splitOutstandingAmount(mapRow({ outstanding_amount: -50000 }).outstanding_amount)).toEqual({ receivable_amount: 0, customer_credit_amount: 50000 })
  })

  it('zero outstanding: both columns are 0', () => {
    expect(splitOutstandingAmount(mapRow({ outstanding_amount: 0 }).outstanding_amount)).toEqual({ receivable_amount: 0, customer_credit_amount: 0 })
  })

  it.each([null, undefined])('missing outstanding (%s): both columns stay empty instead of defaulting to 0', outstanding => {
    expect(splitOutstandingAmount(outstanding)).toEqual({ receivable_amount: null, customer_credit_amount: null })
  })
})
