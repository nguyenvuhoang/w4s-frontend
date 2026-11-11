import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ApartmentDetailApartment } from './types'

const { runFODynamic, codeListCalls, codeListState, textFields } = vi.hoisted(() => ({
  runFODynamic: vi.fn(),
  codeListCalls: [] as Array<Record<string, unknown>>,
  codeListState: { isLoading: false, error: null as Error | null },
  textFields: [] as Array<Record<string, any>>
}))

// CodeList IPS / APARTMENT_STATUS as confirmed by the Backend (test data only), plus one hidden item.
const CODE_LIST = [
  ['VACANT', 4, 'Căn hộ trống', 'Vacant', true],
  ['OCCUPIED', 1, 'Đang ở', 'Occupied', true],
  ['LEASED', 2, 'Đang cho thuê', 'Leased', true],
  ['OTHER', 5, 'Other', 'Other', true],
  ['HOTO', 3, 'Đang bàn giao', 'HOTO', true],
  ['RETIRED', 6, 'Ngừng dùng', 'Retired', false]
].map(([code_value, code_index, vi, en, visible], id) => ({
  id, code_id: String(code_value), code_name: 'APARTMENT_STATUS', code_group: 'IPS', code_index: code_index as number,
  code_value: String(code_value), caption: String(vi), m_caption: JSON.stringify({ vi, en }), visible: visible as boolean
}))

vi.mock('@/shared/hooks/useCodeListCaptionMap', () => ({
  useCodeListCaptionMap: (args: { code_group: string; code_name: string; language: string }) => {
    codeListCalls.push(args)

    const captionMap = new Map(CODE_LIST.map(item => [item.code_value, JSON.parse(item.m_caption)[args.language] as string]))

    return { items: codeListState.isLoading || codeListState.error ? [] : CODE_LIST, captionMap: codeListState.isLoading ? new Map() : captionMap, ...codeListState }
  }
}))
vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))
vi.mock('@/features/properties/building/buildingService', () => ({ buildingService: {} }))
vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')
  const Stub = ({ children, label }: { children?: React.ReactNode; label?: React.ReactNode }) => h(Fragment, null, label ?? null, children ?? null)
  const TextField = (props: Record<string, any>) => {
    textFields.push(props)

    return h(Fragment, null, props.label ?? null, props.children ?? null)
  }
  const MenuItem = ({ value, disabled, children }: { value: string; disabled?: boolean; children?: React.ReactNode }) => (
    h('option', { value, disabled }, children ?? null)
  )

  return { Alert: Stub, Button: Stub, Grid: Stub, IconButton: Stub, InputAdornment: Stub, MenuItem, Paper: Stub, Stack: Stub, TextField, Tooltip: Stub, Typography: Stub }
})
vi.mock('@mui/icons-material/RestartAlt', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ArrowBack', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Cancel', () => ({ default: () => null }))
vi.mock('@mui/icons-material/EditOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/SaveOutlined', () => ({ default: () => null }))
vi.mock('@/@core/stores/useWorkingProjectStore', () => ({ useWorkingProject: () => null }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@shared/utils/SwalAlert', () => ({ default: vi.fn() }))
vi.mock('@/features/dynamicform/components/layout/content-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('@/shared/services/projectLookupService', () => ({
  formatProjectLabel: (project: { code: string; name: string }) => `[${project.code}] ${project.name}`
}))

let helpers: typeof import('./apartmentEditHelpers')
let service: typeof import('./services/apartmentSearchService')
let ApartmentEditPage: typeof import('./ApartmentEditPage').default

beforeAll(async () => {
  helpers = await import('./apartmentEditHelpers')
  service = await import('./services/apartmentSearchService')
  ;({ default: ApartmentEditPage } = await import('./ApartmentEditPage'))
})

beforeEach(() => {
  runFODynamic.mockReset()
  runFODynamic.mockResolvedValue({ success: true, code: 'success', errors: [], data: {} })
  codeListCalls.length = 0
  codeListState.isLoading = false
  codeListState.error = null
})

const apartment = (overrides: Partial<ApartmentDetailApartment> = {}): ApartmentDetailApartment => ({
  id: 123, project_id: 1, building_id: 76, floor_id: 100, apartment_code: 'A1-01-55', project_code: 'AGR', building_code: 'A1',
  floor_code: 'A1-F01', floor: '01', unit_number: '55', apartment_type: 'APARTMENT', area: 55.5, water_meter_code: 'W-55',
  water_meter_code2: '', electric_meter_code: '', electricity_meter_code: 'E-55', room_count: 3, handover_date: '', description: '',
  payment_qr_code: null, apartment_status: 'LEASED', status: 'A', ...overrides
})

const dictionary = {
  propertyManagement: {
    apartmentInfo: 'Thông tin căn hộ', apartmentFullCode: 'Mã căn hộ đầy đủ', apartmentType: 'Loại căn hộ', apartmentStatus: 'Trạng thái căn hộ',
    areaWithUnit: 'Diện tích (m²)', roomCount: 'Số lượng phòng', statusA: 'Đang hoạt động', statusI: 'Ngưng hoạt động',
    apartmentStatusLoadError: 'Không tải được danh sách trạng thái căn hộ.'
  },
  common: { status: 'Trạng thái', loading: 'Đang tải, vui lòng đợi...' }
} as any

const render = (overrides: Partial<ApartmentDetailApartment> = {}, locale = 'vi') => {
  textFields.length = 0

  return renderToStaticMarkup(createElement(ApartmentEditPage, {
    dictionary,
    session: null,
    locale,
    apartmentId: 123,
    initialDetail: { apartment: apartment(overrides), project: null, building: null, floor: null }
  } as any))
}
const codeParts = { buildingCode: 'A1', floorNo: '01' }
const preserved = { water_meter_code2: '', electric_meter_code: '' }
const field = (label: string) => textFields.find(props => props.label === label)!
const options = (props: Record<string, any>) => renderToStaticMarkup(createElement('select', null, props.children))
const optionList = (props: Record<string, any>) => [...options(props).matchAll(/<option value="([^"]*)"( disabled="")?>(.*?)<\/option>/g)]
  .map(([, value, disabled, label]) => ({ value, label, disabled: Boolean(disabled) }))

describe('Edit apartment: "Trạng thái căn hộ" (CodeList IPS / APARTMENT_STATUS)', () => {
  it('requests the CodeList IPS / APARTMENT_STATUS in the page language', () => {
    render()

    expect(codeListCalls).toContainEqual({ code_group: 'IPS', code_name: 'APARTMENT_STATUS', language: 'vi' })
  })

  it('LEASED from the detail: form value LEASED, shown as "Đang cho thuê" (VI) / "Leased" (EN)', () => {
    render()
    const vi = field('Trạng thái căn hộ')

    expect(vi.value).toBe('LEASED')
    expect(optionList(vi).find(option => option.value === 'LEASED')?.label).toBe('Đang cho thuê')
    expect(helpers.buildApartmentEditValues(apartment()).apartment_status).toBe('LEASED')

    render({}, 'en')
    expect(optionList(field('Trạng thái căn hộ')).find(option => option.value === 'LEASED')?.label).toBe('Leased')
  })

  it('options come from the CodeList: visible only, sorted by code_index, value = code_value (no hard-coded list)', () => {
    render()

    expect(optionList(field('Trạng thái căn hộ')).slice(1)).toEqual([
      { value: 'OCCUPIED', label: 'Đang ở', disabled: false },
      { value: 'LEASED', label: 'Đang cho thuê', disabled: false },
      { value: 'HOTO', label: 'Đang bàn giao', disabled: false },
      { value: 'VACANT', label: 'Căn hộ trống', disabled: false },
      { value: 'OTHER', label: 'Other', disabled: false }
    ])

    const code = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')

    for (const file of ['./ApartmentEditPage.tsx', './components/ApartmentFormSections.tsx', './hooks/useApartmentStatusCodeList.ts', './ApartmentDetailPage.tsx', './apartmentEditHelpers.ts']) {
      expect(code(file)).not.toMatch(/'(OCCUPIED|LEASED|HOTO|VACANT)'|Đang cho thuê|apartmentStatuses\s*=/)
    }
  })

  it('status A and apartment_status LEASED stay separate', () => {
    render({ status: 'A', apartment_status: 'LEASED' })

    expect(field('Trạng thái').value).toBe('A')
    expect(optionList(field('Trạng thái')).find(option => option.value === 'A')?.label).toBe('Đang hoạt động')
    expect(field('Trạng thái căn hộ').value).toBe('LEASED')
    expect(optionList(field('Trạng thái căn hộ')).map(option => option.value)).not.toContain('A')
  })

  it('a legacy value outside the CodeList is kept as is (selected, shown raw, not reset, not turned into OTHER)', () => {
    render({ apartment_status: 'LEGACY_STATUS' })
    const legacy = field('Trạng thái căn hộ')

    expect(legacy.value).toBe('LEGACY_STATUS')
    expect(optionList(legacy).at(-1)).toEqual({ value: 'LEGACY_STATUS', label: 'LEGACY_STATUS', disabled: true })
    expect(helpers.buildApartmentEditValues(apartment({ apartment_status: 'LEGACY_STATUS' })).apartment_status).toBe('LEGACY_STATUS')
  })

  it('a hidden CodeList value keeps its caption', () => {
    render({ apartment_status: 'RETIRED' })

    expect(optionList(field('Trạng thái căn hộ')).at(-1)).toEqual({ value: 'RETIRED', label: 'Ngừng dùng', disabled: true })
  })

  it('loading / error: no fallback list, the current value is preserved', () => {
    codeListState.isLoading = true
    render()
    expect(field('Trạng thái căn hộ').value).toBe('LEASED')
    expect(field('Trạng thái căn hộ').helperText).toBe('Đang tải, vui lòng đợi...')
    expect(optionList(field('Trạng thái căn hộ')).map(option => option.value)).toEqual(['', 'LEASED'])

    codeListState.isLoading = false
    codeListState.error = new Error('down')
    render()
    expect(field('Trạng thái căn hộ').value).toBe('LEASED')
    expect(field('Trạng thái căn hộ').helperText).toBe('Không tải được danh sách trạng thái căn hộ.')
  })

  it('editable select: enabled, no read-only helper, a change updates apartment_status in the form state', () => {
    render()
    const select = field('Trạng thái căn hộ')

    expect(select.disabled).toBe(false)
    expect(select.helperText).toBeUndefined()
    expect(render()).not.toContain('Chỉ xem')
    expect(typeof select.onChange).toBe('function')
    // the shared select writes the chosen option value (code) into the form state, through the edit hook
    expect(readFileSync(new URL('./components/ApartmentFormSections.tsx', import.meta.url), 'utf8'))
      .toContain('onChange={event => onChange(event.target.value)}')
    expect(readFileSync(new URL('./ApartmentEditPage.tsx', import.meta.url), 'utf8'))
      .toContain("onChange={value => form.updateValue('apartment_status', value)}")
    expect(optionList(select).find(option => option.label === 'Căn hộ trống')?.value).toBe('VACANT')
  })

  it('disabled only while saving or while the CodeList loads', () => {
    expect(readFileSync(new URL('./components/ApartmentFormSections.tsx', import.meta.url), 'utf8')).toContain('disabled={disabled || apartmentStatusCodes.isLoading}')
    codeListState.isLoading = true
    render()
    expect(field('Trạng thái căn hộ').disabled).toBe(true)
  })

  it('LEASED -> VACANT: WF_BO_UPDATE_APARTMENT sends the code "VACANT" (never the caption) with all existing fields', async () => {
    const values = { ...helpers.buildApartmentEditValues(apartment({ apartment_status: 'LEASED' })), apartment_status: 'VACANT' }
    const request = helpers.buildApartmentUpdateRequest(123, values, codeParts, preserved)

    await service.apartmentSearchService.updateApartment({ sessiontoken: 'token', request })
    const call = runFODynamic.mock.calls[0][0]

    expect(call.workflowid).toBe('WF_BO_UPDATE_APARTMENT')
    expect(call.input).toEqual({
      id: 123, building_id: 76, floor_id: 100, apartment_code: 'A1-01-55', unit_number: '55', floor: '01',
      water_meter_code: 'W-55', water_meter_code2: '', electric_meter_code: '', electricity_meter_code: 'E-55',
      apartment_type: 'APARTMENT', apartment_status: 'VACANT', area: '55.5', room_count: 3, handover_date: '', description: '', status: 'A'
    })
    expect(call.input.apartment_status).not.toBe('Căn hộ trống')
  })

  it('apartment_status and status change independently (LEASED/A -> VACANT/I)', async () => {
    const values = { ...helpers.buildApartmentEditValues(apartment({ apartment_status: 'LEASED', status: 'A' })), apartment_status: 'VACANT', status: 'I' }

    await service.apartmentSearchService.updateApartment({ sessiontoken: 'token', request: helpers.buildApartmentUpdateRequest(123, values, codeParts, preserved) })

    expect(runFODynamic.mock.calls[0][0].input).toMatchObject({ apartment_status: 'VACANT', status: 'I' })

    const statusOnly = { ...helpers.buildApartmentEditValues(apartment({ apartment_status: 'LEASED', status: 'A' })), status: 'I' }

    expect(helpers.buildApartmentUpdateRequest(123, statusOnly, codeParts, preserved)).toMatchObject({ apartment_status: 'LEASED', status: 'I' })
  })

  it('legacy value saved unchanged: apartment_status "LEGACY_STATUS" is sent back (not "", OTHER or VACANT)', async () => {
    const values = helpers.buildApartmentEditValues(apartment({ apartment_status: 'LEGACY_STATUS' }))

    await service.apartmentSearchService.updateApartment({ sessiontoken: 'token', request: helpers.buildApartmentUpdateRequest(123, values, codeParts, preserved) })

    expect(runFODynamic.mock.calls[0][0].input.apartment_status).toBe('LEGACY_STATUS')
  })

  it('layout: full code, then type, apartment status, area, room count, then status', () => {
    const html = render()
    const order = ['Mã căn hộ đầy đủ', 'Loại căn hộ', 'Trạng thái căn hộ', 'Diện tích (m²)', 'Số lượng phòng', 'Trạng thái<'].map(text => html.indexOf(text))

    expect(order.every(index => index >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('Create now also carries apartment_status (17-field contract) and shows the same shared select', () => {
    const create = readFileSync(new URL('./ApartmentCreatePage.tsx', import.meta.url), 'utf8')
    const types = readFileSync(new URL('./types.ts', import.meta.url), 'utf8')
    const createRequest = types.slice(types.indexOf('export type ApartmentCreateRequest'), types.indexOf('// Create page form state'))

    expect(create).toContain('apartmentStatusField')
    expect(create).toContain('<ApartmentStatusSelect')
    expect(createRequest).toContain('apartment_status: string')
    expect(createRequest).toContain('status: string')
  })

  it('VI / EN texts; the read-only helper is gone', () => {
    const texts = (locale: string) => JSON.parse(readFileSync(new URL(`../../../data/dictionaries/${locale}.json`, import.meta.url), 'utf8')).propertyManagement

    expect([texts('vi').apartmentStatus, texts('vi').apartmentStatusLoadError]).toEqual(['Trạng thái căn hộ', 'Không tải được danh sách trạng thái căn hộ.'])
    expect([texts('en').apartmentStatus, texts('en').apartmentStatusLoadError]).toEqual(['Apartment status', 'Unable to load apartment statuses.'])
    expect(texts('vi')).not.toHaveProperty('apartmentStatusReadOnlyHelper')
    expect(texts('en')).not.toHaveProperty('apartmentStatusReadOnlyHelper')
    expect(readFileSync(new URL('./ApartmentEditPage.tsx', import.meta.url), 'utf8')).not.toContain('apartmentStatusReadOnlyHelper')
  })
})
