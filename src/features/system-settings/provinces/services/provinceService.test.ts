import { describe, expect, it, vi } from 'vitest'

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic: vi.fn() } }))

import {
  buildProvinceCreateRequest,
  buildProvinceDeleteRequest,
  buildProvinceSearchRequest,
  buildProvinceUpdateRequest,
  toProvinceFormModel
} from './provinceService'

const form = {
  country_id: 'VN', province_code: 'HN', administrative_code: '', province_name: 'Thành phố Hà Nội',
  m_province_name: 'Hanoi City', short_name: '', administrative_type: 'MUNICIPALITY', region: 'Bắc Bộ',
  postal_code: '', phone_area_code: '024', merged_into_province_code: '', merged_date: '2026-06-15',
  effective_status: 'ACTIVE', status: 'A', sort_order: '1', description: ''
}

describe('Province workflow contracts', () => {
  it('builds zero-based exact search input without normalizing CodeList values', () => {
    expect(buildProvinceSearchRequest({ ...form, search_text: ' hà nội ', page_index: 0, page_size: 20 })).toEqual({
      country_id: 'VN', effective_status: 'ACTIVE', administrative_type: 'MUNICIPALITY', region: 'Bắc Bộ',
      search_text: 'hà nội', page_index: 0, page_size: 20, status: 'A', exclude_deleted: true
    })
  })

  it('builds create input with the exact field set and serializes a selected date', () => {
    expect(buildProvinceCreateRequest(form)).toEqual({
      country_id: 'VN', province_code: 'HN', administrative_code: '', province_name: 'Thành phố Hà Nội',
      m_province_name: 'Hanoi City', short_name: '', administrative_type: 'MUNICIPALITY', region: 'Bắc Bộ',
      postal_code: '', phone_area_code: '024', merged_into_province_code: '', merged_date: '2026-06-15T00:00:00Z',
      effective_status: 'ACTIVE', status: 'A', sort_order: 1, description: ''
    })
  })

  it('keeps updated_by and excludes read-only is_merged from update input', () => {
    expect(buildProvinceUpdateRequest({ ...form, id: 1 })).toEqual({
      id: 1, ...buildProvinceCreateRequest(form), updated_by: ''
    })
  })

  it('preserves an unresolved empty merge date instead of inventing a transport value', () => {
    expect(toProvinceFormModel({ ...form, sort_order: 1, merged_date: null }).merged_date).toBeNull()
  })

  it('builds delete input from the stable identity only', () => {
    expect(buildProvinceDeleteRequest({ id: 1, country_id: 'VN', province_code: 'HN' })).toEqual({ id: 1, country_id: 'VN', province_code: 'HN' })
  })
})
