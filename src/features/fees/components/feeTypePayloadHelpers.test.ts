import { describe, expect, it } from 'vitest'

import {
  buildFeeTypeCreatePayload,
  mapFeeTypeBackendFieldErrors
} from './feeTypePayloadHelpers'

describe('fee type workflow payload helpers', () => {
  it('maps the Vietnamese name to the required Create workflow name field', () => {
    const payload = buildFeeTypeCreatePayload({
      fee_type_code: 'FEE_MGT',
      name: 'Phí thông thường',
      name_en: '',
      description: 'Mô tả',
      description_en: '',
      group_type: 'REGULAR',
      document_code: 'IT0001',
      calculation_method: 'FIXED',
      unit: 'đ',
      default_amount: '1000000',
      status: 'A'
    })

    expect(payload).toMatchObject({
      name: 'Phí thông thường',
      name_translations: JSON.stringify({ vi: 'Phí thông thường', en: '' })
    })
    expect(payload).not.toHaveProperty('fee_type_name')
  })

  it('maps backend Name validation errors to the name input and preserves all messages', () => {
    expect(mapFeeTypeBackendFieldErrors([
      { field: 'Name', message: 'Trường Name là bắt buộc.' },
      { field: 'fee_type_code', message: 'Mã đã tồn tại.' }
    ], {
      name: 'Tên loại phí',
      fee_type_code: 'Mã loại phí',
      nameRequired: 'Tên loại phí là trường bắt buộc.'
    })).toEqual({
      name: 'Tên loại phí là trường bắt buộc.',
      fee_type_code: 'Mã đã tồn tại.'
    })
  })
})
