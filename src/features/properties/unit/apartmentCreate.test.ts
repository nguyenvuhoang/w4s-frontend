import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ApartmentCreateFormValues, ApartmentCreateRequest } from './types'

const { runFODynamic, codeListCalls } = vi.hoisted(() => ({ runFODynamic: vi.fn(), codeListCalls: [] as Array<Record<string, unknown>> }))

// CodeLists IPS / APARTMENT_STATUS and IPS / APARTMENT_TYPE (test data only).
vi.mock('@/shared/hooks/useCodeListCaptionMap', () => ({
  useCodeListCaptionMap: (args: Record<string, unknown>) => {
    codeListCalls.push(args)

    const isApartmentType = args.code_name === 'APARTMENT_TYPE'
    const items = isApartmentType
      ? [
          { id: 1, code_id: 'APARTMENT', code_name: 'APARTMENT_TYPE', code_group: 'IPS', code_index: 1, code_value: 'APARTMENT', caption: 'Căn hộ', m_caption: JSON.stringify({ vi: 'Căn hộ', en: 'Apartment' }), visible: true },
          { id: 2, code_id: 'OFFICETEL', code_name: 'APARTMENT_TYPE', code_group: 'IPS', code_index: 2, code_value: 'OFFICETEL', caption: 'Căn hộ văn phòng', m_caption: JSON.stringify({ vi: 'Căn hộ văn phòng', en: 'Office-tel' }), visible: true },
          { id: 3, code_id: 'PENTHOUSE', code_name: 'APARTMENT_TYPE', code_group: 'IPS', code_index: 3, code_value: 'PENTHOUSE', caption: 'Penthouse', m_caption: JSON.stringify({ vi: 'Penthouse', en: 'Penthouse' }), visible: false }
        ]
      : [
          { id: 1, code_id: 'VACANT', code_name: 'APARTMENT_STATUS', code_group: 'IPS', code_index: 1, code_value: 'VACANT', caption: 'Căn hộ trống', m_caption: JSON.stringify({ vi: 'Căn hộ trống', en: 'Vacant' }), visible: true }
        ]

    return {
      items,
      captionMap: new Map(items.map(item => [item.code_value, item.caption])),
      isLoading: false,
      error: null
    }
  }
}))
vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))
vi.mock('@/features/properties/building/buildingService', () => ({ buildingService: {} }))

vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')
  const Stub = ({ children, label }: { children?: React.ReactNode; label?: React.ReactNode }) => h(Fragment, null, label ?? null, children ?? null)

  return { Alert: Stub, Button: Stub, Grid: Stub, IconButton: Stub, InputAdornment: Stub, MenuItem: Stub, Paper: Stub, Stack: Stub, TextField: Stub, Tooltip: Stub, Typography: Stub }
})
vi.mock('@mui/icons-material/RestartAlt', () => ({ default: () => null }))
vi.mock('@mui/icons-material/AddHomeWorkOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Cancel', () => ({ default: () => null }))
vi.mock('@mui/icons-material/SaveOutlined', () => ({ default: () => null }))
vi.mock('@/@core/stores/useWorkingProjectStore', () => ({ useWorkingProject: () => ({ id: 5, code: 'AGR', name: 'AN GIA RIVERSIDE' }) }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@shared/utils/SwalAlert', () => ({ default: vi.fn() }))
vi.mock('@/features/dynamicform/components/layout/content-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('@/shared/components/project-context/RequireWorkingProject', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('@/shared/services/projectLookupService', () => ({
  formatProjectLabel: (project: { code: string; name: string }) => `[${project.code}] ${project.name}`
}))

let service: typeof import('./services/apartmentSearchService')
let helpers: typeof import('./apartmentCreateHelpers')
let ApartmentCreatePage: typeof import('./ApartmentCreatePage').default

beforeAll(async () => {
  service = await import('./services/apartmentSearchService')
  helpers = await import('./apartmentCreateHelpers')
  ;({ default: ApartmentCreatePage } = await import('./ApartmentCreatePage'))
})

beforeEach(() => {
  runFODynamic.mockReset()
  runFODynamic.mockResolvedValue({ success: true, code: 'success', errors: [], data: {} })
})

const readSource = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')
const SECTIONS_FILE = './components/ApartmentFormSections.tsx'

const CONTRACT_FIELDS = [
  'apartment_code', 'apartment_status', 'apartment_type', 'area', 'building_id', 'description', 'electric_meter_code', 'electricity_meter_code',
  'floor', 'floor_id', 'handover_date', 'project_id', 'room_count', 'status', 'unit_number', 'water_meter_code', 'water_meter_code2'
]

const values = (overrides: Partial<ApartmentCreateFormValues> = {}): ApartmentCreateFormValues => ({
  ...(helpers?.emptyApartmentCreateValues ?? {}),
  building_id: 2,
  floor_id: 25,
  unit_number: ' 01 ',
  apartment_type: 'APARTMENT',
  area: ' 72.5 ',
  room_count: '3',
  handover_date: '2026-06-15',
  water_meter_code: '  W-01 ',
  electricity_meter_code: ' E-01  ',
  description: ' note ',
  ...overrides
} as ApartmentCreateFormValues)

const selectedFloor = { id: 25, floor_code: 'VGP-S1-F15', name: 'Tầng 15', status: 'A', floor_no: '15' }
const selectedBuilding = { id: 2, building_code: 'A1', name: 'Tháp A1', status: 'A' }
const codeParts = { buildingCode: 'A1', floorNo: '15' }

describe('WF_BO_CREATE_APARTMENT request', () => {
  it('builds all 17 contract fields with the confirmed mappings (status / apartment_status included)', () => {
    const request = helpers.buildApartmentCreateRequest(5, values({ apartment_status: 'VACANT' }), codeParts)

    expect(Object.keys(request).sort()).toEqual(CONTRACT_FIELDS)
    expect(request).toEqual({
      project_id: 5,
      building_id: 2,
      floor_id: 25,
      apartment_code: 'A1-15-01',
      unit_number: '01',
      floor: '15',
      water_meter_code: 'W-01',
      water_meter_code2: '',
      electric_meter_code: '',
      electricity_meter_code: 'E-01',
      apartment_type: 'APARTMENT',
      apartment_status: 'VACANT',
      area: '72.5',
      room_count: 3,
      handover_date: '2026-06-15T00:00:00Z',
      description: 'note',
      status: 'A'
    })
  })

  it('form defaults: status "A", apartment_status "" (chosen by the user, no business default), meters empty', () => {
    expect(helpers.emptyApartmentCreateValues).toMatchObject({ status: 'A', apartment_status: '', water_meter_code: '', electricity_meter_code: '' })

    const request = helpers.buildApartmentCreateRequest(5, values(), codeParts)

    expect(request.status).toBe('A')
    expect(request.apartment_status).toBe('')
    expect(helpers.buildApartmentCreateRequest(5, values({ status: 'I', apartment_status: 'LEASED' }), codeParts))
      .toMatchObject({ status: 'I', apartment_status: 'LEASED' })
  })

  it('sends "" for an empty handover date / area / type and 0 for an empty room count (never NaN)', () => {
    const request = helpers.buildApartmentCreateRequest(5, values({ handover_date: '', area: '', apartment_type: '', room_count: '' }), codeParts)

    expect(request.handover_date).toBe('')
    expect(request.area).toBe('')
    expect(request.apartment_type).toBe('')
    expect(request.room_count).toBe(0)
  })

  it('preserves the selected apartment type CodeValue in the create payload, never its caption', () => {
    const request = helpers.buildApartmentCreateRequest(5, values({ apartment_type: 'OFFICETEL' }), codeParts)

    expect(request.apartment_type).toBe('OFFICETEL')
    expect(request.apartment_type).not.toBe('Căn hộ văn phòng')
  })

  it('service sends exactly the contract fields incl. status / apartment_status (no owner_name) and returns the new id', async () => {
    runFODynamic.mockResolvedValue({ success: true, code: 'success', errors: [], data: { apartment: { id: 321 } } })

    const request = { ...helpers.buildApartmentCreateRequest(5, values({ apartment_status: 'VACANT' }), codeParts), owner_name: 'X' } as ApartmentCreateRequest
    const id = await service.apartmentSearchService.createApartment({ sessiontoken: 'token', request })
    const call = runFODynamic.mock.calls[0][0]

    expect(call.workflowid).toBe('WF_BO_CREATE_APARTMENT')
    expect(Object.keys(call.input).sort()).toEqual(CONTRACT_FIELDS)
    expect(call.input).toMatchObject({ status: 'A', apartment_status: 'VACANT', water_meter_code: 'W-01', electricity_meter_code: 'E-01' })
    expect(id).toBe(321)
  })

  it('returns null when the response has no id, and surfaces workflow errors', async () => {
    await expect(service.apartmentSearchService.createApartment({ sessiontoken: 'token', request: helpers.buildApartmentCreateRequest(5, values(), codeParts) })).resolves.toBeNull()

    runFODynamic.mockResolvedValue({ success: false, code: 'failed', errors: [{ info: 'Apartment code exists' }], execution_id: 'EXEC-A' })

    await expect(service.apartmentSearchService.createApartment({ sessiontoken: 'token', language: 'vi', request: helpers.buildApartmentCreateRequest(5, values(), codeParts) }))
      .rejects.toThrow('Apartment code exists Mã tra cứu lỗi: EXEC-A')
  })
})

describe('floor mapping and validation', () => {
  it('floor = floor_no of the selected floor, falling back to the number derived from its code', () => {
    expect(helpers.resolveApartmentFloorNo(selectedFloor)).toBe('15')
    expect(helpers.resolveApartmentFloorNo({ floor_no: '', floor_code: 'VGP-S1-F07' })).toBe('07')
    expect(helpers.resolveApartmentFloorNo({ floor_no: '', floor_code: 'ROOFTOP' })).toBeNull()
    expect(helpers.resolveApartmentFloorNo(null)).toBeNull()
  })

  it('requires project, tower (with a code), floor (with a floor number) and unit number; checks area and room count', () => {
    expect(helpers.validateApartmentCreate(5, values(), selectedBuilding, selectedFloor)).toEqual([])
    expect(helpers.validateApartmentCreate(null, values({ building_id: null, floor_id: null, unit_number: ' ' }), null, null))
      .toEqual(['project', 'building_id', 'floor_id', 'unit_number'])
    expect(helpers.validateApartmentCreate(5, values(), { building_code: ' ' }, selectedFloor)).toEqual(['building_code'])
    expect(helpers.validateApartmentCreate(5, values(), selectedBuilding, { floor_no: '', floor_code: 'ROOFTOP' })).toEqual(['floor_no'])
    expect(helpers.validateApartmentCreate(5, values({ area: 'abc', room_count: '2.5' }), selectedBuilding, selectedFloor)).toEqual(['area', 'room_count'])
    // optional Backend fields stay optional (apartment_status included)
    expect(helpers.validateApartmentCreate(5, values({ apartment_type: '', apartment_status: '', area: '', room_count: '', handover_date: '', description: '' }), selectedBuilding, selectedFloor)).toEqual([])
  })

  it('status is required like on the edit page', () => {
    expect(helpers.validateApartmentCreate(5, values({ status: ' ' }), selectedBuilding, selectedFloor)).toEqual(['status'])
  })
})

describe('area (m²): numeric input, raw value in the request, unit only on display', () => {
  it('accepts empty or a non-negative decimal, rejects text / units / sign / exponent', async () => {
    const { isValidAreaInput } = await import('./apartmentHelpers')

    for (const valid of ['', '  ', '0', '10', '55', '55.5', '72.25']) expect(isValidAreaInput(valid)).toBe(true)
    for (const invalid of ['abc', '50m2', '50 m²', '-5', '1e3', '0x10', '55.', '1,5']) expect(isValidAreaInput(invalid)).toBe(false)
    expect(helpers.validateApartmentCreate(5, values({ area: '50 m²' }), selectedBuilding, selectedFloor)).toEqual(['area'])
    expect(helpers.validateApartmentCreate(5, values({ area: '55.5' }), selectedBuilding, selectedFloor)).toEqual([])
  })

  it('keystroke filter only lets digits and one decimal point through', async () => {
    const { isAreaDraftInput } = await import('./apartmentHelpers')

    for (const draft of ['', '5', '55.', '55.5', '72.25']) expect(isAreaDraftInput(draft)).toBe(true)
    for (const blocked of ['abc', '50m2', '50 m²', '-1', '1.2.3', '1e3']) expect(isAreaDraftInput(blocked)).toBe(false)
  })

  it('sends the raw area string (no rounding, no m²) and formats "55.5 m²" only for display', async () => {
    const { formatApartmentArea } = await import('./apartmentHelpers')
    const request = helpers.buildApartmentCreateRequest(5, values({ area: '55.5' }), codeParts)

    expect(request.area).toBe('55.5')
    expect(helpers.buildApartmentCreateRequest(5, values({ area: '72.25' }), codeParts).area).toBe('72.25')
    expect(formatApartmentArea(55.5)).toBe('55.5 m²')
    expect(formatApartmentArea('55.5')).toBe('55.5 m²')
    expect(formatApartmentArea(null)).toBe('-')
    expect(formatApartmentArea('')).toBe('-')
  })

  it('create and edit pages share the "Area (m²)" field (decimal keyboard, numeric filter); list/detail use the formatter', () => {
    const sections = readSource(SECTIONS_FILE)

    expect(sections).toContain("apartmentText(dictionary, 'areaWithUnit', 'Area (m²)')")
    expect(sections).toContain("slotProps={{ htmlInput: { inputMode: 'decimal' } }}")
    expect(sections).toContain("if (isAreaDraftInput(event.target.value)) updateValue('area', event.target.value)")
    for (const page of [readSource('./ApartmentCreatePage.tsx'), readSource('./ApartmentEditPage.tsx')]) {
      expect(page).toContain('<ApartmentInfoSection')
    }
    expect(readSource('./ApartmentDetailPage.tsx')).toContain("value: apt.area === null ? '--' : formatApartmentArea(apt.area)")
    expect(readSource('./ApartmentTable.tsx')).toContain('{formatApartmentArea(row.area)}')
  })
})

describe('full apartment code generation (Tower – Floor – Unit)', () => {
  const code = (buildingCode: string, floorNo: string, unitNumber: string) => helpers.buildApartmentCode({ buildingCode, floorNo, unitNumber })

  it('joins tower code, floor number and unit number, keeping leading zeros', () => {
    expect(code('A1', '01', '01')).toBe('A1-01-01')
    expect(code('AG', '03', '02')).toBe('AG-03-02')
    expect(code('AG', '03', '05')).toBe('AG-03-05')
    expect(code('A1', '01', '001')).toBe('A1-01-001')
    expect(code('A1', '01', '1')).toBe('A1-01-1') // never padded

    expect(code(' A1 ', ' 01', '01 ')).toBe('A1-01-01')
  })

  it('returns "" when any segment is missing (no partial codes)', () => {
    expect(code('', '01', '01')).toBe('')
    expect(code('A1', '', '01')).toBe('')
    expect(code('A1', '01', '')).toBe('')
    expect(code('A1', '01', '   ')).toBe('')
    expect(helpers.buildApartmentCode({ buildingCode: null, floorNo: undefined, unitNumber: '01' })).toBe('')
  })

  it('follows tower, floor and unit changes live (floor number from floor_no, else derived from floor_code)', () => {
    const a1 = { building_code: 'A1' }
    const ag = { building_code: 'AG' }
    const floor01 = { floor_no: '01', floor_code: 'X-F01' }
    const floor02 = { floor_no: '', floor_code: 'AG-F02' }

    expect(helpers.getGeneratedApartmentCode(a1, floor01, '01')).toBe('A1-01-01')
    expect(helpers.getGeneratedApartmentCode(ag, floor01, '01')).toBe('AG-01-01')
    expect(helpers.getGeneratedApartmentCode(ag, floor02, '01')).toBe('AG-02-01')
    expect(helpers.getGeneratedApartmentCode(ag, floor02, '05')).toBe('AG-02-05')
    expect(helpers.getGeneratedApartmentCode(ag, { floor_no: '', floor_code: 'ROOFTOP' }, '05')).toBe('')
    expect(helpers.getGeneratedApartmentCode(null, floor01, '05')).toBe('')
  })

  it('submits the generated code as apartment_code while unit_number and floor keep their own values', () => {
    const request = helpers.buildApartmentCreateRequest(1, values({ building_id: 76, floor_id: 100, unit_number: ' 01 ' }), { buildingCode: 'A1', floorNo: '01' })

    expect(request).toMatchObject({ project_id: 1, building_id: 76, floor_id: 100, apartment_code: 'A1-01-01', unit_number: '01', floor: '01' })
  })

  it('the code is editable: auto from the formula by default, custom once typed, restorable', () => {
    const page = readSource('./ApartmentCreatePage.tsx')
    const sections = readSource(SECTIONS_FILE)
    const hook = readSource('./hooks/useApartmentCreateForm.ts')

    expect(page).toContain('apartmentCode={form.apartmentCode}')
    expect(page).toContain('onApartmentCodeChange={form.changeApartmentCode}')
    expect(page).toContain('onApartmentCodeRestore={form.restoreApartmentCode}')
    expect(sections).toContain('value={apartmentCode}')
    expect(sections).not.toContain('readOnly: true')
    expect(sections).not.toContain("updateValue('apartment_code'")
    expect(sections).toContain('onChange={event => onApartmentCodeChange(event.target.value)}')
    expect(sections).toContain("apartmentText(dictionary, 'apartmentFullCodeHelper', 'Automatically generated from Tower – Floor – Unit')")
    expect(sections).toContain("apartmentText(dictionary, 'apartmentFullCodeRestore', 'Restore default')")
    expect(hook).toContain('const generatedApartmentCode = getGeneratedApartmentCode(selectedBuilding, selectedFloor, values.unit_number)')
    expect(hook).toContain('const apartmentCode = resolveApartmentCodeInput(customApartmentCode, generatedApartmentCode)')
    expect(hook).toContain('buildApartmentCreateRequest(projectId, values, { buildingCode, floorNo, apartmentCode })')
    expect(hook).toContain('if (!buildingCode || !floorNo || !apartmentCode.trim()) return')
  })

  it('auto / custom mode: custom code wins over the formula, is trimmed on submit and required when blank', () => {
    expect(helpers.resolveApartmentCodeInput(null, 'A-1-1')).toBe('A-1-1')
    expect(helpers.resolveApartmentCodeInput('BLOCK-A-001', 'A-2-1')).toBe('BLOCK-A-001')
    expect(helpers.resolveApartmentCodeInput('', 'A-2-1')).toBe('')
    expect(helpers.isCustomApartmentCodeMissing(null)).toBe(false)
    expect(helpers.isCustomApartmentCodeMissing('  ')).toBe(true)
    expect(helpers.isCustomApartmentCodeMissing('A-001-CUSTOM')).toBe(false)

    const request = helpers.buildApartmentCreateRequest(1, values({ building_id: 76, floor_id: 100, unit_number: '01' }), { buildingCode: 'A1', floorNo: '01', apartmentCode: '  A-001-CUSTOM ' })

    expect(request).toMatchObject({ apartment_code: 'A-001-CUSTOM', unit_number: '01', floor: '01' })
    expect(helpers.buildApartmentCreateRequest(1, values({ unit_number: '01' }), { buildingCode: 'A1', floorNo: '01', apartmentCode: 'A1-01-01' }).apartment_code).toBe('A1-01-01')
  })
})

describe('create page and flow', () => {
  const dictionary = {
    propertyManagement: {
      addApartment: 'Thêm căn hộ',
      apartmentCreateSectionLocation: 'Vị trí căn hộ',
      apartmentInfo: 'Thông tin căn hộ',
      apartmentCreateSectionTechnical: 'Thông tin kỹ thuật',
      apartmentCreateSectionHandover: 'Bàn giao & mô tả',
      roomCount: 'Số phòng',
      handoverDate: 'Ngày bàn giao',
      ownerName: 'Chủ hộ',
      apartmentStatus: 'Trạng thái căn hộ',
      apartmentFullCode: 'Mã căn hộ đầy đủ',
      apartmentFullCodeHelper: 'Tự động tạo theo Tháp – Tầng – Căn',
      apartmentNo: 'Số căn hộ',
      apartmentType: 'Loại căn hộ',
      areaWithUnit: 'Diện tích (m²)',
      statusA: 'Đang hoạt động',
      statusI: 'Ngưng hoạt động'
    },
    common: { description: 'Mô tả', status: 'Trạng thái' }
  } as any

  it('has the 4 sections, both statuses, room count, handover date and description, and no owner field', () => {
    const html = renderToStaticMarkup(createElement(ApartmentCreatePage, { dictionary, session: null, locale: 'vi' }))

    for (const text of ['Vị trí căn hộ', 'Thông tin căn hộ', 'Thông tin kỹ thuật', 'Bàn giao &amp; mô tả', 'Số phòng', 'Ngày bàn giao', 'Mô tả', 'Mã căn hộ đầy đủ', 'Số căn hộ', 'Trạng thái căn hộ', 'Trạng tháiĐang hoạt động', 'Căn hộ trống']) {
      expect(html).toContain(text)
    }
    expect(html).not.toContain('Chủ hộ')
    expect(codeListCalls).toContainEqual({ code_group: 'IPS', code_name: 'APARTMENT_STATUS', language: 'vi' })
    expect(codeListCalls).toContainEqual({ code_group: 'IPS', code_name: 'APARTMENT_TYPE', language: 'vi' })
    expect(html).toContain('Căn hộ văn phòng')
    expect(html).not.toContain('Penthouse')

    // project comes from the working project context, locked, and is still sent as project_id
    const page = readSource('./ApartmentCreatePage.tsx')

    expect(page).toContain("projectLabel={form.project ? formatProjectLabel(form.project) : ''}")
    expect(hook).toContain('const projectId = project?.id ?? null')
  })

  it('renders Số căn hộ once, inside Vị trí căn hộ: [Dự án] [Tháp] [Tầng] [Số căn hộ] (DOM order), then the full code first in Thông tin căn hộ', () => {
    const html = renderToStaticMarkup(createElement(ApartmentCreatePage, { dictionary, session: null, locale: 'vi' }))

    expect(html.split('Số căn hộ').length - 1).toBe(1)
    expect(html.indexOf('Vị trí căn hộ')).toBeLessThan(html.indexOf('Số căn hộ'))
    expect(html.indexOf('Số căn hộ')).toBeLessThan(html.indexOf('Thông tin căn hộ'))

    const page = readSource(SECTIONS_FILE)
    const order = [
      "'apartmentCreateSectionLocation'",
      "'project', 'Project'",
      "'building', 'Tower'",
      "'floor', 'Floor'",
      "'apartmentNo', 'Unit Code'",
      "'apartmentInfo'",
      "'apartmentFullCode'",
      "'apartmentType'",
      "'areaWithUnit', 'Area (m²)'",
      "'roomCount'"
    ].map(marker => page.indexOf(marker))

    expect(order.every(index => index >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(page.split("'apartmentNo', 'Unit Code'").length - 1).toBe(1)
  })

  it('Thông tin căn hộ: [type][apartment status][status] on the first desktop row, then [area][room count]; one per row on mobile', () => {
    const html = renderToStaticMarkup(createElement(ApartmentCreatePage, { dictionary, session: null, locale: 'vi' }))
    const order = ['Mã căn hộ đầy đủ', 'Loại căn hộ', 'Trạng thái căn hộ', 'Trạng tháiĐang hoạt động', 'Diện tích (m²)', 'Số phòng'].map(text => html.indexOf(text))

    expect(order.every(index => index >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)

    const sections = readSource(SECTIONS_FILE)
    const page = readSource('./ApartmentCreatePage.tsx')

    expect(sections).toMatch(/const fieldSize = statusField\s+\? \{ xs: 12, md: 4 \}/)
    expect(sections).toContain('const measureSize = statusField ? { xs: 12, md: 6 } : fieldSize')
    expect(page).toContain('statusField={')
    expect(page).toContain("onChange={value => form.updateValue('apartment_status', value)}")
    expect(page).toContain("onChange={value => form.updateValue('status', value)}")
  })

  const hook = readFileSync(new URL('./hooks/useApartmentCreateForm.ts', import.meta.url), 'utf8')

  it('cascades from the real search services: project change clears tower/floor, tower change clears floor', () => {
    const options = readSource('./hooks/useApartmentLocationOptions.ts')

    expect(hook).toContain('setValues(existing => ({ ...existing, building_id: null, floor_id: null }))')
    expect(hook).toContain('useApartmentLocationOptions({ dictionary, sessiontoken, locale, projectId })')
    expect(options).toContain('apartmentSearchService.simpleSearchBuildings(')
    expect(hook).toContain('setValues(current => ({ ...current, building_id: buildingId, floor_id: null }))')
    expect(hook).toContain('await location.loadFloors(buildingId)')
    expect(options).toContain('apartmentSearchService.simpleSearchFloors(')
    for (const source of [hook, options]) expect(source).not.toMatch(/propertyAggregateService|_seed|create_apartment/)
  })

  it('goes to the new apartment detail (or the list without id) only after success, and stays on error', () => {
    const submit = hook.slice(hook.indexOf('const submit = async'), hook.indexOf('return {\n    project'))
    const tryBlock = submit.slice(submit.indexOf('try {'), submit.indexOf('} catch'))
    const catchBlock = submit.slice(submit.indexOf('} catch'), submit.indexOf('} finally'))

    expect(tryBlock).toContain('router.push(createdId ? `/${locale}/properties/unit/${createdId}` : `/${locale}/properties/unit`)')
    expect(catchBlock).toContain('setSubmitError(')
    expect(catchBlock).not.toContain('router.push')
    expect(submit.indexOf('if (invalid.length > 0 || !projectId) return')).toBeLessThan(submit.indexOf('createApartment'))
  })

  it('list page navigates to the create page (permission ADD) instead of opening the old drawer', () => {
    const list = readFileSync(new URL('./ApartmentManagementPage.tsx', import.meta.url), 'utf8')

    expect(list).toContain('<PermissionGuard href="/properties/unit" action="ADD">')
    expect(list).toContain("onClick={() => router.push(`/${locale}/properties/unit/create`)}")
    expect(list).not.toMatch(/Drawer|create_apartment|propertyAggregateService|owner_name/)
  })

  it('floor options keep floor_no from the real Floor search', () => {
    const source = readFileSync(new URL('./services/apartmentSearchService.ts', import.meta.url), 'utf8')

    expect(source).toContain('floor_no: floor.floor_no')
  })
})
