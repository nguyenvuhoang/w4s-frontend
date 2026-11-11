import { describe, expect, it } from 'vitest'

import { buildFeeTypeCalculationMethodOptions } from './useFeeTypeCalculationMethodCodeList'

describe('buildFeeTypeCalculationMethodOptions', () => {
  const items = [
    { id: 1, code_id: 'BY_AREA', code_name: 'FEE_CALCULATION_METHOD', caption: 'Theo diện tích', m_caption: '{"vi":"Theo diện tích","en":"By area"}', code_group: 'IPS', code_index: 2, code_value: 'BY_AREA', visible: true },
    { id: 2, code_id: 'FIXED', code_name: 'FEE_CALCULATION_METHOD', caption: 'Cố định', m_caption: '{"vi":"Cố định","en":"Fixed"}', code_group: 'IPS', code_index: 1, code_value: 'FIXED', visible: true },
    { id: 3, code_id: 'HIDDEN', code_name: 'FEE_CALCULATION_METHOD', caption: 'Ẩn', m_caption: null, code_group: 'IPS', code_index: 0, code_value: 'HIDDEN', visible: false }
  ]

  it('uses visible code values in CodeList order with locale captions', () => {
    expect(buildFeeTypeCalculationMethodOptions(items, 'en', '')).toEqual([
      { value: 'FIXED', label: 'Fixed' },
      { value: 'BY_AREA', label: 'By area' }
    ])
  })

  it('keeps a stored value that is absent from CodeList selectable without replacing it', () => {
    expect(buildFeeTypeCalculationMethodOptions(items, 'vi', 'LEGACY_METHOD')[0]).toEqual({
      value: 'LEGACY_METHOD',
      label: 'LEGACY_METHOD'
    })
  })
})
