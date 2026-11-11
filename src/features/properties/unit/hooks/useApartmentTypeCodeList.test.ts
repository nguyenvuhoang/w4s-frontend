import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

const calls: Array<Record<string, unknown>> = []

const CODE_LIST = [
  ['VILLA', 6, 'Villa', 'Villa', true],
  ['OFFICETEL', 2, 'Căn hộ văn phòng', 'Office-tel', true],
  ['PENTHOUSE', 0, 'Penthouse', 'Penthouse', false],
  ['APARTMENT', 1, 'Căn hộ', 'Apartment', true],
  ['MALL', 5, 'Trung tâm thương mại', 'Mall', true],
  ['OFFICE', 3, 'Văn phòng', 'Office', true],
  ['SHOPHOUSE', 4, 'Shophouse', 'Shophouse', true],
  ['MISSING_VALUE', 7, 'Không có giá trị', 'Missing value', true]
].map(([code_value, code_index, caption, en, visible], id) => ({
  id,
  code_id: String(code_value),
  code_name: 'APARTMENT_TYPE',
  code_group: 'IPS',
  code_index: code_index as number,
  code_value: code_value === 'MISSING_VALUE' ? '' : String(code_value),
  caption: String(caption),
  m_caption: code_value === 'VILLA' ? null : JSON.stringify({ vi: caption, en }),
  visible: visible as boolean
}))

vi.mock('@/shared/hooks/useCodeListCaptionMap', () => ({
  useCodeListCaptionMap: (args: Record<string, unknown>) => {
    calls.push(args)
    return {
      items: CODE_LIST,
      captionMap: new Map(CODE_LIST.map(item => [item.code_value, item.caption])),
      isLoading: false,
      error: null
    }
  }
}))

describe('useApartmentTypeCodeList', () => {
  it('loads IPS / APARTMENT_TYPE and exposes visible CodeValue options in CodeIndex order with localized captions', async () => {
    const { useApartmentTypeCodeList } = await import('./useApartmentTypeCodeList')
    let result: ReturnType<typeof useApartmentTypeCodeList> | undefined

    const Probe = () => {
      result = useApartmentTypeCodeList('vi')
      return null
    }

    renderToStaticMarkup(createElement(Probe))

    expect(calls).toContainEqual({ code_group: 'IPS', code_name: 'APARTMENT_TYPE', language: 'vi' })
    expect(result?.options).toEqual([
      { value: 'APARTMENT', label: 'Căn hộ' },
      { value: 'OFFICETEL', label: 'Căn hộ văn phòng' },
      { value: 'OFFICE', label: 'Văn phòng' },
      { value: 'SHOPHOUSE', label: 'Shophouse' },
      { value: 'MALL', label: 'Trung tâm thương mại' },
      { value: 'VILLA', label: 'Villa' }
    ])
    expect(result?.options.map(option => option.value)).not.toContain('PENTHOUSE')
    expect(result?.options.map(option => option.value)).not.toContain('MISSING_VALUE')
  })
})
